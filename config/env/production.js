module.exports = {
  // Cấu hình port
  port: process.env.PORT || 1337,
  
  // Cấu hình sockets (QUAN TRỌNG)
  sockets: {
    onlyAllowOrigins: [
      process.env.FRONTEND_URL || 'https://taskflow-frontend.vercel.app',
      'http://localhost:3000'
    ]
  },
  
  // Cấu hình session (tùy chọn)
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