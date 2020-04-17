/*!
 * raymon
 * Copyright(c) 2019 Mohammad Shams
 * MIT Licensed
 */

const config = require('./src/data/config');
const tcp = require('./src/socket/tcp');
const udp = require('./src/socket/udp');
const User = require('./src/user/user');
const Users = require('./src/user/users');
const bufferHandler = require('./src/socket/buffer_handler');

const SocketType = Object.freeze({
    TCP: 'tcp',
    UDP: 'udp'
});

function main() {
    setupTCP();
    setupUDP();
}

function setupTCP() {
    if (!config.tcp.enabled)
        return;

    tcp.init(config.tcp);

    tcp.on('listening', () => {
        console.log(`TCP server listening on ${config.tcp.host}:${config.tcp.port}`);
    });

    tcp.on('close', () => {
        console.log(`TCP close`);
    });


    tcp.on('error', (error) => {
        console.log(`TCP error ${error}`);
    });


    tcp.on('connection', function (socket) {
        console.log('A new TCP connection has been established.');

        socket.setTimeout(config.tcp.idle_connection_timeout * 1000);
        socket.setKeepAlive(true, config.tcp.keep_alive_initial_delay * 1000);

        let handshaked = false;
        let user = null;

        socket.on('lookup', function (err, address, family, host) {
            console.log(`lookup: ${err} ${address} ${family} ${host}`)
        });

        socket.on('connect', function () {
            console.log('connect')
        });

        let bh = new bufferHandler();
        bh.setOnReceivePacketCallback(function (packet) {
            console.log(`TCP packet received with header: 
            ${JSON.stringify(packet.header)} and payload: ${JSON.stringify(packet.payload)}`);

            if (!handshaked && packet.payload.cmd === 'handshake') {
                user = new User(socket,
                    packet.payload.data.use_udp
                        ? packet.payload.data.udp_port : null);

                Users.add(user);

                let handshakeData = {
                    id: user.id
                };

                Send(SocketType.TCP, user, 'handshake', handshakeData);

                setTimeout(() => {
                    Send(SocketType.UDP, user, "hello", {msg: "Hey from server!"});
                }, 2000)
            }
        });

        socket.on('data', function (chunk) {
            bh.onReceiveChunk(chunk);
        });

        socket.on('drain', function () {
            console.log('drain')
        });

        socket.on('error', function (err) {
            console.log(`Error: ${err}`);
            socket.end();
        });

        socket.on('timeout', function () {
            console.log('Connection timed out.');
            socket.end();
        });

        socket.on('close', function (hadError) {
            console.log(`Socket closed. HadError: ${hadError}`);
        });

        socket.on('end', function () {
            console.log('Closing connection with the client');
            if (user)
                Users.remove(user.id);
        });
    });
}

function setupUDP() {
    if (!config.udp.enabled)
        return;

    udp.init(config.udp);
    udp.on('listening', () => {
        console.log(`UDP server listening on ${config.udp.host}:${config.udp.port}`);
    });

    udp.on('connect', () => {
        console.log(`UDP connect`);
    });

    udp.on('error', (error) => {
        console.log(`UDP error: ${error}`);
    });

    udp.on('close', () => {
        console.log(`UDP close`);
    });

    udp.on('message', (msg, rinfo) => {
        bufferHandler.onReceiveDatagramPacket(msg, (packet) => {
            console.log(`UDP server got packet with header: ${JSON.stringify(packet.header)}
             and payload ${JSON.stringify(packet.payload)} from ${rinfo.address}:${rinfo.port}`);
        });
    });
}

function Send(type = SocketType.TCP, user = User.prototype, cmd = "cmd", data = {}) {
    let header = Buffer.alloc(2);
    let payload = JSON.stringify({data, cmd});
    //TODO Compress
    header.writeUInt16LE(payload.length);
    let buffer = Buffer.concat([header, Buffer.from(payload)]);
    switch (type) {
        default:
        case SocketType.TCP:
            user.tcpSocket.write(buffer);
            break;
        case SocketType.UDP:
            udp.send(buffer, user.udpPort, user.tcpSocket.remoteAddress);
            break;
    }
}


///////////////
main();

user = require('./src/user/user');
users = require('./src/user/users');
