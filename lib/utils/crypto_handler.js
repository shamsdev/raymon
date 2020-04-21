const crypto = require('crypto');

function getMD5(string) {
    return crypto.createHash('md5').update(string).digest('hex');
}

module.exports.getMD5 = getMD5;
