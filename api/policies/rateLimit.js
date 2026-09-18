const rateLimit = require("express-rate-limit");
const { ipKeyGenerator } = require("express-rate-limit");

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    success: false,
    message: "Quá nhiều request, vui lòng thử lại sau.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  // ❌ XOÁ trustProxy
  // ❌ Không dùng req.ip trực tiếp → dùng ipKeyGenerator
  keyGenerator: (req, res) => {
    // Nếu có user thì dùng user ID, fallback về IP đã xử lý IPv6
    return req.user?.id || ipKeyGenerator(req, res);
  },
});

module.exports = function (req, res, proceed) {
  return limiter(req, res, proceed);
};