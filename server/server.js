/*!
 * raymon
 * Copyright(c) 2019 Mohammad Shams
 * MIT Licensed
 */

const config = require('./src/data/config');
const tcp = require('./src/socket/tcp');
const udp = require('./src/socket/udp');
const bufferHandler = require('./src/buffer_handler');

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

    tcp.on('connection', function (socket) {
        console.log('A new TCP connection has been established.');

        // let i = setInterval(() => {
        //     socket.write('<SOF>Hello From TCP!<EOF>');
        // }, 500);


        let bh = new bufferHandler();
        bh.setOnReceivePacketCallback(function (header, payload) {
            console.log(`TCP packet received with header: ${JSON.stringify(header)} and payload: ${JSON.stringify(payload)}`);
        });

        socket.on('data', function (chunk) {
            bh.onReceiveChunk(chunk);
        });

        socket.on('end', function () {
            console.log('Closing connection with the client');
            //clearInterval(i);
        });

        socket.on('error', function (err) {
            console.log(`Error: ${err}`);
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
        bufferHandler.onReceiveDatagramPacket(msg, (header, payload) => {
            console.log(`UDP server got packet with header: ${JSON.stringify(header)} and payload ${JSON.stringify(payload)} from ${rinfo.address}:${rinfo.port}`);
        });
        // setInterval(() => {
        //     udp.send(rinfo.port, rinfo.address, "<SOF>Hello From UDP!<EOF>");
        // }, 500);
    });
}


///////////////
main();
