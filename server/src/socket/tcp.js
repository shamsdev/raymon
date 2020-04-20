const Net = require('net');

class TCP {
    constructor() {
        this.isInitialised = false;
        this.server = new Net.Server();
    }

    init(cfg) {
        this.server.listen(cfg.port, cfg.host);
        this.isInitialised = true;
    };

    on(event, listener) {
        if (!this.isInitialised)
            return console.log('Error: TCP is not initialized yet.');
        this.server.on(event, listener);
    };
}

module.exports = exports = TCP;

