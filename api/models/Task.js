module.exports = {
  attributes: {
    title: {
      type: "string",
      required: true,
      description: "Tiêu đề task",
    },

    description: {
      type: "string",
      description: "Mô tả chi tiết task",
    },

    status: {
      type: "string",
      isIn: ["todo", "doing", "done"],
      defaultsTo: "todo",
      description: "Trạng thái: todo, doing, done",
    },

    userId: {
      model: "user",
      required: true,
      description: "Người tạo task",
    },

    priority: {
      type: "string",
      isIn: ["low", "medium", "high"],
      defaultsTo: "medium",
      description: "Độ ưu tiên: low, medium, high",
    },

    dueDate: {
      type: "ref",
      columnType: "text",
      description: "Hạn chót của task",
    },

    boardId: {
      type: "string",
      allowNull: true,
      description: "ID board chứa task",
    },

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

    assignedTo: {
      type: "string",
      allowNull: true,
      description: "ID người được giao task",
    },
    assignedByName: {
      type: "string",
      allowNull: true,
      description: "Tên người được giao task",
    },
    assignedAt: {
      type: "number",
      allowNull: true,
      description: "Thời gian giao task",
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
