"use strict";

const config = require('./src/config/config.json');
const server = require('./src/server/server_controller.js');

server.init(config.server);
server.addRequestHandler("name", require('./src/request_handlers/set_name_request_handler.js'));
server.addRequestHandler("chat", require('./src/request_handlers/chat_handler.js'));
server.start();
