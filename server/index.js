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

        chatServer.sayAll("message", message);

        message.user_id = message.user.id;
        delete message.user;
        delete message.uid;
        global.mainDb.insert(message);
    });

    chatServer.start();
}

start();