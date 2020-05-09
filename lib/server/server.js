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
const RayEventEmitter = require('../utils/ray_event_emitter');
const needLog = false;

class Server extends RayEventEmitter {
    constructor() {
        super();

        this.tcp = null;
        this.udp = null;
        this.ws = null;

        this.config = default_config;
        this.users = new Users();
        this.rooms = new Rooms();
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
            this.trace(`TCP server listening on ${config.host}:${config.port}`);
        });

        this.tcp.on('close', () => {
            this.trace(`TCP close`);
        });

        this.tcp.on('error', (error) => {
            this.trace(`TCP error ${error}`);
        });

        this.tcp.on('connection', (socket) => {
            this.trace('A new TCP connection has been established.');

            socket.setTimeout(config.idle_connection_timeout * 1000);
            socket.setKeepAlive(true, config.keep_alive_initial_delay * 1000);

            let user = null;

            socket.on('lookup', (err, address, family, host) => {
                this.trace(`lookup: ${err} ${address} ${family} ${host}`)
            });

            socket.on('connect', () => {
                this.trace('connect')
            });

            let bh = new BufferHandler();
            bh.setOnReceivePacketCallback((packet) => {
                this.trace(`TCP packet received with header: 
                    ${JSON.stringify(packet.header)} and payload: ${JSON.stringify(packet.payload)}`);

                switch (packet.payload.type) {
                    case Packet.Type.Handshake:
                        if (!user) {
                            user = this._handleHandshake(User.ConnectionType.RS, socket, packet);
                            this._handleConnect(user);
                        }
                        break;
                    case Packet.Type.Authenticate:
                        //TODO Auth

                        break;
                    case Packet.Type.Message:
                        this._onMessage(Server.Protocol.TCP, user, packet);
                        break;
                }
            });

            socket.on('data', (chunk) => {
                bh.onReceiveChunk(chunk);
            });

            socket.on('drain', () => {
                this.trace('drain')
            });

            socket.on('error', (err) => {
                this.trace(`Error: ${err}`);
                socket.end();
            });

            socket.on('timeout', () => {
                this.trace('Connection timed out.');
                socket.end();
            });

            socket.on('close', (hadError) => {
                this.trace(`Socket closed. HadError: ${hadError}`);
            });

            socket.on('end', () => {
                this.trace('Closing connection with the client');
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
            this.trace(`UDP server listening on ${config.host}:${config.port}`);
        });

        this.udp.on('connect', () => {
            this.trace(`UDP connect`);
        });

        this.udp.on('error', (error) => {
            this.trace(`UDP error: ${error}`);
        });

        this.udp.on('close', () => {
            this.trace(`UDP close`);
        });

        this.udp.on('message', (msg, rinfo) => {
            BufferHandler.onReceiveDatagramPacket(msg, (packet) => {
                this.trace(`UDP server got packet with header: ${JSON.stringify(packet.header)}
                and payload ${JSON.stringify(packet.payload)} from ${rinfo.address}:${rinfo.port}`);

                if (packet.payload.type === Packet.Type.Message)
                    this._onMessage(Server.Protocol.UDP,
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
            this.trace(`WS server listening on ${config.host}:${config.port}`);
        });

        this.ws.on('close', () => {
            this.trace(`WS close`);
        });

        this.ws.on('error', (error) => {
            this.trace(`WS error ${error}`);
        });

        this.ws.on('connection', (socket) => {
            this.trace("A new websocket connection stablished.");

            let user = null;

            socket.on('message', (msg) => {
                BufferHandler.onReceiveDatagramPacket(msg, (packet) => {
                    this.trace(`WS server got packet with header: ${JSON.stringify(packet.header)}
                        and payload ${JSON.stringify(packet.payload)}`);

                    switch (packet.payload.type) {
                        case Packet.Type.Handshake:
                            if (!user) {
                                user = this._handleHandshake(User.ConnectionType.WS, socket, packet);
                                this._handleConnect(user);
                            }
                            break;
                        case Packet.Type.Authenticate:
                            //TODO Auth
                            break;
                        case Packet.Type.Message:
                            this._onMessage(Server.Protocol.WS, user, packet);
                            break;
                    }
                });
                this.trace('WS received: %s', msg);
            });

            socket.on('error', (error) => {
                this.trace(`WS Error: "${error}"`);
            });

            socket.on('close', (code, reason) => {
                this.trace(`WS connection closed with code ${code} and reason "${reason}"`);
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

        this.trace(`User '${user.id}' handshaked over '${connectionType}'`);
        return user;
    }


    _handleConnect(user) {
        this.fireEvent(Server.Events.UserConnect, {user});
        user.fireEvent(Server.Events.UserConnect);
        this.users.add(user);
    }

    _handleDisconnect(user) {
        this.fireEvent(Server.Events.UserDisconnect, {user});
        user.fireEvent(Server.Events.UserDisconnect);
        for (let i = 0; i < user.currentRooms.length; i++) {
            this.rooms.get(user.currentRooms[i])
                .fireEvent(Server.Events.UserDisconnect, {user});
            this.rooms.get(user.currentRooms[i]).removeUser(user);
        }
        this.users.disconnect(user.id);
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

    _onMessage(protocol, user, packet) {
        const data = {protocol, user, cmd: packet.payload.cmd, data: packet.payload.data};
        this.fireMessage(data.cmd, data);
        user.fireMessage(data.cmd, data);
        for (let i = 0; i < user.currentRooms.length; i++) {
            this.rooms.get(user.currentRooms[i]).fireMessage(data.cmd, data);
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

    createRoom() {
        let room = new Room((key) => this._onRoomVarsUpdate(key, room));
        room.sendMessage = (cmd, data, isUdp = false) => {
            for (let i = 0; i < room.length; i++) {
                this.sendMessage(room.users[i], cmd, data, isUdp);
            }
        };

        room.destroy = () => {
            this.rooms.remove(room.id);
        };

        this.rooms.add(room);
        return room;
    }

    _onUserVarsUpdate(key, user) {
        this.trace("vars update: " + key + " " + user.variables[key]);
    }

    _onRoomVarsUpdate(key, room) {
        this.trace("vars update: " + key + " " + room.variables[key]);
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

    trace(msg) {
        if (needLog)
            console.log(msg);
    }
}

Server.Protocol = Object.freeze({
    TCP: 'tcp',
    UDP: 'udp',
    WS: 'ws'
});

Server.Events = Object.freeze({
    UserConnect: 'user_connect',
    UserDisconnect: 'user_disconnect',
});

module.exports = exports = Server;
