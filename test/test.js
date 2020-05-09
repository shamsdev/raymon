'use strict';

const {RaymonServer} = require('../lib/');
const server = new RaymonServer();
server.start();

let room = server.createRoom();
room.addMessageHandler('set_name', (args) => {
    server.sendMessage(args.user, "ok got your name :)", {});
});

server.addMessageHandler("hey", (args) => {
    server.sendMessage(args.user, "hey", {});
});

let onConnectHandler = function (args) {
    console.log('user connect: ' + args.user.id);
    server.sendMessage(args.user, "hey", {});
    room.addUser(args.user);
    room.sendMessage('hey_from_group', {});
};

server.addEventHandler('user_connect', onConnectHandler);

server.addEventHandler('user_disconnect', (args) => {
    console.log('user disconnected: ' + args.user.id);
    console.log('session time: ' + args.user.sessionTime + 's');
});

setTimeout(() => {
    server.stop();
    process.exit(0);
}, 1000);
