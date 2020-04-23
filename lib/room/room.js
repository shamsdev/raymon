class Room {
    constructor(onVarsUpdate = null) {
        this.id = ++Room.LAST_ID;
        this.users = [];
        this.variables = {};
        this.onVarsUpdateCallback = onVarsUpdate;
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
}

Room.LAST_ID = 0;

module.exports = Room;
