"use strict";

class user {
    id;
    socket;
    connect_time;
    variable;

    constructor(socket) {
        this.socket = socket;
        this.id = socket.id;
        this.connect_time = new Date();
        this.variable = {};
    }
}

module.exports = user;