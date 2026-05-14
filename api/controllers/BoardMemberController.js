/**
 * BoardMemberController.js
 * Controller quản lý thành viên board
 */
module.exports = {
  addMember: async (req, res) => {
    try {
      const { boardId } = req.params;
      const { email, role } = req.body;

      // 1. Kiểm tra board tồn tại
      const board = await Board.findOne({ id: boardId });
      if (!board) {
        return res.status(404).json({
          success: false,
          message: "Board không tồn tại",
        });
      }

      // 2. Kiểm tra quyền: CHỈ OWNER mới được mời thành viên
      const isOwner = String(board.userId) === String(req.user.id);
      if (!isOwner) {
        console.error(`❌ Quyền bị từ chối: board.userId=${board.userId}, req.user.id=${req.user.id}`);
        return res.status(403).json({
          success: false,
          message: "Chỉ chủ board mới có quyền mời thành viên",
        });
      }

      // 3. Tìm user qua email
      const userToAdd = await User.findOne({ email: email });
      if (!userToAdd) {
        return res.status(404).json({
          success: false,
          message: `Không tìm thấy user với email: ${email}`,
        });
      }

      const userId = userToAdd.id;

      // 4. Kiểm tra user đã là member chưa
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

      // 5. Thêm member
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

      // Kiểm tra board tồn tại
      const board = await Board.findOne({ id: boardId });
      if (!board) {
        return res.status(404).json({
          success: false,
          message: "Board không tồn tại",
        });
      }

      // ✅ Owner và member đều có quyền xem danh sách thành viên
      const isOwner = String(board.userId) === String(req.user.id);
      const isMember = await BoardMember.findOne({
        boardId: boardId,
        userId: req.user.id,
      });

      if (!isOwner && !isMember) {
        return res.status(403).json({
          success: false,
          message: "Bạn không có quyền xem thành viên của board này",
        });
      }

      // Lấy danh sách thành viên được mời
      const members = await BoardMember.find({ boardId });
      const userIds = members.map((m) => m.userId);
      const users = await User.find({ id: userIds });

      const memberList = members.map((member) => {
        const user = users.find((u) => String(u.id) === String(member.userId));
        return {
          id: member.userId,
          name: user?.name || "Unknown",
          email: user?.email || "",
          role: member.role,
          invitedAt: member.invitedAt,
        };
      });

      // Thêm owner vào danh sách (owner không cần trong boardmember)
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

      return res.status(200).json({
        success: true,
        data: memberList,
      });
    } catch (err) {
      console.error("Get members error:", err);
      return res.status(500).json({
        success: false,
        message: "Lỗi server",
      });
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

      // ✅ CHỈ OWNER mới được xóa thành viên
      const isOwner = String(board.userId) === String(req.user.id);
      if (!isOwner) {
        return res.status(403).json({
          success: false,
          message: "Chỉ chủ board mới có thể xóa thành viên",
        });
      }

      // Không thể xóa chính mình
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

      const board = await Board.findOne({ id: boardId });
      if (!board) {
        return res.status(404).json({
          success: false,
          message: "Board không tồn tại",
        });
      }

      // ✅ Owner được xem tất cả thành viên (không cần kiểm tra admin)
      const isOwner = String(board.userId) === String(req.user.id);
      
      if (!isOwner) {
        // Nếu không phải owner, kiểm tra xem có phải member không
        const isMember = await BoardMember.findOne({
          boardId: boardId,
          userId: req.user.id,
        });
        
        if (!isMember) {
          return res.status(403).json({
            success: false,
            message: "Bạn không có quyền xem danh sách thành viên",
          });
        }
        
        // Member có thể xem nhưng chỉ owner mới có thể gán task? 
        // Tùy logic: có thể cho phép member gán task cho người khác không?
        // Ở đây tôi giữ nguyên: member cũng có thể xem danh sách
      }

      // Lấy danh sách member (không bao gồm owner)
      const members = await BoardMember.find({ boardId });
      const memberIds = members.map((m) => m.userId);
      const memberUsers = await User.find({ id: memberIds });

      const memberList = memberUsers.map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
      }));

      // Thêm owner vào đầu danh sách
      const owner = await User.findOne({ id: board.userId });
      if (owner) {
        memberList.unshift({
          id: owner.id,
          name: owner.name,
          email: owner.email,
        });
      }

      // Lọc bỏ trùng lặp (nếu owner vô tình có trong memberList)
      const uniqueMemberList = memberList.filter(
        (member, index, self) => index === self.findIndex(m => String(m.id) === String(member.id))
      );

      return res.status(200).json({
        success: true,
        data: uniqueMemberList,
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