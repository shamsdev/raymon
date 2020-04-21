const default_config = require('../data/config');
const TCP = require('../socket/tcp');
const UDP = require('../socket/udp');
const WebSocket = require('../socket/websocket');
const User = require('../user/user');
const Users = require('../user/users');
const bufferHandler = require('../socket/buffer_handler');

class Server {
    static SocketType = Object.freeze({
        TCP: 'tcp',
        UDP: 'udp'
    });

    constructor() {
        this.tcp = null;
        this.udp = null;
        this.ws = null;

        this.config = default_config;
        this.users = new Users();

        this._requestHandlersList = {};
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

            let handshaked = false;
            let user = null;

            socket.on('lookup', (err, address, family, host) => {
                console.log(`lookup: ${err} ${address} ${family} ${host}`)
            });

            socket.on('connect', () => {
                console.log('connect')
            });

            let bh = new bufferHandler();
            bh.setOnReceivePacketCallback((packet) => {
                console.log(`TCP packet received with header: 
            ${JSON.stringify(packet.header)} and payload: ${JSON.stringify(packet.payload)}`);

                if (!handshaked && packet.payload.cmd === 'handshake') {

                    user = new User(socket,
                        packet.payload.data.use_udp
                            ? packet.payload.data.udp_port : null);

                    this.users.add(user);

                    let handshakeData = {
                        aid: user.aid,
                        id: user.id
                    };

                    this.send(Server.SocketType.TCP, user, 'handshake', handshakeData);
                    console.log('User connected: ' + user.id);
                } else {
                    this._handlePacket(Server.SocketType.TCP, user, packet);
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
                if (user)
                    this.users.remove(user.id);
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
            bufferHandler.onReceiveDatagramPacket(msg, (packet) => {
                console.log(`UDP server got packet with header: ${JSON.stringify(packet.header)}
             and payload ${JSON.stringify(packet.payload)} from ${rinfo.address}:${rinfo.port}`);

                this._handlePacket(Server.SocketType.UDP,
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

            socket.on('close', (code, reason) => {
                console.log(`WS connection closed with code ${code} and reason "${reason}"`);
            });

            socket.on('message', (message) => {
                console.log('WS received: %s', message);
            });

            socket.on('error', (error) => {
                console.log(`WS Error: "${error}"`);
            });

           setInterval(()=>{
               socket.send('something is coming ...');
               console.log("ok");
           },1000)
        });
    }

    send(socketType, user, cmd, data) {
        let header = Buffer.alloc(2);
        let payload = JSON.stringify({data, cmd});
        //TODO Compress
        header.writeUInt16LE(payload.length);
        let buffer = Buffer.concat([header, Buffer.from(payload)]);
        switch (socketType) {
            default:
            case Server.SocketType.TCP:
                user.tcpSocket.write(buffer);
                break;
            case Server.SocketType.UDP:
                this.udp.send(buffer, user.udpPort, user.tcpSocket.remoteAddress);
                break;
        }
    }

    _handlePacket(socketType, user, packet) {
        const handler = this._requestHandlersList[packet.payload.cmd];
        if (handler) {
            for (let i = 0; i < handler.length; i++) {
                handler[i](socketType, user, packet);
            }
        }
    }

    addRequestHandler(cmd, callback) {
        if (!this._requestHandlersList[cmd]) {
            this._requestHandlersList[cmd] = [callback];
        } else {
            this._requestHandlersList[cmd].push(callback);
        }
    }
}

module.exports = exports = Server;
