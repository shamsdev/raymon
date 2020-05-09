const RayEventEmitter = require('../utils/ray_event_emitter');

class Room extends RayEventEmitter {
    constructor() {
        super();

        this.id = ++Room.LAST_ID;
        this._users = [];
        this.variables = {};
    }

    get length() {
        return this._users.length;
    }

    get users() {
        return this._users;
    }

    addUser(user) {
        this._users.push(user);
        user._onJoinRoom(this.id);
    }

    removeUser(user) {
        for (let i = 0; i < this._users.length; i++)
            if (this._users[i].id === user.id) {
                this._users.splice(i, 1);
                break;
            }
        user._onExitRoom(this.id);
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

}

Room.LAST_ID = 0;

module.exports = Room;
