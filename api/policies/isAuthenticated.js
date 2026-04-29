
const jwt = require("jsonwebtoken");

module.exports = async function (req, res, proceed) {
  const token = req.headers.authorization?.replace("Bearer ", "");

  if (!token) {
    return res.unauthorized({ message: "Vui lòng đăng nhập." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secretkey");
    req.user = decoded;
    return proceed();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.unauthorized({ message: "Token đã hết hạn." });
    }
    return res.unauthorized({ message: "Token không hợp lệ." });
  }
};


// Muốn vào controller -> Phải có token -> kiểm tra token -> Ok thì được vào