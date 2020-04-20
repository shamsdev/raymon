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
            if (users[i].tcpSocket.remoteAddress === address && users[i].udpPort === port)
                return users[i];
        }
        return null;
    }

    remove(id) {
        delete this.list[id];
    }
}

module.exports = exports = Users;
