const {getMD5} = require('../utils/crypto_handler');

class User {
    constructor(socket, connection_type = User.ConnectionType.RawTCP) {
        this.id = getMD5(`${socket.remoteAddress}:${socket.remotePort}:${udpPort}`);
        this.aid = ++User.LAST_ID;
        this.tcpSocket = socket;
        this.connection_type = connection_type;
        this.connect_time = new Date().getTime();
    }

    get useUdp() {
        return this.udpPort != null;
    }

    setUdp(port) {
        this.udpPort = port;
    }
}

User.ConnectionType = Object.freeze({
    RawTCP: 'tcp',
    Websocket: 'ws'
});

User.LAST_ID = 0;

module.exports = User;
