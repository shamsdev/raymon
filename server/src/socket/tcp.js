const Net = require('net');
const server = new Net.Server();
let isInitialized = false;

module.exports = {
    init(cfg) {
        server.listen(cfg.port, cfg.host);
        isInitialized = true;
    },
    on(event, listener) {
        if (!isInitialized)
            return console.log('Error: TCP is not initialized yet.');
        server.on(event, listener);
    }
};
