'use strict';

const {RaymonServer} = require('../lib/');
const server = new RaymonServer();
server.start();

let room = server.createRoom();

server.addRequestHandler("hey",(socket,user,packet)=>{

});

setTimeout(() => {
    server.stop();
    process.exit(0);
}, 1000);
