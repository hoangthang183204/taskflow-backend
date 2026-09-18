const jwt = require("jsonwebtoken");

const ACCESS_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "dev-refresh-secret";
const ACCESS_EXPIRES = "1h";
const REFRESH_EXPIRES = "7d";

module.exports = {
  signAccess: (payload) =>
    jwt.sign(payload, ACCESS_SECRET, { expiresIn: ACCESS_EXPIRES }),

  signRefresh: (payload) =>
    jwt.sign(payload, REFRESH_SECRET, { expiresIn: REFRESH_EXPIRES }),

  verifyAccess: (token) => jwt.verify(token, ACCESS_SECRET),

  verifyRefresh: (token) => jwt.verify(token, REFRESH_SECRET),
};