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

    const errors = TaskValidator.validateCreate(data);
    if (errors.length > 0) {
      throw createError("VALIDATION_ERROR", errors.join(", "));
    }

    const taskData = {
      title: data.title,
      description: data.description || "",
      priority: data.priority || "medium",
      dueDate: data.dueDate || null,
      userId: user.id,
      boardId: data.boardId || null,
    };

    if (data.assignedTo) {
      taskData.assignedTo = data.assignedTo;
    }

    const task = await Task.create(taskData).fetch();
    return task;
  },

  getTasks: async (user, query) => {
    // ✅ FIX: MAX_LIMIT nâng lên 500, DEFAULT_LIMIT = 100
    // Trước đây: Math.min(limit, DEFAULT_LIMIT=10, MAX_LIMIT=100) → luôn cap ở 10
    // Bây giờ:   Math.min(limit, MAX_LIMIT=500) → tôn trọng limit client gửi
    const MAX_LIMIT = 500;
    const DEFAULT_LIMIT = 100;
    const page = Math.max(parseInt(query.page) || 1, 1);
    const limit = Math.min(
      parseInt(query.limit) || DEFAULT_LIMIT,
      MAX_LIMIT,
    );
    const skip = (page - 1) * limit;

    let where = {};

    if (query.boardId) {
      const [board, isMember] = await Promise.all([
        Board.findOne({ id: query.boardId }),
        BoardMember.findOne({ boardId: query.boardId, userId: user.id }),
      ]);

      if (board) {
        const isOwner = String(board.userId) === String(user.id);
        if (isOwner || isMember) {
          where.boardId = query.boardId;
          where.isDeleted = false;
        } else {
          return { tasks: [], total: 0, page, limit, totalPages: 0 };
        }
      } else {
        where.boardId = query.boardId;
        where.isDeleted = false;
      }
    } else {
      const [myBoards, memberBoards] = await Promise.all([
        Board.find({ userId: user.id }),
        BoardMember.find({ userId: user.id }),
      ]);

      const allBoardIds = [
        ...new Set([
          ...myBoards.map((b) => b.id),
          ...memberBoards.map((m) => m.boardId),
        ]),
      ];

      where = {
        or: [{ boardId: { in: allBoardIds } }, { boardId: null }],
        isDeleted: false,
      };
    }

    if (query.status) where.status = query.status;
    if (query.priority) where.priority = query.priority;

    if (query.assignedTo) {
      if (query.assignedTo === "null") {
        where.assignedTo = null;
      } else {
        where.assignedTo = query.assignedTo;
      }
    }

    if (query.search) {
      const usersWithEmail = await User.find({
        email: { contains: query.search },
        isDeleted: false,
      });
      const userIdsByEmail = usersWithEmail.map((u) => u.id);

      const searchOr = [
        { title: { contains: query.search } },
        { description: { contains: query.search } },
      ];
      if (userIdsByEmail.length > 0) {
        searchOr.push({ assignedTo: { in: userIdsByEmail } });
      }

      if (where.or) {
        const rest = {};
        for (const [k, v] of Object.entries(where)) {
          if (k !== "or") rest[k] = v;
        }
        where = {
          and: [
            { or: where.or },
            ...(Object.keys(rest).length ? [rest] : []),
            { or: searchOr },
          ],
        };
      } else {
        where.or = searchOr;
      }
    }

    const [tasks, total] = await Promise.all([
      Task.find({ where, limit, skip, sort: "createdAt DESC" }),
      Task.count(where),
    ]);

    const assignedIds = [
      ...new Set(tasks.map((t) => t.assignedTo).filter(Boolean)),
    ];
    const assignedUsers = assignedIds.length
      ? await User.find({ id: assignedIds })
      : [];
    const userMap = new Map(assignedUsers.map((u) => [String(u.id), u]));

    const tasksWithEmail = tasks.map((task) => {
      const taskObj = task.toObject ? task.toObject() : { ...task };
      if (taskObj.assignedTo) {
        const u = userMap.get(String(taskObj.assignedTo));
        if (u) taskObj.assignedToEmail = u.email;
      }
      return taskObj;
    });

    return {
      tasks: tasksWithEmail,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },

  assignTask: async (user, taskId, assignedTo) => {
    const task = await Task.findOne({ id: taskId });
    if (!task) {
      throw createError("TASK_NOT_FOUND", "Không tìm thấy task", 404);
    }

    const board = await Board.findOne({ id: task.boardId });
    if (!board) {
      throw createError(
        "BOARD_NOT_FOUND",
        "Không tìm thấy board của task",
        404,
      );
    }

    const isOwner = String(board.userId) === String(user.id);

    const isAdmin = await BoardMember.findOne({
      boardId: task.boardId,
      userId: user.id,
      role: "admin",
    });

    if (!isOwner && !isAdmin) {
      console.log(
        `❌ Gán task thất bại: user=${user.id}, boardOwner=${board.userId}, isAdmin=${!!isAdmin}`,
      );
      throw createError(
        "FORBIDDEN",
        "Bạn không có quyền gán task. Chỉ chủ board hoặc admin mới có quyền này.",
        403,
      );
    }

    const assignedUser = await User.findOne({ id: assignedTo });
    if (!assignedUser) {
      throw createError("USER_NOT_FOUND", "Không tìm thấy người dùng", 404);
    }

    // ✅ FIX: updateOne().set() trong Sails/Waterline trả về record CŨ
    // Phải fetch lại để có data mới → broadcast WS đúng
    await Task.updateOne({ id: taskId }).set({
      assignedTo: assignedTo,
      assignedByName: assignedUser.name,
      assignedAt: Date.now(),
    });

    const updatedTask = await Task.findOne({ id: taskId });

    console.log(
      `✅ Gán task thành công: task=${taskId}, assignedTo=${assignedTo}, by=${user.id}`,
    );

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

    // ✅ Check quyền: owner task HOẶC assigned HOẶC board member
    const isOwner = String(task.userId) === String(user.id);
    const isAssigned = String(task.assignedTo) === String(user.id);

    let isBoardMember = false;
    let board = null;

    if (task.boardId) {
      board = await Board.findOne({ id: task.boardId });
      if (board) {
        const isBoardOwner = String(board.userId) === String(user.id);
        const member = await BoardMember.findOne({
          boardId: task.boardId,
          userId: user.id,
        });
        isBoardMember = isBoardOwner || !!member;
      }
    }

    const canUpdate = isOwner || isAssigned || isBoardMember;

    if (!canUpdate) {
      console.log(
        `❌ Update task thất bại: user=${user.id}, taskOwner=${task.userId}, boardId=${task.boardId}, isMember=${isBoardMember}`,
      );
      throw createError(
        "FORBIDDEN",
        "Bạn không có quyền cập nhật task này",
        403,
      );
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
      if (data.assignedTo && board) {
        const isTargetInBoard = await BoardMember.findOne({
          boardId: board.id,
          userId: data.assignedTo,
        });
        if (!isTargetInBoard && board.userId !== data.assignedTo) {
          throw createError("FORBIDDEN", "Người dùng không thuộc board này");
        }

        const assignedUser = await User.findOne({ id: data.assignedTo });
        if (assignedUser) {
          updateData.assignedByName = assignedUser.name;
        }
      }
      updateData.assignedTo = data.assignedTo;
      updateData.assignedAt = Date.now();
    }

    // ✅ FIX: fetch lại sau update để có data mới
    await Task.updateOne({ id }).set(updateData);
    const updatedTask = await Task.findOne({ id });
    return updatedTask;
  },

  // ✅ Helper: Kiểm tra user có quyền thao tác task
  _canModifyTask: async (user, task) => {
    const isOwner = String(task.userId) === String(user.id);
    const isAssigned = String(task.assignedTo) === String(user.id);

    let isBoardMember = false;
    if (task.boardId) {
      const board = await Board.findOne({ id: task.boardId });
      if (board) {
        const isBoardOwner = String(board.userId) === String(user.id);
        const member = await BoardMember.findOne({
          boardId: task.boardId,
          userId: user.id,
        });
        isBoardMember = isBoardOwner || !!member;
      }
    }

    return isOwner || isAssigned || isBoardMember;
  },

  deleteTask: async (user, id) => {
    const task = await Task.findOne({
      id,
      isDeleted: false,
    });

    if (!task) {
      throw createError("TASK_NOT_FOUND", "Không tìm thấy task");
    }

    const canModify = await module.exports._canModifyTask(user, task);
    if (!canModify) {
      throw createError("FORBIDDEN", "Bạn không có quyền xóa task này", 403);
    }

    await Task.updateOne({ id }).set({
      isDeleted: true,
      deletedAt: Date.now(),
    });
    return true;
  },

  // ✅ Cho phép member archive task trong board
  archiveTask: async (user, id) => {
    const task = await Task.findOne({
      id,
      isDeleted: false,
    });

    if (!task) {
      throw createError("TASK_NOT_FOUND", "Không tìm thấy task");
    }

    // ✅ Nếu đã archive → return luôn, KHÔNG update lại
    if (task.isArchived === true) {
      return task;
    }

    const canModify = await module.exports._canModifyTask(user, task);
    if (!canModify) {
      throw createError(
        "FORBIDDEN",
        "Bạn không có quyền lưu trữ task này",
        403,
      );
    }

    await Task.updateOne({ id }).set({
      isArchived: true,
      archivedAt: Date.now(),
    });

    return await Task.findOne({ id });
  },

  // ✅ Cho phép member restore task
  restoreTask: async (user, id) => {
    const task = await Task.findOne({ id });

    if (!task) {
      throw createError("TASK_NOT_FOUND", "Không tìm thấy task");
    }

    const canModify = await module.exports._canModifyTask(user, task);
    if (!canModify) {
      throw createError(
        "FORBIDDEN",
        "Bạn không có quyền khôi phục task này",
        403,
      );
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

  // ✅ Cho phép member soft delete task trong board
  softDeleteTask: async (user, id) => {
    const task = await Task.findOne({
      id,
      isDeleted: false,
    });

    if (!task) {
      throw createError("TASK_NOT_FOUND", "Không tìm thấy task");
    }

    const canModify = await module.exports._canModifyTask(user, task);
    if (!canModify) {
      throw createError("FORBIDDEN", "Bạn không có quyền xóa task này", 403);
    }

    await Task.updateOne({ id }).set({
      isDeleted: true,
      deletedAt: Date.now(),
    });

    return true;
  },

  // ✅ Cho phép member hard delete
  hardDeleteTask: async (user, id) => {
    const task = await Task.findOne({ id });

    if (!task) {
      throw createError("TASK_NOT_FOUND", "Không tìm thấy task");
    }

    const canModify = await module.exports._canModifyTask(user, task);
    if (!canModify) {
      throw createError(
        "FORBIDDEN",
        "Bạn không có quyền xóa vĩnh viễn task này",
        403,
      );
    }

    await Task.destroyOne({ id });
    return true;
  },

  // ✅ Thùng rác CHUNG — user thấy task của board mình xóa
  getTrashTasks: async (user, query) => {
    // ✅ FIX tương tự: nâng MAX, bỏ DEFAULT ra khỏi Math.min
    const MAX_LIMIT = 500;
    const DEFAULT_LIMIT = 50;
    const page = Math.max(parseInt(query.page) || 1, 1);
    const limit = Math.min(
      parseInt(query.limit) || DEFAULT_LIMIT,
      MAX_LIMIT,
    );
    const skip = (page - 1) * limit;

    // ✅ Lấy tất cả board IDs user có quyền
    const [myBoards, memberBoards] = await Promise.all([
      Board.find({ userId: user.id }),
      BoardMember.find({ userId: user.id }),
    ]);

    const allBoardIds = [
      ...new Set([
        ...myBoards.map((b) => b.id),
        ...memberBoards.map((m) => m.boardId),
      ]),
    ];

    // ✅ Task user tự xóa HOẶC task trong board user có quyền (ai đó xóa)
    const where = {
      isDeleted: true,
      or: [
        { userId: user.id }, // Task user tạo
        { boardId: { in: allBoardIds } }, // Task trong board user có quyền
      ],
    };

    const [tasks, total] = await Promise.all([
      Task.find({
        where,
        limit,
        skip,
        sort: "deletedAt DESC",
      }),
      Task.count(where),
    ]);

    return {
      tasks,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },
};