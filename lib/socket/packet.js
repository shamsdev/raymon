const headerLength = 2;

class Packet {
    constructor(headers, payload) {
        this.header = headers;
        this.payload = payload;
    }

    get buffer() {
        //TODO Compress
        //TODO Encrypt

        let _header = Buffer.alloc(headerLength);
        _header.writeUInt16LE(this.header);
        return Buffer.concat([_header, Buffer.from(this.payload)]);
    }
}

Packet.headerLength = headerLength;

Packet.Type = Object.freeze({
    NotSet: 0,
    Handshake: 100,
    Authenticate: 101,
    Message: 200
});

Packet.from = function (type, cmd, data) {
    let payload = JSON.stringify({type, cmd, data});
    let header = payload.length;
    return new Packet(header, payload);
};

module.exports = Packet;
