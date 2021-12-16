/* eslint-disable camelcase */
module.exports.createSign = function(privateKey, message_hash) {
  const crypto = require('crypto');
  try {
    return crypto
        .privateEncrypt(
            {
              key: privateKey,
              padding: crypto.constants.RSA_NO_PADDING,
            },
            Buffer.from(message_hash, 'base64'),
        )
        .toString('base64');
  } catch (err) {
    this.debug('ERROR CREATE SIGN :' + err.message);
    throw err;
  }
};
