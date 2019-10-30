"use strict";

module.exports = (server, params, user) => {
    server.send(user, "pong", null);
};