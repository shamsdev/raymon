"use strict";

class user {
    id;
    socket;
    connect_time;
    data;

    constructor(socket) {
        this.socket = socket;
        this.id = socket.id;
        this.connect_time = new Date();
        this.data = {};
    }
}

module.exports = user;