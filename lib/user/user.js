const RayEventEmitter = require('../utils/ray_event_emitter');

class User extends RayEventEmitter {
    constructor() {
        super();

        this.id = ++User.LAST_ID;
        this.connect_time = new Date().getTime();
        this.variables = {};
        this.currentRooms = [];
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
    }

    getVariable(key) {
        return this.variables[key];
    }

    removeVariable(key) {
        delete this.variables[key];
    }

    _onJoinRoom(id) {
        for (let i = 0; i < this.currentRooms.length; i++)
            if (this.currentRooms[i] === id)
                return;

        this.currentRooms.push(id)
    }

    _onExitRoom(id) {
        for (let i = 0; i < this.currentRooms.length; i++)
            if (this.currentRooms[i] === id) {
                this.currentRooms.splice(i, 1);
                break;
            }
    }

    disconnect() {
        if (this.socket)
            this.socket.close();
    }
}

User.ConnectionType = Object.freeze({
    RS: 0,
    WS: 1
});

User.LAST_ID = 0;

module.exports = User;
