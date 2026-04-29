// api/services/TaskService.js
const sanitize = require("../utils/sanitize");
const createError = require("../utils/error");
const TaskValidator = require("../validators/taskValidator");

module.exports = {
  createTask: async (user, rawData) => {
    if (!user || !user.id) {
      throw createError("UNAUTHORIZED", "User không hợp lệ", 401);
    }

    const data = sanitize(rawData);

    // Validate dữ liệu
    const errors = TaskValidator.validateCreate(data);
    if (errors.length > 0) {
      throw createError("VALIDATION_ERROR", errors.join(", "));
    }

    // ✅ Chỉ lấy các field cần thiết
    const taskData = {
      title: data.title,
      description: data.description || "",
      priority: data.priority || "medium",
      dueDate: data.dueDate || null,
      userId: user.id,
      // ❌ ĐÃ XÓA: startDate, endDate, estimatedHours
    };

    const task = await Task.create(taskData).fetch();
    return task;
  },

  getTasks: async (user, query) => {
    const MAX_LIMIT = 20;

    const page = Math.max(parseInt(query.page) || 1, 1);
    const limit = Math.min(parseInt(query.limit) || 5, MAX_LIMIT);

    const where = {
      userId: user.id,
      isDeleted: false,
    };

    if (query.search && query.search.trim()) {
      where.or = [
        { title: { contains: query.search } },
        { description: { contains: query.search } },
      ];
    }

    // Filter theo status
    if (query.status) {
      if (!["todo", "doing", "done"].includes(query.status)) {
        throw createError("INVALID_STATUS", "Status không hợp lệ");
      }
      where.status = query.status;
    }

    // Filter theo priority
    if (query.priority) {
      if (!["low", "medium", "high"].includes(query.priority)) {
        throw createError("INVALID_PRIORITY", "Priority không hợp lệ");
      }
      where.priority = query.priority;
    }

    // ❌ ĐÃ XÓA: filter theo startDate, endDate

    const tasks = await Task.find({
      where,
      limit,
      skip: (page - 1) * limit,
      sort: "createdAt DESC",
    });

    const total = await Task.count(where);

    return { tasks, total, page, limit };
  },

  // api/services/TaskService.js
  updateTask: async (user, id, rawData) => {
    if (!id || typeof id !== "string") {
      throw createError("INVALID_ID", "ID không hợp lệ");
    }

    const task = await Task.findOne({
      id,
      userId: user.id,
      isDeleted: false,
    });

    if (!task) {
      throw createError("TASK_NOT_FOUND", "Không tìm thấy task");
    }

    const data = sanitize(rawData);

    const errors = TaskValidator.validateUpdate(data);
    if (errors.length > 0) {
      throw createError("VALIDATION_ERROR", errors.join(", "));
    }

    const updateData = {};

    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined)
      updateData.description = data.description;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.priority !== undefined) updateData.priority = data.priority;
    if (data.dueDate !== undefined) updateData.dueDate = data.dueDate;

    // 🆕 THÊM mood và moodNote
    if (data.mood !== undefined) updateData.mood = data.mood;
    if (data.moodNote !== undefined) updateData.moodNote = data.moodNote;

    // ✅ SỬA: Cho phép update ngay cả khi chỉ có mood/moodNote
    // Không throw lỗi nếu chỉ update mood
    // if (Object.keys(updateData).length === 0) {
    //   throw createError("NO_DATA", "Không có dữ liệu để update");
    // }

    const updatedTask = await Task.updateOne({ id }).set(updateData);
    return updatedTask;
  },

  deleteTask: async (user, id) => {
    const task = await Task.findOne({
      id,
      userId: user.id,
      isDeleted: false,
    });

    if (!task) {
      throw createError("TASK_NOT_FOUND", "Không tìm thấy task");
    }

    await Task.updateOne({ id }).set({ isDeleted: true });
    return true;
  },

  archiveTask: async (user, id) => {
    const task = await Task.findOne({ id, userId: user.id, isDeleted: false });
    if (!task) {
      throw createError("TASK_NOT_FOUND", "Không tìm thấy task");
    }

    await Task.updateOne({ id }).set({
      isArchived: true,
      archivedAt: new Date().toISOString(),
    });
    return true;
  },

  restoreTask: async (user, id) => {
    const task = await Task.findOne({ id, userId: user.id });

    if (!task) {
      throw createError("TASK_NOT_FOUND", "Không tìm thấy task");
    }

    if (task.isArchived === true) {
      await Task.updateOne({ id }).set({
        isArchived: false,
        archivedAt: null,
      });
      return true;
    }

    if (task.isDeleted === true) {
      await Task.updateOne({ id }).set({
        isDeleted: false,
        deletedAt: null,
      });
      return true;
    }

    throw createError(
      "INVALID_STATE",
      "Task không ở trạng thái có thể khôi phục",
      400,
    );
  },
  softDeleteTask: async (user, id) => {
    const task = await Task.findOne({
      id,
      userId: user.id,
      isDeleted: false,
      isArchived: false,
    });

    if (!task) {
      throw createError("TASK_NOT_FOUND", "Không tìm thấy task");
    }

    await Task.updateOne({ id }).set({
      isDeleted: true,
      deletedAt: new Date().toISOString(),
    });

    return true;
  },

  hardDeleteTask: async (user, id) => {
    const task = await Task.findOne({
      id,
      userId: user.id,
    });

    if (!task) {
      throw createError("TASK_NOT_FOUND", "Không tìm thấy task");
    }

    await Task.destroyOne({ id });

    return true;
  },

  getTrashTasks: async (user, query) => {
    const MAX_LIMIT = 100;
    const page = Math.max(parseInt(query.page) || 1, 1);
    const limit = Math.min(parseInt(query.limit) || 10, MAX_LIMIT);
    const skip = (page - 1) * limit;

    const where = {
      userId: user.id,
      isDeleted: true,
    };

    const tasks = await Task.find({
      where,
      limit,
      skip,
      sort: "deletedAt DESC",
    });

    const total = await Task.count(where);

    return {
      tasks,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },
};
