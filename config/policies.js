/**
 * Policy Mappings
 * (sails.config.policies)
 *
 * Policies are simple functions which run **before** your actions.
 *
 * For more information on configuring policies, check out:
 * https://sailsjs.com/docs/concepts/policies
 */

// Quy định ai được phép vào đâu trước khi chạy code chính.
// 2 
module.exports.policies = {
  "*": "isAuthenticated",

  AuthController: {
    register: true, // ai cũng vào được
    login: true, // ai cũng vào được
    getMe: "isAuthenticated", 
    updateProfile: "isAuthenticated", 
    changePassword: "isAuthenticated", 
    "*": "isAuthenticated",
  },

  TaskController: {
    "*": "isAuthenticated", // phải đăng nhập mới vào được
  },
};
