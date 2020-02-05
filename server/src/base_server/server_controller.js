const io = require('socket.io');
const user = require('./models/user');
const jwt = require('socketio-jwt');


class server_controller {
    static serverHandler = {
        OnUserConnect: "CMD_OnUserConnect",
        OnUserDisconnect: "CMD_OnUserDisconnect"
    };

    static defaultConfig = {
        port: 9933,
        pingInterval: 1000,
        pingTimeout: 5000,
    };

    #config;
    #server;
    #requestHandlersList = [];
    #serverHandlersList = {};
    #usersList = [];

    constructor(config = server_controller.defaultConfig) {
        this.#config = config;
    }

    start() {
        this.#server = io.listen(this.#config.port, {
            pingInterval: this.#config.pingInterval,
            pingTimeout: this.#config.pingTimeout,
        });

        console.log('Server running on port : ' + this.#config.port);

        this.#server.on('connection', jwt.authorize({
            secret: (request, decodedToken, callback) => {

                global.usersDb.find({username: decodedToken.username, password: decodedToken.password})
                    .limit(1).exec((err, docs) => {
                    if (err) {
                        callback(null, "err");
                    } else {
                        if (docs === null || docs.length === 0)
                            callback(null, "err");
                        else
                            callback(null, docs[0].password);
                    }
                });
            },
            handshake: false,
            timeout: 15000
        })).on('authenticated', (socket) => {
            //const username = socket.decoded_token.username;
            //const password = socket.decoded_token.password;
            this._onClientConnected(socket);
            socket.on('disconnect', () => {
                this._onClientDisconnected(socket);
            });
        });
    }

    listen(cmd, func) {
        this.#requestHandlersList.push({
            cmd: cmd, func: func
        });

        console.log("Request handler added : " + cmd);
    }

    listenInternal(handler, func) {
        this.#serverHandlersList[handler] = func;
        console.log("Server handler added : " + handler);
    }


    say(cmd, user, params) {
        user.socket.emit(cmd, JSON.stringify(params));
    }

    sayAll(cmd, params) {
        this.#server.sockets.emit(cmd, JSON.stringify(params));
    }

    get getAllUsers() {
        return this.#usersList;
    }

    async _onClientConnected(socket) {
        global.usersDb.find({username: socket.decoded_token.username,
            password: socket.decoded_token.password})
            .limit(1).exec((err, docs) => {
            if (err) {
                socket.disconnect();
                return;
            }

            let currentUser = new user(socket);
            currentUser.data = docs[0];

            this.#usersList.push(currentUser);
            this.#requestHandlersList.forEach((item) => {
                socket.on(item.cmd, (params) => {
                    item.func(params, currentUser);
                });
            });

            if (this.#serverHandlersList[server_controller.serverHandler.OnUserConnect] != null) {
                this.#serverHandlersList[server_controller.serverHandler.OnUserConnect](currentUser);
            }
            console.log('Client Connected : ' + currentUser.id);
        });


    }

    _onClientDisconnected(socket) {
        let disconnectedClient;

        for (let i = 0; i < this.#usersList.length; i++)
            if (this.#usersList[i].socket.id === socket.id) {
                disconnectedClient = this.#usersList[i];
                this.#usersList.splice(i, 1);
            }

        if (this.#serverHandlersList[server_controller.serverHandler.OnUserDisconnect] != null)
            this.#serverHandlersList[server_controller.serverHandler.OnUserDisconnect](disconnectedClient);

        console.log('Client Disconnected : ' + disconnectedClient.id + " - Session time : "
            + ((new Date() - disconnectedClient.connect_time) / 1000) + "s");
    }
}

module.exports = server_controller;