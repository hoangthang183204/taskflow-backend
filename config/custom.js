/**
 * Custom configuration
 * (sails.config.custom)
 *
 * One-off settings specific to your application.
 *
 * For more information on custom configuration, visit:
 * https://sailsjs.com/config/custom
 */

module.exports.custom = {
  jwtSecret: process.env.JWT_SECRET || "secretkey",
};

// Nếu là tạo jwtSecret thì nó sẽ lấy để xác thực token còn không thì lấy mặc định secretKey