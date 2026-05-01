
module.exports.security = {
  cors: {
    // BẬT CORS cho tất cả các route
    allRoutes: true,

    // QUAN TRỌNG: Thay thế '*' bằng danh sách cụ thể các domain được phép
    // Đây là các domain frontend của bạn (cả cái hiện tại và cái chính thức sau này)
    allowOrigins: [
      'https://taskflow-frontend-virid.vercel.app',
      'https://taskflow-frontend.vercel.app',
      'http://localhost:3000' // Cho phép dev local
    ],

    // QUAN TRỌNG: Phải bật cái này để backend có thể nhận và trả về cookie session
    // Từ đó việc đăng nhập mới hoạt động được
    allowCredentials: true,

    // Các phương thức HTTP được phép (thêm OPTIONS là bắt buộc cho preflight request)
    allowRequestMethods: 'GET, POST, PUT, DELETE, OPTIONS, HEAD',

    // Các header được phép gửi lên từ frontend (thêm 'authorization' là bắt buộc nếu bạn dùng token)
    allowRequestHeaders: 'content-type, authorization',

    // (Tùy chọn) Các header mà frontend được phép đọc từ response
    // allowResponseHeaders: '',
  },
};