// config/env/test.js
const sailsDisk = require('sails-disk');

module.exports = {
  environment: 'test',
  
  log: {
    level: 'silent'
  },
  
  hooks: {
    grunt: false
  },
  
  models: {
    migrate: 'drop',
    datastore: 'testDisk'
  },
  
  datastores: {
    testDisk: {
      adapter: sailsDisk
    }
  },
  
  security: {
    cors: {
      allRoutes: true,
      // ✅ Sửa lại: dùng mảng các origin cụ thể hoặc bỏ qua
      allowOrigins: ['http://localhost:3000', 'http://localhost:1337'],
      allowCredentials: true,
      allowRequestMethods: 'GET,POST,PUT,DELETE,OPTIONS',
      allowRequestHeaders: 'Content-Type,Authorization'
    }
  }
};