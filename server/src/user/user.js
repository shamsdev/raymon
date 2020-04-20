const {getMD5} = require('../comp/crypto');

class User {
    static LAST_ID = 0;
    id;
    aid;
    tcpSocket;
    udpPort;
    connect_time = null;

    constructor(socket, udpPort = null) {
        this.id = getMD5(`${socket.remoteAddress}:${socket.remotePort}:${udpPort}`);
        this.aid = ++User.LAST_ID;
        this.tcpSocket = socket;
        this.udpPort = udpPort;
        this.connect_time = new Date().getTime();
    }

    get useUdp() {
        return this.udpPort != null;
    }
}

module.exports = User;
