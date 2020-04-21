class User {
    constructor() {
        this.id = ++User.LAST_ID;
        this.connect_time = new Date().getTime();
    }

    get useUdp() {
        return this.udpPort != null;
    }

    setTcp(socket) {
        this.connection_type = User.ConnectionType.RawTCP;
        this.socket = socket;
    }

    setUdp(port) {
        if (this.connection_type !== User.ConnectionType.RawTCP)
            return;

        this.udpPort = port;
    }

    setWebsocket(socket) {
        this.connection_type = User.ConnectionType.Websocket;
        this.socket = socket;
    }

    disconnect(){
        this.socket.close();
    }
}

User.ConnectionType = Object.freeze({
    RawTCP: 'tcp',
    Websocket: 'ws'
});

User.LAST_ID = 0;

module.exports = User;
