"use strict";
var functions = require('firebase-functions');
let admin = require('firebase-admin');

admin.initializeApp(functions.config().firebase);

exports.dappUp = functions.database.ref('/notifications/{userUid}/{primaryKey}').onWrite(event => {
    let notif = event.data.val();

    return loadUser(event.params.userUid).then(user => {
        let token = user.push_token;
        let payload = {
          data: {
              msg: notif.message,
              from_group: notif.meta.from_group,
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
                type: 'chat'
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
