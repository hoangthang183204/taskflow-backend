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
  create: handle(async (req, res) => {
    const task = await TaskService.createTask(req.user, req.body);
    return response.success(res, task, "Tạo task thành công.", 201);
  }),

  find: handle(async (req, res) => {
    const result = await TaskService.getTasks(req.user, req.query);
    const { tasks, total, page, limit } = result;
    return response.success(res, tasks, "Lấy danh sách task thành công.", 200, {
      total,
      page,
      limit,
    });
  }),

  update: handle(async (req, res) => {
    const task = await TaskService.updateTask(
      req.user,
      req.params.id,
      req.body,
    );
    return response.success(res, task, "Cập nhật task thành công.");
  }),

  delete: handle(async (req, res) => {
    await TaskService.deleteTask(req.user, req.params.id);
    return response.success(res, null, "Xóa task thành công.");
  }),

  archive: handle(async (req, res) => {
    const task = await TaskService.archiveTask(req.user, req.params.id);
    return response.success(res, task, "Đã lưu trữ task thành công.");
  }),

  restore: handle(async (req, res) => {
    const task = await TaskService.restoreTask(req.user, req.params.id);
    return response.success(res, task, "Đã khôi phục task thành công.");
  }),

  softDelete: handle(async (req, res) => {
    const task = await TaskService.softDeleteTask(req.user, req.params.id);
    return response.success(res, task, "Đã chuyển vào thùng rác.");
  }),

  hardDelete: handle(async (req, res) => {
    await TaskService.hardDeleteTask(req.user, req.params.id);
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
};
