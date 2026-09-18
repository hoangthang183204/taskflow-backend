module.exports = {
  canAccessBoard: async (userId, boardId) => {
    const board = await Board.findOne({ id: boardId });
    if (!board) return { allowed: false, reason: "BOARD_NOT_FOUND" };
    if (String(board.userId) === String(userId)) {
      return { allowed: true, role: "owner", board };
    }
    const member = await BoardMember.findOne({ boardId, userId });
    if (member) return { allowed: true, role: member.role, board };
    return { allowed: false, reason: "FORBIDDEN", board };
  },

  canManageBoard: async (userId, boardId) => {
    const { allowed, role, board } = await module.exports.canAccessBoard(userId, boardId);
    if (!allowed) return { allowed: false, reason };
    return { allowed: role === "owner" || role === "admin", role, board };
  },
};