/*!
 * raymon
 * Copyright(c) 2019 Mohammad Shams
 * MIT Licensed
 */

'use strict';
const serverController = require('./src/server/server_controller');
const baseServer = new serverController({
    port: 9933,
});

const testServer = new serverController({
    port: 9934,
});

function Start() {
    baseServer.start();
    testServer.start();

    baseServer.listen("hey", (params, user) => {
        baseServer.say("salaaam",user,{"msg":"Salam"});
    });
}

Start();