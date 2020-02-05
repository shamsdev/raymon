/*!
 * raymon
 * Copyright(c) 2019 Mohammad Shams
 * MIT Licensed
 */

'use strict';
const Datastore = require('nedb'),
    db = new Datastore({filename: './server/db/datastore', autoload: true}),
    usersDb = new Datastore({filename: './server/db/users', autoload: true});

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
            name: user.data.publicData.displayName,
            avatar: user.data.publicData.avatar
        });

        global.mainDb.find({}).sort({time: -1}).limit(30).exec((err, docs) => {
            chatServer.say("update", user, docs)
        })
    });


    chatServer.listen("message", async (params, user) => {
        let message = {
            uid: params.uid,
            user: {
                id: user.data._id,
                name: user.data.publicData.displayName,
                avatar: user.data.publicData.avatar
            },
            text: params.text,
            time: new Date().getTime()
        };

        await global.mainDb.insert(message);
        chatServer.sayAll("message", message);
    });

    chatServer.start();
}

start();