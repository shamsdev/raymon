'use strict';

const {RaymonServer} = require('../lib/');
const server = new RaymonServer();
server.start();

let room = server.createRoom();
room.sendAll();

server.addRequestHandler("hey", (args) => {

});

server.addEventHandler(RaymonServer.EventHandler.OnUserDisconnect, (args) => {

});

setTimeout(() => {
    server.stop();
    process.exit(0);
}, 1000);
