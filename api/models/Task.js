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
      type: "string",
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

  // 🕐 Lifecycle hooks - Tự động theo dõi thời gian thực tế
  beforeCreate: async function (values, proceed) {
    // Nếu tạo task với status = "doing", tự động ghi nhận thời gian bắt đầu
    if (values.status === "doing") {
      const now = new Date().toISOString();
      values.startDate = now; // Thời gian bắt đầu dự kiến
      values.actualStartDate = now; // Thời gian bắt đầu thực tế
    }

    return proceed();
  },

  beforeUpdate: async function (values, proceed) {
    const now = new Date().toISOString();

    // 🔥 KHI CHUYỂN STATUS TỪ "todo" → "doing"
    if (values.status === "doing" && !values.actualStartDate) {
      values.actualStartDate = now;
    }

    // 🔥 KHI CHUYỂN STATUS TỪ "doing" → "done"
    if (values.status === "done" && !values.actualEndDate) {
      values.actualEndDate = now;

      // Tự động tính số giờ thực tế nếu có actualStartDate
      if (values.actualStartDate) {
        const start = new Date(values.actualStartDate);
        const end = new Date(now);
        const hours = (end - start) / (1000 * 60 * 60);
        values.actualHours = Math.round(hours * 10) / 10; // Làm tròn 1 chữ số thập phân
      }
    }

    return proceed();
  },
};
