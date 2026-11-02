const crypto = require('crypto');

// SHA-256 as hex (64 chars), used for session tokens and API keys.
// They are long random strings, so a fast hash is enough (no need for bcrypt).
function sha256(text) {
  return crypto.createHash('sha256').update(text).digest('hex');
}

// random URL-safe string, 32 bytes = 43 characters
function randomToken() {
  return crypto.randomBytes(32).toString('base64url');
}

module.exports = { sha256, randomToken };
