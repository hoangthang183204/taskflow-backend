module.exports = {
  addMember: async (req, res) => {
    try {
      const { boardId, userId, role } = req.body;

      // Kiểm tra board tồn tại
      const board = await Board.findOne({ id: boardId });
      if (!board) {
        return res.status(404).json({ message: "Board không tồn tại" });
      }

      // Kiểm tra quyền: chỉ owner hoặc admin mới được thêm member
      const isOwner = String(board.userId) === String(req.user.id);
      const isAdmin = await BoardMember.findOne({
        boardId: boardId,
        userId: req.user.id,
        role: "admin",
      });

      if (!isOwner && !isAdmin) {
        return res
          .status(403)
          .json({ message: "Bạn không có quyền thêm thành viên" });
      }

      // Kiểm tra user tồn tại
      const user = await User.findOne({ id: userId });
      if (!user) {
        return res.status(404).json({ message: "User không tồn tại" });
      }

      // Kiểm tra đã là member chưa
      const existing = await BoardMember.findOne({
        boardId: boardId,
        userId: userId,
      });

      if (existing) {
        return res
          .status(400)
          .json({ message: "User đã là thành viên của board này" });
      }

      // Thêm member
      const member = await BoardMember.create({
        boardId: boardId,
        userId: userId,
        role: role || "member",
        invitedAt: Date.now(),
      }).fetch();

      return res.status(201).json({ success: true, data: member });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  // Xóa thành viên
  removeMember: async (req, res) => {
    try {
      const { boardId, userId } = req.params;

      const board = await Board.findOne({ id: boardId });
      if (!board) {
        return res.status(404).json({ message: "Board không tồn tại" });
      }

      // Không cho xóa owner
      if (String(board.userId) === userId) {
        return res
          .status(400)
          .json({ message: "Không thể xóa chủ sở hữu của board" });
      }

      // Kiểm tra quyền
      const isOwner = String(board.userId) === String(req.user.id);
      const isAdmin = await BoardMember.findOne({
        boardId: boardId,
        userId: req.user.id,
        role: "admin",
      });

      if (!isOwner && !isAdmin) {
        return res
          .status(403)
          .json({ message: "Bạn không có quyền xóa thành viên" });
      }

      await BoardMember.destroy({
        boardId: boardId,
        userId: userId,
      });

      return res
        .status(200)
        .json({ success: true, message: "Đã xóa thành viên" });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  // Lấy danh sách thành viên
  getMembers: async (req, res) => {
    try {
      const boardId = req.params.boardId;

      const members = await BoardMember.find({ boardId: boardId }).populate(
        "userId",
      );

      return res.status(200).json({ success: true, data: members });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },
  getMyBoards: async (req, res) => {
    try {
      // Boards do user tạo
      const myBoards = await Board.find({ userId: req.user.id });

      // Boards user được mời vào (loại trừ board đã tạo)
      const boardMembers = await BoardMember.find({ userId: req.user.id });
      const invitedBoardIds = boardMembers.map((m) => m.boardId);

      const myBoardIds = myBoards.map((b) => b.id);
      const uniqueInvitedIds = invitedBoardIds.filter(
        (id) => !myBoardIds.includes(id),
      );

      const invitedBoards = await Board.find({ id: uniqueInvitedIds });

      // Gộp và đánh dấu role
      const allBoards = [
        ...myBoards.map((b) => ({
          ...b,
          role: "owner",
          type: "personal",
        })),
        ...invitedBoards.map((b) => ({
          ...b,
          role: boardMembers.find((m) => m.boardId === b.id)?.role || "member",
          type: "shared",
        })),
      ];

      return res.status(200).json({ success: true, data: allBoards });
    } catch (err) {
      console.error("getMyBoards error:", err);
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  create: async (req, res) => {
    try {
      const { name, description, color, icon } = req.body;

      // Tạo board
      const board = await Board.create({
        name: name.trim(),
        description: description || "",
        userId: req.user.id,
        color: color || "#3B82F6",
        icon: icon || "📋",
      }).fetch();

      await BoardMember.create({
        boardId: board.id,
        userId: req.user.id,
        role: "admin",
        invitedAt: Date.now(),
      }).fetch();

      return res.status(201).json({ success: true, data: board });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  getBoardDetail: async (req, res) => {
    try {
      const board = await Board.findOne({ id: req.params.id });
      if (!board) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy board",
        });
      }

      let hasAccess = false;
      if (board.userId === req.user.id) {
        hasAccess = true;
      } else {
        const isMember = await BoardMember.findOne({
          boardId: board.id,
          userId: req.user.id,
        });
        if (isMember) hasAccess = true;
      }

      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: "Bạn không có quyền xem board này",
        });
      }

      return res.status(200).json({
        success: true,
        data: board,
      });
    } catch (err) {
      console.error("getBoardDetail error:", err);
      return res.status(500).json({
        success: false,
        message: err.message || "Lỗi server",
      });
    }
  },

  delete: async (req, res) => {
    try {
      const board = await Board.findOne({ id: req.params.id });

      if (!board) {
        return res.status(404).json({ message: "Không tìm thấy board" });
      }

      const isOwner = String(board.userId) === String(req.user.id);
      const isAdmin = await BoardMember.findOne({
        boardId: board.id,
        userId: req.user.id,
        role: "admin",
      });

      if (!isOwner && !isAdmin) {
        return res
          .status(403)
          .json({ message: "Bạn không có quyền xóa board này" });
      }

      await Board.destroyOne({ id: req.params.id });

      await BoardMember.destroy({ boardId: req.params.id });

      await Task.update({ boardId: req.params.id }).set({ boardId: null });

      return res.status(200).json({ success: true, message: "Đã xóa board" });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },
};
