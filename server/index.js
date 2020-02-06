/*!
 * raymon
 * Copyright(c) 2019 Mohammad Shams
 * MIT Licensed
 */

'use strict';
const Datastore = require('nedb'),
    db = new Datastore({filename: 'server/db/datastore', autoload: true}),
    usersDb = new Datastore({filename: 'server/db/users', autoload: true});

const serverController = require('./src/base_server/server_controller');
const panelController = require('./src/panel/panel_controller');

const baseServer = new serverController({
    port: 9933,
});

const chatServer = new serverController({
    port: 9934,
});


function start() {
    setupGlobals();

    /*    baseServer.start();

        baseServer.listen("message", (params, user) => {
            console.log("mess");
            baseServer.sayAll("update", null);
        });*/

    panelController.init({port: 5000});
    panelController.start();

    setupChatServer();
}

function setupGlobals() {
    global.mainDb = db;
    global.usersDb = usersDb;

    /*    global.usersDb.insert({
            username:"ehsan",
            password: "333",
            publicData:{
                displayName:"Shotor",
                avatar:"http://localhost:5000/img/avatar_def.png"
            }
        });*/
}

function setupChatServer() {
    chatServer.listenInternal(serverController.serverHandler.OnUserConnect, async (user) => {
        chatServer.say("init_data", user, {
            id: user.data._id,
            ...user.data.publicData
        });

        global.mainDb.find({}).sort({time: -1}).limit(30).exec((err, docs) => {
            if (docs === null || docs.length === 0) {
                chatServer.say("update", user, docs);
                return;
            }

            let changedCount = 0;
            for (let i = 0; i < docs.length; i++) {
                global.usersDb.find({_id: docs[i].user_id}).exec((err, msgUser) => {
                    docs[i].user = msgUser[0].publicData;
                    docs[i].user.id = docs[i].user_id;
                    delete docs[i].user_id;
                    changedCount++

                    if (changedCount === docs.length)
                        chatServer.say("update", user, docs);
                });
            }
        })
    });

    chatServer.listen("message", async (params, user) => {
        let message = {
            uid: params.uid,
            user: {
                id: user.data._id,
                ...user.data.publicData
            },
            text: params.text,
            time: new Date().getTime()
        };

        if (message.text.toLowerCase().substr(0, 8) === "/adduser") {
            try {
                let commands = message.text.split(" ");
                let displayName = commands[1];
                let username = commands[2];
                let password = commands[3];

                if (!displayName || !username || !password) {
                    message.text = 'Invalid command parameters';
                    chatServer.say("message", user, message);
                    return;
                }

                global.usersDb.insert({
                    username: username,
                    password: password,
                    publicData: {
                        displayName: displayName,
                        avatar: "https://static1.squarespace.com/static/54b7b93ce4b0a3e130d5d232/54e20ebce4b014cdbc3fd71b/5a992947e2c48320418ae5e0/1519987239570/icon.png"
                    }
                });

                message.text = `User '${displayName}' has been added.`;
                chatServer.say("message", user, message);
                return;
            } catch (e) {
                message.text = `Error: ${e.message}`;
                chatServer.say("message", user, message);
                console.log(e);
            }
        }

        chatServer.sayAll("message", message);
        message.user_id = message.user.id;
        delete message.user;
        delete message.uid;
        global.mainDb.insert(message);
    });

    chatServer.start();
}

start();