class Room {
    constructor(onVarsUpdate = null) {
        this.id = ++Room.LAST_ID;
        this._users = [];
        this.variables = {};
        this._onVarsUpdateCallback = onVarsUpdate;
    }

    get length() {
        return this._users.length;
    }

    get users() {
        return this._users;
    }

    addUser(user) {
        this._users.push(user);
    }

    removeUser(user) {
        for (let i = 0; i < this._users.length; i++)
            if (this._users[i].id === user.id) {
                this._users.splice(i, 1);
                break;
            }
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
}

Room.LAST_ID = 0;

module.exports = Room;
