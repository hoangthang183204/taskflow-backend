module.exports = {
  // Cấu hình port
  port: process.env.PORT || 1337,
  
  // CẤU HÌNH DATABASE - QUAN TRỌNG NHẤT
  datastores: {
    default: {
      url: process.env.DATABASE_URL,  // Lấy từ biến môi trường trên Railway
    }
  },
  
  // Cấu hình models (tắt auto-migrate trong production)
  models: {
    migrate: 'safe',  // Không tự động thay đổi database schema
  },
  
  // Cấu hình sockets
  sockets: {
    onlyAllowOrigins: [
      process.env.FRONTEND_URL || 'https://taskflow-frontend.vercel.app',
      'http://localhost:3000'
    ]
  },
  
  // Cấu hình session
  session: {
    cookie: {
      secure: false  // Vì đang dùng HTTP, chưa có HTTPS
    }
  },
  
  // Cấu hình CORS
  security: {
    cors: {
      allRoutes: true,
      allowOrigins: [
        process.env.FRONTEND_URL || 'https://taskflow-frontend.vercel.app',
        'http://localhost:3000'
      ],
      allowCredentials: true
    }
  }
};