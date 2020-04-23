class User {
    constructor(onVarsUpdate = null) {
        this.id = ++User.LAST_ID;
        this.connect_time = new Date().getTime();
        this.variables = {};
        this.onVarsUpdateCallback = onVarsUpdate
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

    setVariable(key, value) {
        this.variables[key] = value;
        if (this.onVarsUpdateCallback)
            this.onVarsUpdateCallback();
    }

    getVariable(key) {
        return this.variables[key];
    }

    removeVariable(key) {
        delete this.variables[key];
        if (this.onVarsUpdateCallback)
            this.onVarsUpdateCallback();
    }

    disconnect() {
        this.socket.close();
    }
}

User.ConnectionType = Object.freeze({
    RawTCP: 'tcp',
    Websocket: 'ws'
});

User.LAST_ID = 0;

module.exports = User;
