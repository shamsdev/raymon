const dgram = require('dgram');

class UDP {
    constructor() {
        this.server = dgram.createSocket('udp4');
        this.isInitialized = false;
    }

    init(cfg) {
        this.server.bind(cfg.port, cfg.host);
        this.isInitialized = true;
    }

    on(event, listener) {
        if (!this.isInitialized)
            return console.log('Error: Udp is not initialized yet.');
        this.server.on(event, listener);
    }

    send(buffer, port, ip) {
        this.server.send(buffer, port, ip);
    }

    stop(){
        this.server.close();
    }
}


module.exports = exports = UDP;
