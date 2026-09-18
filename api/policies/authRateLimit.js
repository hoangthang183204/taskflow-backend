const rateLimit = require("express-rate-limit");

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    message: "Quá nhiều lần thử, vui lòng đợi 15 phút.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  // ❌ XOÁ trustProxy
});

module.exports = function (req, res, proceed) {
  return authLimiter(req, res, proceed);
};