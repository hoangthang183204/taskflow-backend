// config/policies.js
const {
  loginLimiter,
  registerLimiter,
  passwordLimiter,
  createTaskLimiter,
  updateTaskLimiter,
  deleteTaskLimiter,
  createBoardLimiter,
  inviteMemberLimiter,
  readLimiter,
} = require("./rateLimits");

module.exports.policies = {
  // ============================================================
  // 🔓 AUTH — Public routes
  // ============================================================
  AuthController: {
    register: [registerLimiter],
    login: [loginLimiter],
    getMe: ["isAuthenticated", readLimiter],
    updateProfile: ["isAuthenticated", passwordLimiter],
    changePassword: ["isAuthenticated", passwordLimiter],
    deleteAccount: ["isAuthenticated", passwordLimiter],
    "*": ["isAuthenticated"],
  },

  // ============================================================
  // 📋 TASK
  // ============================================================
  TaskController: {
    // ✅ Test reminder — PUBLIC (không cần auth)
    testReminder: true,

    // Read
    find: ["isAuthenticated", readLimiter],
    getTrash: ["isAuthenticated", readLimiter],

    // Write
    create: ["isAuthenticated", createTaskLimiter],
    update: ["isAuthenticated", updateTaskLimiter],
    assign: ["isAuthenticated", updateTaskLimiter],
    archive: ["isAuthenticated", updateTaskLimiter],
    restore: ["isAuthenticated", updateTaskLimiter],
    delete: ["isAuthenticated", deleteTaskLimiter],
    softDelete: ["isAuthenticated", deleteTaskLimiter],
    hardDelete: ["isAuthenticated", deleteTaskLimiter],

    "*": ["isAuthenticated"],
  },

  // ============================================================
  // ⏰ CRON — Public endpoint với secret
  // ============================================================
  CronController: {
    reminder: true, // ✅ Public (verify secret trong controller)
    "*": true,
  },

  // ============================================================
  // 📊 BOARD
  // ============================================================
  BoardController: {
    getMyBoards: ["isAuthenticated", readLimiter],
    getBoardDetail: ["isAuthenticated", readLimiter],
    subscribe: ["isAuthenticated", readLimiter],
    create: ["isAuthenticated", createBoardLimiter],
    delete: ["isAuthenticated", createBoardLimiter],
    "*": ["isAuthenticated"],
  },

  // ============================================================
  // 👥 BOARD MEMBER
  // ============================================================
  BoardMemberController: {
    getMembers: ["isAuthenticated", readLimiter],
    getAssignableMembers: ["isAuthenticated", readLimiter],
    addMember: ["isAuthenticated", inviteMemberLimiter],
    removeMember: ["isAuthenticated", inviteMemberLimiter],
    "*": ["isAuthenticated"],
  },

  // ============================================================
  // 🌐 Default
  // ============================================================
  "*": "isAuthenticated",
};