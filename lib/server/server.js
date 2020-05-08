const default_config = require('../data/config');
const TCP = require('../socket/tcp');
const UDP = require('../socket/udp');
const WebSocket = require('../socket/websocket');
const Packet = require('../socket/packet');

const User = require('../user/user');
const Users = require('../user/users');

const Room = require('../room/room');
const Rooms = require('../room/rooms');

const BufferHandler = require('../socket/buffer_handler');

class Server {
    constructor() {
        this.tcp = null;
        this.udp = null;
        this.ws = null;

        this.config = default_config;
        this.users = new Users();
        this.rooms = new Rooms();

        this._requestHandlersList = {};
        this._eventHandlersList = {};
    }

    start() {
        this._setupTCP(this.config.tcp);
        this._setupUDP(this.config.udp);
        this._setupWebsocket(this.config.websocket);
    }

    _setupTCP(config) {
        if (!config.enabled)
            return;

        this.tcp = new TCP();

        this.tcp.init(config);

        this.tcp.on('listening', () => {
            console.log(`TCP server listening on ${config.host}:${config.port}`);
        });

        this.tcp.on('close', () => {
            console.log(`TCP close`);
        });

        this.tcp.on('error', (error) => {
            console.log(`TCP error ${error}`);
        });

        this.tcp.on('connection', (socket) => {
            console.log('A new TCP connection has been established.');

            socket.setTimeout(config.idle_connection_timeout * 1000);
            socket.setKeepAlive(true, config.keep_alive_initial_delay * 1000);

            let user = null;

            socket.on('lookup', (err, address, family, host) => {
                console.log(`lookup: ${err} ${address} ${family} ${host}`)
            });

            socket.on('connect', () => {
                console.log('connect')
            });

            let bh = new BufferHandler();
            bh.setOnReceivePacketCallback((packet) => {
                console.log(`TCP packet received with header: 
                    ${JSON.stringify(packet.header)} and payload: ${JSON.stringify(packet.payload)}`);

                switch (packet.payload.type) {
                    case Packet.Type.Handshake:
                        if (!user)
                            user = this._handleHandshake(User.ConnectionType.RS, socket, packet);
                        break;
                    case Packet.Type.Authenticate:
                        //TODO Auth

                        break;
                    case Packet.Type.Message:
                        this._handleMessagePacket(Server.Protocol.TCP, user, packet);
                        break;
                }
            });

            socket.on('data', (chunk) => {
                bh.onReceiveChunk(chunk);
            });

            socket.on('drain', () => {
                console.log('drain')
            });

            socket.on('error', (err) => {
                console.log(`Error: ${err}`);
                socket.end();
            });

            socket.on('timeout', () => {
                console.log('Connection timed out.');
                socket.end();
            });

            socket.on('close', (hadError) => {
                console.log(`Socket closed. HadError: ${hadError}`);
            });

            socket.on('end', () => {
                console.log('Closing connection with the client');
                this._handleDisconnect(user);
            });
        });
    }

    _setupUDP(config) {
        if (!config.enabled)
            return;

        this.udp = new UDP();
        this.udp.init(config);

        this.udp.on('listening', () => {
            console.log(`UDP server listening on ${config.host}:${config.port}`);
        });

        this.udp.on('connect', () => {
            console.log(`UDP connect`);
        });

        this.udp.on('error', (error) => {
            console.log(`UDP error: ${error}`);
        });

        this.udp.on('close', () => {
            console.log(`UDP close`);
        });

        this.udp.on('message', (msg, rinfo) => {
            BufferHandler.onReceiveDatagramPacket(msg, (packet) => {
                console.log(`UDP server got packet with header: ${JSON.stringify(packet.header)}
                and payload ${JSON.stringify(packet.payload)} from ${rinfo.address}:${rinfo.port}`);

                if (packet.payload.type === Packet.Type.Message)
                    this._handleMessagePacket(Server.Protocol.UDP,
                        this.users.getWithUDPAddress(rinfo.address, rinfo.port), packet);

            });
        });
    }

    _setupWebsocket(config) {
        if (!config.enabled)
            return;

        this.ws = new WebSocket();
        this.ws.init(config);

        this.ws.on('listening', () => {
            console.log(`WS server listening on ${config.host}:${config.port}`);
        });

        this.ws.on('close', () => {
            console.log(`WS close`);
        });

        this.ws.on('error', (error) => {
            console.log(`WS error ${error}`);
        });

        this.ws.on('connection', (socket) => {
            console.log("A new websocket connection stablished.");

            let user = null;

            socket.on('message', (msg) => {
                BufferHandler.onReceiveDatagramPacket(msg, (packet) => {
                    console.log(`WS server got packet with header: ${JSON.stringify(packet.header)}
                        and payload ${JSON.stringify(packet.payload)}`);

                    switch (packet.payload.type) {
                        case Packet.Type.Handshake:
                            if (!user)
                                user = this._handleHandshake(User.ConnectionType.WS, socket, packet);
                            break;
                        case Packet.Type.Authenticate:
                            //TODO Auth
                            break;
                        case Packet.Type.Message:
                            this._handleMessagePacket(Server.Protocol.WS, user, packet);
                            break;
                    }
                });
                console.log('WS received: %s', msg);
            });

            socket.on('error', (error) => {
                console.log(`WS Error: "${error}"`);
            });

            socket.on('close', (code, reason) => {
                console.log(`WS connection closed with code ${code} and reason "${reason}"`);
                this._handleDisconnect(user);
            });

        });
    }

    _handleHandshake(connectionType, socket, handshakePacket) {
        let user = new User((key) => this._onUserVarsUpdate(key, user));
        let handshakeData = {
            id: user.id
        };
        let packet = Packet.from(Packet.Type.Handshake, 'hs', handshakeData);

        switch (connectionType) {
            default:
            case User.ConnectionType.RS:
                user.setTcp(socket);
                if (handshakePacket.payload.data.use_udp)
                    user.setUdp(handshakePacket.payload.data.udp_port);
                this._send(Server.Protocol.TCP, user, packet);

                break;

            case User.ConnectionType.WS:
                user.setWebsocket(socket);
                this._send(Server.Protocol.WS, user, packet);
                break;
        }

        this.users.add(user);
        this._fireEvent(Server.EventHandler.OnUserConnect, {user});

        console.log(`User '${user.id}' handshaked over '${connectionType}'`);

        return user;
    }

    _handleDisconnect(user) {
        this._fireEvent(Server.EventHandler.OnUserDisconnect, {user});
        if (user) {
            this.users.remove(user.id);
            user = null;
        }
    }

    _send(protocol, user, packet) {
        switch (protocol) {
            default:
            case Server.Protocol.TCP:
                user.socket.write(packet.buffer);
                break;
            case Server.Protocol.UDP:
                this.udp.send(packet.buffer, user.udpPort, user.socket.remoteAddress);
                break;

            case Server.Protocol.WS:
                user.socket.send(packet.buffer, {compress: false});
                break;
        }
    }

    _handleMessagePacket(protocol, user, packet) {
        const handler = this._requestHandlersList[packet.payload.cmd];
        if (handler) {
            for (let i = 0; i < handler.length; i++) {
                handler[i]({protocol, user, packet});
            }
        }
    }

    sendMessage(user, cmd, data, isUdp = false) {
        let packet = Packet.from(Packet.Type.Message, cmd, data);

        switch (user.connection_type) {
            case User.ConnectionType.RS:
                if (isUdp) {
                    if (user.useUdp)
                        this._send(Server.Protocol.UDP, user, packet);
                } else {
                    this._send(Server.Protocol.TCP, user, packet);
                }
                break;

            case User.ConnectionType.WS:
                if (isUdp)
                    return;

                this._send(Server.Protocol.WS, user, packet);
                break;
        }
    }

    //TODO Maybe we should rename 'request' to 'message'
    addRequestHandler(cmd, callback) {
        if (!this._requestHandlersList[cmd]) {
            this._requestHandlersList[cmd] = [callback];
        } else {
            this._requestHandlersList[cmd].push(callback);
        }
    }

    addEventHandler(handlerType = Server.EventHandler.OnUserConnect, callback) {
        if (!this._eventHandlersList[handlerType]) {
            this._eventHandlersList[handlerType] = [callback];
        } else {
            this._eventHandlersList[handlerType].push(callback);
        }
    }

    _fireEvent(handlerType, args) {
        const handler = this._eventHandlersList[handlerType];
        if (handler) {
            for (let i = 0; i < handler.length; i++) {
                handler[i](args);
            }
        }
    }

    createRoom() {
        let room = new Room((key) => this._onRoomVarsUpdate(key, room));
        room.sendAll = () => {
            //TODO
        };

        this.rooms.add(room);
        return room;
    }

    _onUserVarsUpdate(key, user) {
        console.log("vars update: " + key + " " + user.variables[key]);
    }

    _onRoomVarsUpdate(key, room) {
        console.log("vars update: " + key + " " + room.variables[key]);
    }

    stop() {
        this.users.disconnectAll();

        if (this.tcp)
            this.tcp.stop();

        if (this.udp)
            this.udp.stop();

        if (this.ws)
            this.ws.stop();
    }
}

Server.Protocol = Object.freeze({
    TCP: 'tcp',
    UDP: 'udp',
    WS: 'ws'
});

Server.EventHandler = Object.freeze({
    OnUserConnect: 0,
    OnUserDisconnect: 1,
});

module.exports = exports = Server;
