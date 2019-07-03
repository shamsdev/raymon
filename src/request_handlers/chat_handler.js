"use strict";

module.exports = (server, message, user) => {
    let msg = {
        name: user.variable["name"],
        message: message
    };

    server.sendAll("chat", msg);
};