module.exports = {
  getMyBoards: async (req, res) => {
    try {
      // Boards do user tạo
      const myBoards = await Board.find({ userId: req.user.id });

      // Boards user được mời vào
      const boardMembers = await BoardMember.find({ userId: req.user.id });
      const invitedBoardIds = boardMembers.map((m) => m.boardId);
      const invitedBoards = await Board.find({ id: invitedBoardIds });

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

      return res.ok(allBoards);
    } catch (err) {
      return res.serverError({ message: "Lỗi server" });
    }
  },

  // Tạo board mới
  create: async (req, res) => {
    try {
      const { name, description, color, icon } = req.body;

      if (!name || !name.trim()) {
        return res.badRequest({ message: "Tên board không được để trống" });
      }

      // ✅ KHÔNG GỬI teamId
      const board = await Board.create({
        name: name.trim(),
        description: description || "",
        userId: req.user.id,
        color: color || "#3B82F6",
        icon: icon || "📋",
        createdAt: Date.now(),
      }).fetch();

      return res.ok(board);
    } catch (err) {
      return res.serverError({ message: "Lỗi server: " + err.message });
    }
  },

  // Lấy chi tiết board
  getBoardDetail: async (req, res) => {
    try {
      const board = await Board.findOne({ id: req.params.id });
      if (!board) {
        return res.notFound({ message: "Không tìm thấy board" });
      }

      let hasAccess = false;

      // Case 1: User là owner
      if (board.userId === req.user.id) {
        hasAccess = true;
      }

      // Case 2: User được mời vào board
      const isMember = await BoardMember.findOne({
        boardId: board.id,
        userId: req.user.id,
      });

      if (isMember) {
        hasAccess = true;
      }

      if (!hasAccess) {
        return res.forbidden({ message: "Bạn không có quyền xem board này" });
      }

      return res.ok(board);
    } catch (err) {
      return res.serverError({ message: "Lỗi server" });
    }
  },

  // Xóa board
  delete: async (req, res) => {
    try {
      const board = await Board.findOne({ id: req.params.id });
      if (!board) {
        return res.notFound({ message: "Không tìm thấy board" });
      }
      if (board.userId !== req.user.id) {
        return res.forbidden({ message: "Bạn không có quyền xóa board này" });
      }

      await Board.destroyOne({ id: req.params.id });

      // Cập nhật task: xóa boardId (nếu có)
      await Task.update({ boardId: req.params.id }).set({ boardId: null });

      return res.ok({ message: "Đã xóa board" });
    } catch (err) {
      return res.serverError({ message: "Lỗi server" });
    }
  },
};
