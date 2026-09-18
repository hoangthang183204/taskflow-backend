// config/http.js
module.exports.http = {
  middleware: {
    order: [
      "cookieParser",
      "session",
      "bodyParser",
      "compress",
      "trustProxy",    // ✅ Đặt TRƯỚC router
      "poweredBy",
      "router",
      "www",
      "favicon",
    ],

    // ✅ Trust proxy — chạy sớm để rate limit lấy đúng IP
    trustProxy: function (req, res, next) {
      req.app.set("trust proxy", 1);
      next();
    },

    // ✅ Ẩn X-Powered-By (bảo mật)
    poweredBy: function (req, res, next) {
      res.removeHeader("X-Powered-By");
      next();
    },
  },
};