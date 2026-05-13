# TaskFlow - Backend

## Giới thiệu

Backend API cho ứng dụng TaskFlow - Quản lý công việc thông minh. Được xây dựng bằng Sails.js và MongoDB.

## Tính năng chính

- Xác thực người dùng với JWT
- Quản lý task: tạo, sửa, xóa, lưu trữ, khôi phục
- Phân trang và lọc task
- Xóa mềm và thùng rác
- API RESTful chuẩn
- CORS hỗ trợ frontend

## Công nghệ sử dụng

| Công nghệ | Phiên bản | Mục đích |
|-----------|-----------|----------|
| Sails.js | 1.5.17 | Framework chính |
| MongoDB | 7.0 | Database |
| JWT | 9.0.0 | Xác thực |
| bcrypt | 5.1.1 | Mã hóa mật khẩu |

## Cấu trúc thư mục

TaskManagement/
├── api/
│ ├── controllers/ # Xử lý request/response
│ ├── models/ # Schema database
│ ├── policies/ # Phân quyền truy cập
│ ├── services/ # Logic nghiệp vụ
│ └── validators/ # Validate dữ liệu
├── config/
│ ├── datastores.js # Kết nối MongoDB
│ ├── routes.js # API endpoints
│ ├── security.js # Cấu hình CORS
│ └── policies.js # Policy config
├── test/ # Unit tests
└── .env # Biến môi trường


## Yêu cầu hệ thống

- Node.js 20 trở lên
- MongoDB 7.0 trở lên

## Cài đặt

```bash
# Clone repository
git clone https://github.com/hoangthang183204/taskflow-backend.git
cd taskflow-backend

# Cài dependencies
npm install

# Tạo file .env
cp .env.example .env

# Chạy development
sails lift

NODE_ENV=development
PORT=1337
DATABASE_URL=mongodb://localhost:27017/taskflow
JWT_SECRET=your_super_secret_key_change_this
FRONTEND_URL=http://localhost:3000


# Build image
docker build -t taskflow-backend .

# Chạy container
docker run -p 1337:1337 --env-file .env taskflow-backend

# Chạy tất cả test
npm test

# Chạy test cụ thể
npm test -- AuthService.test.js

# Chạy với coverage
npm test -- --coverage