class Packet {
    constructor(headers,payload) {
        this.header = headers;
        this.payload = payload;
    }
}

module.exports = Packet;
