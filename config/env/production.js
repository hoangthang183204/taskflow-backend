module.exports = {
  // Bật chế độ trust proxy vì app chạy sau proxy (Railway)
  http: {
    trustProxy: true,
  },

  // Cấu hình bộ nhớ phiên (Session Store) bắt buộc dùng Redis trong production
  session: {
    // Dùng adapter cho Redis
    adapter: '@sailshq/connect-redis',
    // URL kết nối Redis sẽ được lấy từ biến môi trường do Railway cung cấp
    url: process.env.REDIS_URL,
    // Bật cookie bảo mật (chỉ hoạt động qua HTTPS)
    cookie: {
      secure: true,
      // Đặt maxAge ví dụ: 7 ngày (7 * 24 * 60 * 60 * 1000)
      // maxAge: 604800000,
    },
  },

  // Cấu hình an toàn cho WebSocket (Sails Socket)
  sockets: {
    // Chỉ cho phép kết nối từ địa chỉ Frontend của bạn
    onlyAllowOrigins: [
      process.env.FRONTEND_URL || 'https://taskflow-frontend.vercel.app',
    ],
  },

  // Cấu hình an toàn cho CORS (Chia sẻ tài nguyên giữa các nguồn gốc)
  security: {
    cors: {
      allRoutes: true,
      allowOrigins: [
        process.env.FRONTEND_URL || 'https://taskflow-frontend.vercel.app',
      ],
      allowCredentials: true,
    },
  },

  // Đảm bảo models ở chế độ an toàn, không tự động migrate database
  models: {
    migrate: 'safe',
  },
};