
require('dotenv').config();

module.exports.bootstrap = async (cb) => {
  // Kiểm tra JWT_SECRET
  if (!process.env.JWT_SECRET) {
    console.error('\x1b[31m%s\x1b[0m', '❌ ERROR: JWT_SECRET not found in .env');
    console.error('\x1b[33m%s\x1b[0m', 'Using default secret for development');
    // Nếu không có, tự động tạo secret tạm thời
    process.env.JWT_SECRET = 'temporary_dev_secret_' + Date.now();
  }
  
  console.log('\x1b[32m%s\x1b[0m', '✅ JWT_SECRET is configured');
  cb();
};