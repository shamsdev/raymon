class User {
    constructor(onVarsUpdate = null) {
        this.id = ++User.LAST_ID;
        this.connect_time = new Date().getTime();
        this.variables = {};
        this._onVarsUpdateCallback = onVarsUpdate
    }

    get useUdp() {
        return this.udpPort != null;
    }

    get sessionTime() {
        return ((new Date().getTime() - this.connect_time) / 1000);
    }

    setTcp(socket) {
        this.connection_type = User.ConnectionType.RS;
        this.socket = socket;
    }

    setUdp(port) {
        if (this.connection_type !== User.ConnectionType.RS)
            return;

        this.udpPort = port;
    }

    setWebsocket(socket) {
        this.connection_type = User.ConnectionType.WS;
        this.socket = socket;
    }

    setVariable(key, value) {
        this.variables[key] = value;
        if (this._onVarsUpdateCallback)
            this._onVarsUpdateCallback(key);
    }

    getVariable(key) {
        return this.variables[key];
    }

    removeVariable(key) {
        delete this.variables[key];
        if (this._onVarsUpdateCallback)
            this._onVarsUpdateCallback(key);
    }

    disconnect() {
        this.socket.close();
    }
}

User.ConnectionType = Object.freeze({
    RS: 0,
    WS: 1
});

User.LAST_ID = 0;

module.exports = User;
