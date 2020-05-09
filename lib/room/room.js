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

    getUser(id) {
        for (let i = 0; i < this._users.length; i++)
            if (this._users[i].id === id)
                return this._users[i];
    }

    removeUser(user) {
        for (let i = 0; i < this._users.length; i++)
            if (this._users[i].id === user.id) {
                this._users.splice(i, 1);
                user._onExitRoom(this.id);
                break;
            }
    }

    removeAllUsers() {
        for (let i = 0; i < this._users.length; i++) {
            this._users[i]._onExitRoom(this.id);
        }
        this._users = [];
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
