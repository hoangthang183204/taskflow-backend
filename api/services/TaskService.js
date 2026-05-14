const sanitize = require("../utils/sanitize");
const createError = require("../utils/error");
const TaskValidator = require("../validators/taskValidator");

module.exports = {
  createTask: async (user, rawData) => {
    if (!user || !user.id) {
      throw createError("UNAUTHORIZED", "User không hợp lệ", 401);
    }

    const data = sanitize(rawData);

    const errors = TaskValidator.validateCreate(data);
    if (errors.length > 0) {
      throw createError("VALIDATION_ERROR", errors.join(", "));
    }

    // ✅ THÊM boardId VÀO taskData
    const taskData = {
      title: data.title,
      description: data.description || "",
      priority: data.priority || "medium",
      dueDate: data.dueDate || null,
      userId: user.id,
      boardId: data.boardId || null, // ⭐ THÊM DÒNG NÀY
    };

    if (data.assignedTo) {
      taskData.assignedTo = data.assignedTo;
    }

    const task = await Task.create(taskData).fetch();
    return task;
  },

  getTasks: async (user, query) => {
    const MAX_LIMIT = 100;
    const page = Math.max(parseInt(query.page) || 1, 1);
    const limit = Math.min(parseInt(query.limit) || 10, MAX_LIMIT);
    const skip = (page - 1) * limit;

    let where = {};

    if (query.boardId) {
      const board = await Board.findOne({ id: query.boardId });

      if (board) {
        const isOwner = String(board.userId) === String(user.id);
        const isMember = await BoardMember.findOne({
          boardId: board.id,
          userId: user.id,
        });

        if (isOwner || isMember) {
          where.boardId = query.boardId;
          where.isDeleted = false;
        } else {
          return { tasks: [], total: 0, page, limit };
        }
      } else {
        where.boardId = query.boardId;
      }
    } else {
      const myBoards = await Board.find({ userId: user.id });
      const myBoardIds = myBoards.map((b) => b.id);

      const memberBoards = await BoardMember.find({ userId: user.id });
      const memberBoardIds = memberBoards.map((m) => m.boardId);

      const allBoardIds = [...new Set([...myBoardIds, ...memberBoardIds])];

      where = {
        boardId: allBoardIds,
        isDeleted: false,
      };
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.priority) {
      where.priority = query.priority;
    }

    if (query.assignedTo) {
      if (query.assignedTo === "null") {
        where.assignedTo = null;
      } else {
        where.assignedTo = query.assignedTo;
      }
    }

    let userIdsByEmail = [];
    if (query.search) {
      // Tìm user theo email
      const usersWithEmail = await User.find({
        email: { contains: query.search },
        isDeleted: false,
      });
      userIdsByEmail = usersWithEmail.map((u) => u.id);
    }

    if (query.search) {
      where.or = [
        { title: { contains: query.search } },
        { description: { contains: query.search } },
      ];

      // ✅ THÊM: Tìm kiếm theo assignedTo (email)
      if (userIdsByEmail.length > 0) {
        where.or.push({ assignedTo: userIdsByEmail });
      }
    }

    const tasks = await Task.find({
      where,
      limit,
      skip,
      sort: "createdAt DESC",
    });

    const tasksWithEmail = await Promise.all(
      tasks.map(async (task) => {
        const taskObj = task.toObject ? task.toObject() : { ...task };
        if (taskObj.assignedTo) {
          const assignedUser = await User.findOne({ id: taskObj.assignedTo });
          if (assignedUser) {
            taskObj.assignedToEmail = assignedUser.email;
          }
        }
        return taskObj;
      }),
    );

    const total = await Task.count(where);

    return { tasks: tasksWithEmail, total, page, limit };
  },

  assignTask: async (user, taskId, assignedTo) => {
    // 1. Tìm task
    const task = await Task.findOne({ id: taskId });
    if (!task) {
      throw createError("TASK_NOT_FOUND", "Không tìm thấy task", 404);
    }

    // 2. Tìm board của task
    const board = await Board.findOne({ id: task.boardId });
    if (!board) {
      throw createError(
        "BOARD_NOT_FOUND",
        "Không tìm thấy board của task",
        404,
      );
    }

    // 3. ✅ Kiểm tra quyền: NGƯỜI GÁN PHẢI LÀ CHỦ BOARD (OWNER)
    const isOwner = String(board.userId) === String(user.id);
    if (!isOwner) {
      throw createError(
        "FORBIDDEN",
        "Bạn không có quyền gán task. Chỉ chủ board mới có quyền này.",
        403,
      );
    }

    // 4. Tìm người được gán
    const assignedUser = await User.findOne({ id: assignedTo });
    if (!assignedUser) {
      throw createError("USER_NOT_FOUND", "Không tìm thấy người dùng", 404);
    }

    // 5. Cập nhật task
    const updatedTask = await Task.updateOne({ id: taskId }).set({
      assignedTo: assignedTo,
      assignedByName: assignedUser.name,
      assignedAt: Date.now(),
    });

    return updatedTask;
  },

  updateTask: async (user, id, rawData) => {
    if (!id || typeof id !== "string") {
      throw createError("INVALID_ID", "ID không hợp lệ");
    }

    const task = await Task.findOne({
      id,
      isDeleted: false,
    });

    if (!task) {
      throw createError("TASK_NOT_FOUND", "Không tìm thấy task");
    }

    // Lấy thông tin board
    const board = await Board.findOne({ id: task.boardId });

    // Kiểm tra quyền: người tạo HOẶC người được giao HOẶC member của board
    const isOwner = task.userId === user.id;
    const isAssigned = task.assignedTo === user.id;

    // Kiểm tra có phải member của board không
    let isBoardMember = false;
    if (board) {
      const member = await BoardMember.findOne({
        boardId: board.id,
        userId: user.id,
      });
      isBoardMember = !!member;
    }

    // Member của board có thể update status của task trong board đó
    const canUpdate = isOwner || isAssigned || isBoardMember;

    if (!canUpdate) {
      throw createError("FORBIDDEN", "Bạn không có quyền cập nhật task này");
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
    if (data.mood !== undefined) updateData.mood = data.mood;
    if (data.moodNote !== undefined) updateData.moodNote = data.moodNote;
    if (data.assignedTo !== undefined) {
      // Nếu gán task, kiểm tra người được gán có trong board không
      if (data.assignedTo && board) {
        const isTargetInBoard = await BoardMember.findOne({
          boardId: board.id,
          userId: data.assignedTo,
        });
        // Cho phép gán cho owner hoặc member
        if (!isTargetInBoard && board.userId !== data.assignedTo) {
          throw createError("FORBIDDEN", "Người dùng không thuộc board này");
        }

        // Lấy tên người được gán
        const assignedUser = await User.findOne({ id: data.assignedTo });
        if (assignedUser) {
          updateData.assignedByName = assignedUser.name;
        }
      }
      updateData.assignedTo = data.assignedTo;
      updateData.assignedAt = Date.now();
    }

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
      archivedAt: Date.now(),
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
      deletedAt: Date.now(),
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
