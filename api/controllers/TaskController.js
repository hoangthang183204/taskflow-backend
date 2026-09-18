// api/controllers/TaskController.js
const TaskService = require("../services/TaskService");
const response = require("../utils/response");

const handle = (fn) => async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return response.unauthorized(res, "Vui lòng đăng nhập.");
    }
    await fn(req, res);
  } catch (err) {
    const statusCode = err.status || 500;
    const errorCode = err.code || "UNKNOWN_ERROR";
    const message = err.message || "Lỗi server, vui lòng thử lại sau.";
    return response.error(res, message, errorCode, statusCode);
  }
};

module.exports = {
  find: handle(async (req, res) => {
    const result = await TaskService.getTasks(req.user, req.query);
    const { tasks, total, page, limit } = result;
    return response.success(res, tasks, "Lấy danh sách task thành công.", 200, {
      total,
      page,
      limit,
    });
  }),

  create: handle(async (req, res) => {
    const task = await TaskService.createTask(req.user, req.body);

    if (task.boardId) {
      sails.sockets.broadcast(
        `board:${task.boardId}`,
        "task:created",
        task,
        req,
      );
      sails.log.info(`📢 Broadcast task:created to board:${task.boardId}`);
    }

    return response.success(res, task, "Tạo task thành công.", 201);
  }),

  update: handle(async (req, res) => {
    const task = await TaskService.updateTask(
      req.user,
      req.params.id,
      req.body,
    );

    if (task.boardId) {
      sails.sockets.broadcast(
        `board:${task.boardId}`,
        "task:updated",
        task,
        req,
      );
      sails.log.info(`📢 Broadcast task:updated to board:${task.boardId}`);
    }

    return response.success(res, task, "Cập nhật task thành công.");
  }),

  delete: handle(async (req, res) => {
    const task = await Task.findOne({ id: req.params.id });
    await TaskService.deleteTask(req.user, req.params.id);

    if (task?.boardId) {
      sails.sockets.broadcast(
        `board:${task.boardId}`,
        "task:deleted",
        { id: req.params.id },
        req,
      );
      sails.log.info(`📢 Broadcast task:deleted to board:${task.boardId}`);
    }

    return response.success(res, null, "Xóa task thành công.");
  }),

  // ✅ Archive — chống loop
  archive: handle(async (req, res) => {
    const taskBefore = await Task.findOne({ id: req.params.id });
    if (!taskBefore) {
      throw new Error("TASK_NOT_FOUND");
    }

    // ✅ Nếu đã archive → return, không broadcast lại
    if (taskBefore.isArchived === true) {
      return response.success(res, taskBefore, "Task đã ở kho lưu trữ.");
    }

    const updatedTask = await TaskService.archiveTask(req.user, req.params.id);

    if (updatedTask?.boardId) {
      sails.sockets.broadcast(
        `board:${updatedTask.boardId}`,
        "task:archived",
        updatedTask,
        req,
      );
      sails.log.info(
        `📢 Broadcast task:archived to board:${updatedTask.boardId}`,
      );
    }

    return response.success(res, updatedTask, "Đã lưu trữ task thành công.");
  }),

  restore: handle(async (req, res) => {
    const taskBefore = await Task.findOne({ id: req.params.id });
    if (!taskBefore) {
      throw new Error("TASK_NOT_FOUND");
    }

    // ✅ Nếu task active rồi → return
    if (!taskBefore.isArchived && !taskBefore.isDeleted) {
      return response.success(res, taskBefore, "Task đã active.");
    }

    await TaskService.restoreTask(req.user, req.params.id);

    const restoredTask = await Task.findOne({ id: req.params.id });

    if (restoredTask.boardId) {
      sails.sockets.broadcast(
        `board:${restoredTask.boardId}`,
        "task:restored",
        restoredTask,
        req,
      );
      sails.log.info(
        `📢 Broadcast task:restored to board:${restoredTask.boardId}`,
      );
    }

    return response.success(res, restoredTask, "Đã khôi phục task thành công.");
  }),

  softDelete: handle(async (req, res) => {
    const task = await Task.findOne({ id: req.params.id });
    if (!task || task.isDeleted) {
      return response.success(res, null, "Task đã bị xóa.");
    }

    await TaskService.softDeleteTask(req.user, req.params.id);

    if (task?.boardId) {
      sails.sockets.broadcast(
        `board:${task.boardId}`,
        "task:deleted",
        { id: req.params.id },
        req,
      );
      sails.log.info(`📢 Broadcast softDelete to board:${task.boardId}`);
    }

    return response.success(res, null, "Đã chuyển vào thùng rác.");
  }),

  hardDelete: handle(async (req, res) => {
    const task = await Task.findOne({ id: req.params.id });
    await TaskService.hardDeleteTask(req.user, req.params.id);

    if (task?.boardId) {
      sails.sockets.broadcast(
        `board:${task.boardId}`,
        "task:deleted",
        { id: req.params.id },
        req,
      );
      sails.log.info(`📢 Broadcast hardDelete to board:${task.boardId}`);
    }

    return response.success(res, null, "Đã xóa vĩnh viễn task.");
  }),

  getTrash: handle(async (req, res) => {
    const result = await TaskService.getTrashTasks(req.user, req.query);
    return response.success(
      res,
      result.tasks,
      "Lấy danh sách thùng rác thành công.",
      200,
      {
        total: result.total,
        page: result.page,
        limit: result.limit,
      },
    );
  }),

  assign: handle(async (req, res) => {
    const { id } = req.params;
    const { assignedTo } = req.body;

    const task = await TaskService.assignTask(req.user, id, assignedTo);

    if (task.boardId) {
      const updatedTask = await Task.findOne({ id });
      sails.sockets.broadcast(
        `board:${task.boardId}`,
        "task:updated",
        updatedTask,
        req,
      );
      sails.log.info(`📢 Broadcast assign to board:${task.boardId}`);
    }

    return response.success(res, task, "Đã gán task thành công.");
  }),

  testReminder: async (req, res) => {
    try {
      const ReminderService = require("../services/ReminderService");
      const result = await ReminderService.sendDailyReminders();
      return res.json({ success: true, result });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  },
};
