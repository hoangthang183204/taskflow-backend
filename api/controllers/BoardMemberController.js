/**
 * BoardMemberController.js
 * Controller quản lý thành viên board
 */
module.exports = {
  // Thêm thành viên vào board
  addMember: async (req, res) => {
    try {
      const { boardId } = req.params;
      const { email, role } = req.body;

      if (!email) {
        return res.badRequest({ message: "Vui lòng nhập email" });
      }

      // Kiểm tra board tồn tại
      const board = await Board.findOne({ id: boardId });
      if (!board) {
        return res.notFound({ message: "Board không tồn tại" });
      }

      // Kiểm tra quyền: chỉ owner mới được mời
      if (board.userId !== req.user.id) {
        return res.forbidden({
          message: "Chỉ chủ board mới có thể mời thành viên",
        });
      }

      // Tìm user theo email
      const userToInvite = await User.findOne({
        email: email.toLowerCase().trim(),
      });
      if (!userToInvite) {
        return res.notFound({
          message: "Không tìm thấy người dùng với email này",
        });
      }

      // Không thể mời chính mình
      if (userToInvite.id === req.user.id) {
        return res.badRequest({ message: "Không thể mời chính mình" });
      }

      // Kiểm tra đã là thành viên chưa
      const existing = await BoardMember.findOne({
        boardId: boardId,
        userId: userToInvite.id,
      });

      if (existing) {
        return res.badRequest({
          message: "Người dùng đã là thành viên của board này",
        });
      }

      // Thêm thành viên
      const member = await BoardMember.create({
        boardId: boardId,
        userId: userToInvite.id,
        role: role || "member",
      }).fetch();

      return res.ok({
        message: `Đã mời ${userToInvite.name} vào board thành công!`,
        member: {
          id: userToInvite.id,
          name: userToInvite.name,
          email: userToInvite.email,
          role: role || "member",
        },
      });
    } catch (err) {
      console.error("Add member error:", err);
      if (err.message === "User already in this board") {
        return res.badRequest({
          message: "Người dùng đã là thành viên của board này",
        });
      }
      return res.serverError({ message: "Lỗi server, vui lòng thử lại sau" });
    }
  },

  // Lấy danh sách thành viên của board
  getMembers: async (req, res) => {
    try {
      const { boardId } = req.params;

      // Kiểm tra board tồn tại
      const board = await Board.findOne({ id: boardId });
      if (!board) {
        return res.notFound({ message: "Board không tồn tại" });
      }

      // Kiểm tra quyền xem
      const isMember = await BoardMember.findOne({
        boardId: boardId,
        userId: req.user.id,
      });

      if (board.userId !== req.user.id && !isMember) {
        return res.forbidden({
          message: "Bạn không có quyền xem thành viên của board này",
        });
      }

      // Lấy danh sách thành viên được mời
      const members = await BoardMember.find({ boardId });
      const userIds = members.map((m) => m.userId);
      const users = await User.find({ id: userIds });

      const memberList = members.map((member) => {
        const user = users.find((u) => u.id === member.userId);
        return {
          id: member.userId,
          name: user?.name || "Unknown",
          email: user?.email || "",
          role: member.role,
          invitedAt: member.invitedAt,
        };
      });

      // Thêm owner vào danh sách
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

      return res.ok(memberList);
    } catch (err) {
      console.error("Get members error:", err);
      return res.serverError({ message: "Lỗi server" });
    }
  },

  // Xóa thành viên khỏi board
  removeMember: async (req, res) => {
    try {
      const { boardId, userId } = req.params;

      const board = await Board.findOne({ id: boardId });
      if (!board) {
        return res.notFound({ message: "Board không tồn tại" });
      }

      // Chỉ owner mới được xóa thành viên
      if (board.userId !== req.user.id) {
        return res.forbidden({
          message: "Chỉ chủ board mới có thể xóa thành viên",
        });
      }

      // Không thể xóa chính mình
      if (userId === req.user.id) {
        return res.badRequest({
          message: "Không thể xóa chính mình khỏi board",
        });
      }

      await BoardMember.destroyOne({ boardId, userId });

      return res.ok({ message: "Đã xóa thành viên khỏi board" });
    } catch (err) {
      console.error("Remove member error:", err);
      return res.serverError({ message: "Lỗi server" });
    }
  },
  // Lấy danh sách thành viên có thể gán task (không bao gồm owner)
  getAssignableMembers: async (req, res) => {
    try {
      const { boardId } = req.params;

      const board = await Board.findOne({ id: boardId });
      if (!board) {
        return res.notFound({ message: "Board không tồn tại" });
      }

      // Kiểm tra quyền
      const isOwner = board.userId === req.user.id;
      const isMember = await BoardMember.findOne({
        boardId: boardId,
        userId: req.user.id,
      });

      if (!isOwner && !isMember) {
        return res.forbidden({
          message: "Bạn không có quyền xem thành viên của board này",
        });
      }

      // Lấy danh sách member
      const members = await BoardMember.find({ boardId });
      const memberIds = members.map((m) => m.userId);
      const memberUsers = await User.find({ id: memberIds });

      const memberList = memberUsers.map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
      }));

      // Thêm owner vào danh sách
      const owner = await User.findOne({ id: board.userId });
      if (owner) {
        memberList.unshift({
          id: owner.id,
          name: owner.name,
          email: owner.email,
        });
      }

      return res.ok(memberList);
    } catch (err) {
      console.error("Get assignable members error:", err);
      return res.serverError({ message: "Lỗi server" });
    }
  },
};
