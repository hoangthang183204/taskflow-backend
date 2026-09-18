// api/policies/isAuthenticated.js
const TokenService = require("../services/TokenService");

module.exports = async (req, res, proceed) => {
  try {
    // ✅ 1. Kiểm tra header Authorization
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        code: "NO_TOKEN",
        message: "Chưa đăng nhập. Vui lòng đăng nhập để tiếp tục.",
      });
    }

    // ✅ 2. Lấy token
    const token = auth.slice(7).trim();
    if (!token) {
      return res.status(401).json({
        success: false,
        code: "EMPTY_TOKEN",
        message: "Token không hợp lệ.",
      });
    }

    // ✅ 3. Verify token
    let decoded;
    try {
      decoded = TokenService.verifyAccess(token);
    } catch (err) {
      // Token hết hạn
      if (err.name === "TokenExpiredError") {
        return res.status(401).json({
          success: false,
          code: "TOKEN_EXPIRED",
          message: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
        });
      }

      // Token không hợp lệ
      if (err.name === "JsonWebTokenError") {
        return res.status(401).json({
          success: false,
          code: "INVALID_TOKEN",
          message: "Token không hợp lệ hoặc đã bị thay đổi.",
        });
      }

      // Lỗi khác
      console.error("❌ Token verify error:", err.message);
      return res.status(401).json({
        success: false,
        code: "TOKEN_ERROR",
        message: "Không thể xác thực token.",
      });
    }

    // ✅ 4. Validate payload có id
    if (!decoded || !decoded.id) {
      return res.status(401).json({
        success: false,
        code: "INVALID_PAYLOAD",
        message: "Token thiếu thông tin người dùng.",
      });
    }

    // ✅ 5. Gán user vào req (cho rate limit + controller)
    // Rate limit dùng req.user.id để tạo key
    req.user = {
      id: decoded.id,
      email: decoded.email || null,
      name: decoded.name || null,
    };

    // ✅ 6. Log để debug (tuỳ chọn, có thể tắt ở production)
    if (process.env.NODE_ENV !== "production") {
      console.log(`✅ [Auth] user=${decoded.id} | ${req.method} ${req.originalUrl}`);
    }

    return proceed();
  } catch (err) {
    console.error("❌ isAuthenticated error:", err);
    return res.status(500).json({
      success: false,
      code: "AUTH_ERROR",
      message: "Lỗi xác thực. Vui lòng thử lại sau.",
    });
  }
};