class Packet {
    header = null;
    payload = null;
    constructor(headers,payload) {
        this.header = headers;
        this.payload = payload;
    }
}

module.exports = Packet;
