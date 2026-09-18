// scripts/createIndexes.js
module.exports = {
  friendlyName: "Create indexes",
  description: "Tạo MongoDB indexes cho tối ưu query",

  fn: async function () {
    const db = Task.getDatastore().manager;
    const taskCollection = db.collection(Task.tableName);

    // Task indexes
    await taskCollection.createIndex({ userId: 1, isDeleted: 1, isArchived: 1 });
    await taskCollection.createIndex({ boardId: 1, isDeleted: 1 });
    await taskCollection.createIndex({ assignedTo: 1, isDeleted: 1 });
    await taskCollection.createIndex({ status: 1, priority: 1 });
    await taskCollection.createIndex({ dueDate: 1 });
    await taskCollection.createIndex({ createdAt: -1 });
    // Text search cho title + description
    await taskCollection.createIndex(
      { title: "text", description: "text" },
      { weights: { title: 10, description: 5 }, name: "task_text_search" }
    );
    // Compound cho query phổ biến
    await taskCollection.createIndex({
      userId: 1, isDeleted: 1, isArchived: 1, createdAt: -1,
    });

    const boardCollection = db.collection(Board.tableName);
    await boardCollection.createIndex({ userId: 1 });
    await boardCollection.createIndex({ createdAt: -1 });

    const boardMemberCollection = db.collection(BoardMember.tableName);
    await boardMemberCollection.createIndex({ boardId: 1, userId: 1 }, { unique: true });
    await boardMemberCollection.createIndex({ userId: 1 });
    await boardMemberCollection.createIndex({ boardId: 1, role: 1 });

    const userCollection = db.collection(User.tableName);
    await userCollection.createIndex({ email: 1 }, { unique: true });
    await userCollection.createIndex({ isDeleted: 1 });

    sails.log.info("✅ All indexes created");
  },
};