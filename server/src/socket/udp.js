const dgram = require('dgram');
const server = dgram.createSocket('udp4');

let isInitialized = false;

module.exports = {
    init(cfg) {
        server.bind(cfg.port, cfg.host);
        isInitialized = true;
    },
    on(event, listener) {
        if (!isInitialized)
            return console.log('Error: Udp is not initialized yet.');
        server.on(event, listener);
    },
    send(port, ip, message) {
        server.send(new Buffer(message), port, ip);
    }
};
