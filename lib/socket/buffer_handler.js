const headerLength = 2;
const Packet = require('./packet');

class BufferHandler {
    constructor() {
        this.header = null;
        this.buffer = null;
        this._receiveCallback = null;
    }

    onReceiveChunk(chunk) {
        if (!this.buffer)
            this.buffer = chunk;
        else
            this.buffer = Buffer.concat([this.buffer, chunk]);

        while (true) {
            if (this._checkHeader() && this._checkPayload())
                continue;
            break;
        }
    }

    setOnReceivePacketCallback(callback) {
        this._receiveCallback = callback;
    }

    _checkHeader() {
        if (this.header)
            return true;

        if (this.buffer.length >= headerLength) {
            this.header = BufferHandler.getHeader(this.buffer, headerLength);
            this.buffer = this.buffer.slice(headerLength);
            return this.buffer.length > 0;
        }

        return false;
    }

    _checkPayload() {
        if (!this.header)
            return false;

        if (this.buffer.length >= this.header.pl) {
            this._receiveCallback(
                new Packet(this.header, BufferHandler.getPayload(this.buffer, this.header)));
            this.buffer = this.buffer.slice(this.header.pl);
            this.header = null;
            return this.buffer.length > 0;
        }

        return false;
    }
}


BufferHandler.getHeader = function (buffer, length) {
    let pl;
    try {
        pl = buffer.readUIntLE(0, length);
    } catch (e) {
        //Handle corrupter packet
    }

    return {pl}
};

BufferHandler.getPayload = function (buffer, header) {
    return JSON.parse(buffer.toString("utf-8", 0, header.pl));
};

BufferHandler.onReceiveDatagramPacket = function (dgram, callback) {
    const header = this.getHeader(dgram, headerLength);
    dgram = dgram.slice(headerLength);
    const payload = this.getPayload(dgram, header);
    callback(new Packet(header, payload));
};

module.exports = BufferHandler;
