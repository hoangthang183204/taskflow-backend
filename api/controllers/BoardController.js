module.exports = {
  getMyBoards: async (req, res) => {
    try {
      const myBoards = await Board.find({ userId: req.user.id });
      const boardMembers = await BoardMember.find({ userId: req.user.id });
      const invitedBoardIds = boardMembers.map((m) => m.boardId);
      const invitedBoards = await Board.find({ id: invitedBoardIds });

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

      // ✅ Trả về JSON nhất quán
      return res.status(200).json({
        success: true,
        data: allBoards
      });
    } catch (err) {
      console.error('getMyBoards error:', err);
      // ✅ Trả về JSON lỗi, không phải HTML
      return res.status(500).json({
        success: false,
        message: err.message || "Lỗi server"
      });
    }
  },

  create: async (req, res) => {
    try {
      const { name, description, color, icon } = req.body;

      if (!name || !name.trim()) {
        return res.status(400).json({
          success: false,
          message: "Tên board không được để trống"
        });
      }

      const board = await Board.create({
        name: name.trim(),
        description: description || "",
        userId: req.user.id,
        color: color || "#3B82F6",
        icon: icon || "📋",
      }).fetch();

      // ✅ Trả về JSON nhất quán
      return res.status(201).json({
        success: true,
        data: board
      });
    } catch (err) {
      console.error('create board error:', err);
      return res.status(500).json({
        success: false,
        message: err.message || "Lỗi server khi tạo board"
      });
    }
  },

  getBoardDetail: async (req, res) => {
    try {
      const board = await Board.findOne({ id: req.params.id });
      if (!board) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy board"
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
          message: "Bạn không có quyền xem board này"
        });
      }

      return res.status(200).json({
        success: true,
        data: board
      });
    } catch (err) {
      console.error('getBoardDetail error:', err);
      return res.status(500).json({
        success: false,
        message: err.message || "Lỗi server"
      });
    }
  },

  delete: async (req, res) => {
    try {
      const board = await Board.findOne({ id: req.params.id });
      if (!board) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy board"
        });
      }
      
      if (board.userId !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: "Bạn không có quyền xóa board này"
        });
      }

      await Board.destroyOne({ id: req.params.id });
      await Task.update({ boardId: req.params.id }).set({ boardId: null });

      return res.status(200).json({
        success: true,
        message: "Đã xóa board"
      });
    } catch (err) {
      console.error('delete board error:', err);
      return res.status(500).json({
        success: false,
        message: err.message || "Lỗi server khi xóa board"
      });
    }
  },
};