"use strict";

const config = require('./src/config/config');
const server = require('./src/server/server_controller');

server.init(config.server);
server.addRequestHandler("ping", require('./request_handlers/ping_pong'));
server.start();