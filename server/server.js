/*!
 * raymon
 * Copyright(c) 2019 Mohammad Shams
 * MIT Licensed
 */

const config = require('./src/data/config');
const tcp = require('./src/socket/tcp');
const udp = require('./src/socket/udp');

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
        socket.write('Hello, client.');

        socket.on('data', function (chunk) {
            console.log(`TCP Data received from client: ${chunk.toString()}`);
        });

        socket.on('end', function () {
            console.log('Closing connection with the client');
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


    udp.on('message', (msg, rinfo) => {
        console.log(`UDP server got: ${msg} from ${rinfo.address}:${rinfo.port}`);
       setInterval(()=>{
           udp.send(rinfo.port, rinfo.address, "Salam back!");
       },1000/66);
    });

}


///////////////
main();
