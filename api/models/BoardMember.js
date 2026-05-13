/**
 * BoardMember.js
 * Model quản lý thành viên của board
 */
module.exports = {
  attributes: {
    boardId: {
      type: "string",
      required: true,
      description: "ID của board",
    },
    userId: {
      type: "string",
      required: true,
      description: "ID của thành viên",
    },
    role: {
      type: "string",
      isIn: ["admin", "member"],
      defaultsTo: "member",
      description: "Vai trò: admin, member",
    },
    invitedAt: {
      type: "number",
      autoCreatedAt: true,
    },
  },

  // Đảm bảo một user chỉ tham gia một board một lần
  beforeCreate: async (values, proceed) => {
    const existing = await BoardMember.findOne({
      boardId: values.boardId,
      userId: values.userId,
    });
    if (existing) {
      return proceed(new Error("User already in this board"));
    }
    return proceed();
  },
};
