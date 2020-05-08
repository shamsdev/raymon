'use strict';

const {RaymonServer} = require('../lib/');
const server = new RaymonServer();
server.start();

let room = server.createRoom();
room.sendAll();

server.addRequestHandler("hey", (args) => {
    server.sendMessage(args.user, "hey", {});
});

server.addEventHandler(RaymonServer.EventHandler.OnUserConnect, (args) => {
    console.log('user connect: ' + args.user.id);
    server.sendMessage(args.user, "hey", {});
});

server.addEventHandler(RaymonServer.EventHandler.OnUserDisconnect, (args) => {
    console.log('user disconnected: ' + args.user.id);
    console.log('session time: ' + args.user.sessionTime + 's');
});

setTimeout(() => {
    server.stop();
    process.exit(0);
}, 1000);
