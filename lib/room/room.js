class Room {
    constructor(onVarsUpdate = null) {
        this.id = ++Room.LAST_ID;
        this.users = [];
        this.variables = {};
        this._onVarsUpdateCallback = onVarsUpdate;
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
