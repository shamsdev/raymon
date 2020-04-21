const ws = require('ws');

class WebSocket {
    constructor() {
        this.server = null;
    }

    init(cfg) {
        this.server = new ws.Server({host: cfg.host, port: cfg.port});
        this.isInitialised = true;
    };

    on(event, listener) {
        if (!this.isInitialised)
            return console.log('Error: Websocket is not initialized yet.');
        this.server.on(event, listener);
    };
}

module.exports = WebSocket;
