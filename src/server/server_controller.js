"use strict";

const io = require('socket.io');
const user = require('./user.js');

class server_controller {
    static config;
    static server;
    static requestHandlersList = [];
    static usersList = [];

    static init(config) {
        this.config = config;
    }

    static addRequestHandler(cmd, func) {
        this.requestHandlersList.push({
            cmd: cmd, func: func
        });

        console.log("Request handler added : " + cmd);
    }

    static start() {
        this.server = io.listen(this.config.port);
        console.log('Server running on port : ' + this.config.port);

        this.server.on('connection', function (socket) {
            server_controller.onClientConnected(socket);
            socket.on('disconnect', function () {
                server_controller.onClientDisconnected(socket);
            });

        });
    }

    static send(cmd, user, params) {
        user.socket.emit(cmd, JSON.stringify(params));
    }

    static sendAll(cmd, params) {
        this.server.sockets.emit(cmd, JSON.stringify(params));
    }

    static getAllUsers() {
        return this.usersList;
    }

    static onClientConnected(socket) {
        let currentUser = new user(socket);

        this.usersList.push(currentUser);

        this.requestHandlersList.forEach((item) => {
            socket.on(item.cmd, (message) => {
                item.func(this, message, currentUser);
            });
        });

        console.log('Client Connected : ' + currentUser.id);
    }

    static onClientDisconnected(socket) {
        let disconnectedClient;

        for (let i = 0; i < this.usersList.length; i++)
            if (this.usersList[i].socket.id === socket.id) {
                disconnectedClient = this.usersList[i];
                this.usersList.splice(i, 1);
            }

        console.log('Client Disconnected : ' + disconnectedClient.id + " - Session time : "
            + ((new Date() - disconnectedClient.connect_time) / 1000) + "s");
    }
}

module.exports = server_controller;