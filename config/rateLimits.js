// config/rateLimits.js
const rateLimit = require("express-rate-limit");

// ✅ QUAN TRỌNG: Import ipKeyGenerator helper
const { ipKeyGenerator } = rateLimit;

console.log("🔥 [rateLimits.js] Loading rate limiters...");

// ============================================================
// CUSTOM HANDLER
// ============================================================
const rateLimitHandler = (req, res) => {
  const retryAfter = res.getHeader("Retry-After") || 60;

  console.warn(
    `🚨 [Rate Limit] ${req.method} ${req.originalUrl} | IP: ${req.ip}`
  );

  res.status(429).json({
    success: false,
    error: "RATE_LIMIT_EXCEEDED",
    message: `Bạn đã thực hiện quá nhiều yêu cầu. Vui lòng thử lại sau ${retryAfter} giây.`,
    retryAfter: Number(retryAfter),
  });
};

// ============================================================
// KEY GENERATORS — ✅ Dùng ipKeyGenerator cho IPv6
// ============================================================

/**
 * Key theo user ID hoặc IP (dùng ipKeyGenerator cho IPv6)
 */
const userKeyGenerator = (req) => {
  if (req.user?.id) {
    return `user:${req.user.id}`;
  }
  // ✅ Dùng ipKeyGenerator cho IPv6 an toàn
  return ipKeyGenerator(req);
};

/**
 * Key theo IP + email (dùng ipKeyGenerator)
 */
const loginKeyGenerator = (req) => {
  const email = (req.body?.email || "unknown").toLowerCase();
  // ✅ Dùng ipKeyGenerator
  const ip = ipKeyGenerator(req);
  return `login:${ip}:${email}`;
};

/**
 * Key theo IP thuần (dùng ipKeyGenerator)
 */
const ipKeyGeneratorFn = (req) => {
  // ✅ Dùng ipKeyGenerator
  return ipKeyGenerator(req);
};

// ============================================================
// 🔴 STRICT LIMITERS
// ============================================================
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  keyGenerator: loginKeyGenerator,
  handler: rateLimitHandler,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  validate: {
    // ✅ Tắt validate trust proxy nếu cần
    trustProxy: false,
    xForwardedForHeader: false,
  },
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  keyGenerator: ipKeyGeneratorFn,
  handler: rateLimitHandler,
  standardHeaders: true,
  legacyHeaders: false,
  validate: {
    trustProxy: false,
    xForwardedForHeader: false,
  },
});

const passwordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  keyGenerator: userKeyGenerator,
  handler: rateLimitHandler,
  standardHeaders: true,
  legacyHeaders: false,
  validate: {
    trustProxy: false,
    xForwardedForHeader: false,
  },
});

// ============================================================
// 🟡 MEDIUM LIMITERS
// ============================================================
const createTaskLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  keyGenerator: userKeyGenerator,
  handler: rateLimitHandler,
  standardHeaders: true,
  legacyHeaders: false,
  validate: {
    trustProxy: false,
    xForwardedForHeader: false,
  },
});

const updateTaskLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  keyGenerator: userKeyGenerator,
  handler: rateLimitHandler,
  standardHeaders: true,
  legacyHeaders: false,
  validate: {
    trustProxy: false,
    xForwardedForHeader: false,
  },
});

const deleteTaskLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  keyGenerator: userKeyGenerator,
  handler: rateLimitHandler,
  standardHeaders: true,
  legacyHeaders: false,
  validate: {
    trustProxy: false,
    xForwardedForHeader: false,
  },
});

const createBoardLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  keyGenerator: userKeyGenerator,
  handler: rateLimitHandler,
  standardHeaders: true,
  legacyHeaders: false,
  validate: {
    trustProxy: false,
    xForwardedForHeader: false,
  },
});

const inviteMemberLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  keyGenerator: userKeyGenerator,
  handler: rateLimitHandler,
  standardHeaders: true,
  legacyHeaders: false,
  validate: {
    trustProxy: false,
    xForwardedForHeader: false,
  },
});

// ============================================================
// 🟢 LENIENT LIMITERS
// ============================================================
const readLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  keyGenerator: userKeyGenerator,
  handler: rateLimitHandler,
  standardHeaders: true,
  legacyHeaders: false,
  validate: {
    trustProxy: false,
    xForwardedForHeader: false,
  },
});

// ============================================================
// ⚫ GLOBAL LIMITER
// ============================================================
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  keyGenerator: ipKeyGeneratorFn,
  handler: rateLimitHandler,
  standardHeaders: true,
  legacyHeaders: false,
  validate: {
    trustProxy: false,
    xForwardedForHeader: false,
  },
});

console.log("✅ [rateLimits.js] All limiters loaded (memory store)");

// ============================================================
// EXPORT
// ============================================================
module.exports = {
  loginLimiter,
  registerLimiter,
  passwordLimiter,
  createTaskLimiter,
  updateTaskLimiter,
  deleteTaskLimiter,
  createBoardLimiter,
  inviteMemberLimiter,
  readLimiter,
  globalLimiter,
  rateLimitHandler,
};