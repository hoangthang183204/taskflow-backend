module.exports = {
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
      if (String(board.userId) === String(req.user.id)) {
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
