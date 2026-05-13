const jwt = require("jsonwebtoken");

module.exports = async function (req, res, proceed) {
  const token = req.headers.authorization?.replace("Bearer ", "");

  if (!token) {
    // SỬA: dùng res.status(401).json() thay vì res.unauthorized()
    return res.status(401).json({ 
      success: false,
      message: "Vui lòng đăng nhập." 
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secretkey");
    req.user = decoded;
    return proceed();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ 
        success: false,
        message: "Token đã hết hạn." 
      });
    }
    return res.status(401).json({ 
      success: false,
      message: "Token không hợp lệ." 
    });
  }
};