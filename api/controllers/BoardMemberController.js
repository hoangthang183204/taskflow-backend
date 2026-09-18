/**
 * BoardMemberController.js
 * Controller quản lý thành viên board
 */
module.exports = {
  addMember: async (req, res) => {
    try {
      const { boardId } = req.params;
      const { email, role } = req.body;

      const { allowed } = await PermissionService.canManageBoard(
        req.user.id,
        boardId,
      );
      if (!allowed) {
        return res
          .status(403)
          .json({ success: false, message: "Không có quyền" });
      }

      const board = await Board.findOne({ id: boardId });
      if (!board) {
        return res.status(404).json({
          success: false,
          message: "Board không tồn tại",
        });
      }

      const isOwner = String(board.userId) === String(req.user.id);
      if (!isOwner) {
        console.error(
          `❌ Quyền bị từ chối: board.userId=${board.userId}, req.user.id=${req.user.id}`,
        );
        return res.status(403).json({
          success: false,
          message: "Chỉ chủ board mới có quyền mời thành viên",
        });
      }

      const userToAdd = await User.findOne({ email: email });
      if (!userToAdd) {
        return res.status(404).json({
          success: false,
          message: `Không tìm thấy user với email: ${email}`,
        });
      }

      const userId = userToAdd.id;

      const existing = await BoardMember.findOne({
        boardId: boardId,
        userId: userId,
      });
      if (existing) {
        return res.status(400).json({
          success: false,
          message: "User đã là thành viên của board này",
        });
      }

      const member = await BoardMember.create({
        boardId: boardId,
        userId: userId,
        role: role || "member",
        invitedAt: Date.now(),
      }).fetch();

      return res.status(201).json({
        success: true,
        message: "Đã thêm thành viên",
        data: member,
      });
    } catch (err) {
      console.error("Lỗi trong addMember:", err);
      return res.status(500).json({
        success: false,
        message: err.message,
      });
    }
  },

  getMembers: async (req, res) => {
    try {
      const { boardId } = req.params;

      const [board, isMember] = await Promise.all([
        Board.findOne({ id: boardId }),
        BoardMember.findOne({ boardId, userId: req.user.id }),
      ]);

      if (!board) {
        return res
          .status(404)
          .json({ success: false, message: "Board không tồn tại" });
      }

      const isOwner = String(board.userId) === String(req.user.id);
      if (!isOwner && !isMember) {
        return res.status(403).json({
          success: false,
          message: "Bạn không có quyền xem thành viên của board này",
        });
      }

      const members = await BoardMember.find({ boardId });
      const userIds = members.map((m) => m.userId);

      const users = userIds.length ? await User.find({ id: userIds }) : [];
      const userMap = new Map(users.map((u) => [String(u.id), u]));

      const memberList = members.map((member) => {
        const u = userMap.get(String(member.userId));
        return {
          id: member.userId,
          name: u?.name || "Unknown",
          email: u?.email || "",
          role: member.role,
          invitedAt: member.invitedAt,
        };
      });

      const owner = await User.findOne({ id: board.userId });
      if (owner) {
        memberList.unshift({
          id: owner.id,
          name: owner.name,
          email: owner.email,
          role: "owner",
          invitedAt: board.createdAt,
        });
      }

      return res.status(200).json({ success: true, data: memberList });
    } catch (err) {
      console.error("Get members error:", err);
      return res.status(500).json({ success: false, message: "Lỗi server" });
    }
  },

  removeMember: async (req, res) => {
    try {
      const { boardId, userId } = req.params;

      const board = await Board.findOne({ id: boardId });
      if (!board) {
        return res.status(404).json({
          success: false,
          message: "Board không tồn tại",
        });
      }

      const isOwner = String(board.userId) === String(req.user.id);
      if (!isOwner) {
        return res.status(403).json({
          success: false,
          message: "Chỉ chủ board mới có thể xóa thành viên",
        });
      }

      if (String(userId) === String(req.user.id)) {
        return res.status(400).json({
          success: false,
          message: "Không thể xóa chính mình khỏi board",
        });
      }

      await BoardMember.destroy({
        boardId: boardId,
        userId: userId,
      });

      return res.status(200).json({
        success: true,
        message: "Đã xóa thành viên khỏi board",
      });
    } catch (err) {
      console.error("Remove member error:", err);
      return res.status(500).json({
        success: false,
        message: "Lỗi server",
      });
    }
  },

  getAssignableMembers: async (req, res) => {
    try {
      const { boardId } = req.params;

      // ✅ BỎ .select() — fetch full rồi map
      const [board, memberCheck] = await Promise.all([
        Board.findOne({ id: boardId }),
        BoardMember.findOne({ boardId, userId: req.user.id }),
      ]);

      if (!board) {
        return res.status(404).json({
          success: false,
          message: "Board không tồn tại",
        });
      }

      const isOwner = String(board.userId) === String(req.user.id);
      if (!isOwner && !memberCheck) {
        return res.status(403).json({
          success: false,
          message: "Bạn không có quyền xem danh sách thành viên",
        });
      }

      const members = await BoardMember.find({ boardId });

      // Gộp owner + member IDs, dedupe bằng Set
      const allUserIds = new Set([String(board.userId)]);
      for (const m of members) allUserIds.add(String(m.userId));

      // ✅ BỎ .select()
      const users = await User.find({
        id: [...allUserIds],
        isDeleted: false,
      });
      const userMap = new Map(users.map((u) => [String(u.id), u]));

      // Owner luôn đứng đầu
      const result = [];
      const ownerUser = userMap.get(String(board.userId));
      if (ownerUser) {
        result.push({
          id: ownerUser.id,
          name: ownerUser.name,
          email: ownerUser.email,
          role: "owner",
        });
      }

      for (const m of members) {
        const u = userMap.get(String(m.userId));
        if (u && String(u.id) !== String(board.userId)) {
          result.push({
            id: u.id,
            name: u.name,
            email: u.email,
            role: m.role,
          });
        }
      }

      return res.status(200).json({
        success: true,
        data: result,
        total: result.length,
      });
    } catch (err) {
      console.error("Get assignable members error:", err);
      return res.status(500).json({
        success: false,
        message: "Lỗi server",
      });
    }
  },
};