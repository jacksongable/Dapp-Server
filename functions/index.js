var functions = require('firebase-functions');
let admin = require('firebase-admin');

admin.initializeApp(functions.config().firebase);

exports.dappUp = functions.database.ref('/requests/{pushId}').onWrite(event => {
    let req = event.data.val();

    return loadUser(req.to).then(user => {
        let token = user.push_token;
        let payload = {
          data: {
              fromName: req.fromName,
              fromId: req.from,
              gid: user.group,
              type: 'request'
            }
        };
        return admin.messaging().sendToDevice(token, payload);
    });
});

exports.sendChat = functions.database.ref('/chats/{chatId}/messages/{msgId}').onWrite(event => {
    let message = event.data.val();

    return loadUser(message.to).then(user => {
        let token = user.push_token;
        let payload = {
            data: {
                sender_name: message.sender_name,
                text: message.text,
                type: 'chat',
                conversationKey: message.parent().parent().name()
            }
        };
        return admin.messaging().sendToDevice(token, payload);
    });
});

function loadUser(key) {
    let dbRef = admin.database().ref('/users/' + key);
    let defer = new Promise((resolve, reject) => {
        dbRef.once('value', (snap) => {
            let user = snap.val();
            resolve(user);
        }, (err) => {
            reject(err);
        });
    });
    return defer;
}
