const crypto = require('crypto');

/**
 * Generate a random UUID token for invitations
 * @returns {string} A random UUID token
 */
function generateToken() {
  return crypto.randomUUID();
}

/**
 * Calculate the expiration date for a token (48 hours from now)
 * @returns {Date} Expiration datetime
 */
function calculateExpiration() {
  const now = new Date();
  return new Date(now.getTime() + 48 * 60 * 60 * 1000); // 48 hours in milliseconds
}

/**
 * Check if a token has expired
 * @param {Date} expiresAt - The expiration datetime
 * @returns {boolean} True if expired, false otherwise
 */
function isTokenExpired(expiresAt) {
  return new Date() > expiresAt;
}

module.exports = {
  generateToken,
  calculateExpiration,
  isTokenExpired,
};
