'use strict';

const {RaymonServer} = require('../lib/');
const server = new RaymonServer();
server.start();

setTimeout(() => {
    server.stop();
    process.exit(0);
}, 1000);
