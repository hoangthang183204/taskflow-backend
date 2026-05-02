// api/models/Task.js
module.exports = {
  attributes: {
    // 📝 Cơ bản
    title: {
      type: "string",
      required: true,
      description: "Tiêu đề task",
    },

    description: {
      type: "string",
      description: "Mô tả chi tiết task",
    },

    // 🏷️ Trạng thái
    status: {
      type: "string",
      isIn: ["todo", "doing", "done"],
      defaultsTo: "todo",
      description: "Trạng thái: todo, doing, done",
    },

    // 👤 Người dùng
    userId: {
      model: "user",
      required: true,
      description: "Người tạo task",
    },

    // ⭐ Ưu tiên
    priority: {
      type: "string",
      isIn: ["low", "medium", "high"],
      defaultsTo: "medium",
      description: "Độ ưu tiên: low, medium, high",
    },

    // 📅 Hạn chót (QUAN TRỌNG NHẤT)
    dueDate: {
      type: "ref",
      columnType: "text",
      description: "Hạn chót của task",
    },

    // 🗑️ Soft delete
    isDeleted: {
      type: "boolean",
      defaultsTo: false,
      description: "Đánh dấu xóa mềm",
    },
    deletedAt: {
      type: "string",
      allowNull: true,
      description: "Thời gian xóa",
    },

    isArchived: {
      type: "boolean",
      defaultsTo: false,
    },
    archivedAt: {
      type: "string",
      allowNull: true,
    },

    mood: {
      type: "string",
      isIn: ["happy", "neutral", "sad"],
      allowNull: true,
      description: "Cảm xúc khi hoàn thành task",
    },
    moodNote: {
      type: "string",
      allowNull: true,
      description: "Ghi chú cảm xúc",
    },
  },

  beforeCreate: async function (values, proceed) {
    if (values.status === "doing") {
      const now = Date.now(); // Dùng số thay vì ISO string
      values.startDate = now;
      values.actualStartDate = now;
    }
    return proceed();
  },

  beforeUpdate: async function (values, proceed) {
    const now = Date.now(); // Dùng số

    if (values.status === "doing" && !values.actualStartDate) {
      values.actualStartDate = now;
    }

    if (values.status === "done" && !values.actualEndDate) {
      values.actualEndDate = now;

      if (values.actualStartDate) {
        const start = values.actualStartDate;
        const end = now;
        const hours = (end - start) / (1000 * 60 * 60);
        values.actualHours = Math.round(hours * 10) / 10;
      }
    }

    return proceed();
  },
};
