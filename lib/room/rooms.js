const Room = require('./room');

class Rooms {
    constructor() {
        this.list = {};
    }

    add(room) {
        this.list[room.id] = room;
    }

    get(id) {
        return this.list[id];
    }

    remove(id) {
        delete this.list[id];
    }
}

module.exports = exports = Room;
