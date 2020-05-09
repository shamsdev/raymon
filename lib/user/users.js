const User = require('./user');

class Users {
    constructor() {
        this.list = {};
    }

    add(user) {
        this.list[user.id] = user;
    }

    get(id) {
        return this.list[id];
    }

    getWithUDPAddress(address, port) {
        const users = Object.values(this.list);
        for (let i = 0; i < users.length; i++) {
            if (users[i].connection_type === User.ConnectionType.RS
                && users[i].socket.remoteAddress === address
                && users[i].udpPort === port)
                return users[i];
        }
        return null;
    }

    disconnectAll() {
        const users = Object.values(this.list);
        for (let i = 0; i < users.length; i++) {
            users[i].disconnect();
        }
    }

    disconnect(id) {
        this.list[id].disconnect();
        delete this.list[id];
    }
}

module.exports = exports = Users;
