// scripts/seed-indexes.js
// Chạy: node scripts/seed-indexes.js

const { MongoClient } = require("mongodb");

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017";
const DB_NAME = "task_manager";

async function main() {
  const client = new MongoClient(MONGODB_URI);

  try {
    console.log("🔌 Đang kết nối MongoDB...");
    await client.connect();
    console.log("✅ Đã kết nối:", MONGODB_URI);
    console.log("📀 Database:", DB_NAME);

    const db = client.db(DB_NAME);

    // ============================================================
    // 1. TASK COLLECTION
    // ============================================================
    console.log("\n📋 Tạo index cho collection TASK...");
    const tasks = db.collection("task");

    const taskIndexes = [
      // Index 1: Load board tasks (QUAN TRỌNG NHẤT)
      {
        key: { boardId: 1, isDeleted: 1 },
        name: "board_active_tasks",
      },
      // Index 2: Filter archive
      {
        key: { boardId: 1, isDeleted: 1, isArchived: 1 },
        name: "board_active_archived",
      },
      // Index 3: Kanban column sort
      {
        key: { boardId: 1, status: 1, order: 1 },
        name: "board_status_order",
      },
      // Index 4: Filter by priority
      {
        key: { boardId: 1, status: 1, priority: 1 },
        name: "board_status_priority",
      },
      // Index 5: Assigned tasks — "Task được giao cho tôi"
      {
        key: { assignedTo: 1, isDeleted: 1, updatedAt: -1 },
        name: "assigned_tasks",
      },
      // Index 6: User's own tasks
      {
        key: { userId: 1, isDeleted: 1, createdAt: -1 },
        name: "user_tasks",
      },
      // Index 7: Sort by updatedAt
      {
        key: { boardId: 1, updatedAt: -1 },
        name: "board_updated",
      },
      // Index 8: Trash list
      {
        key: { boardId: 1, isDeleted: 1, deletedAt: -1 },
        name: "board_trash",
      },
      // Index 9: Archive list
      {
        key: { boardId: 1, isArchived: 1, archivedAt: -1 },
        name: "board_archive",
      },
      // Index 10: Deadline warning (partial index)
      {
        key: { status: 1, dueDate: 1 },
        name: "deadline_warning",
        options: {
          partialFilterExpression: {
            isDeleted: false,
            isArchived: false,
            dueDate: { $type: "date" },
          },
        },
      },
      // Index 11: Text search
      {
        key: { title: "text", description: "text" },
        name: "task_text_search",
        options: {
          weights: { title: 10, description: 1 },
        },
      },
    ];

    for (const idx of taskIndexes) {
      try {
        await tasks.createIndex(idx.key, {
          name: idx.name,
          background: true,
          ...idx.options,
        });
        console.log(`   ✅ ${idx.name}`);
      } catch (err) {
        if (err.code === 85 || err.codeName === "IndexOptionsConflict") {
          console.log(`   ⚠️  ${idx.name} — đã tồn tại`);
        } else {
          console.log(`   ❌ ${idx.name} — ${err.message}`);
        }
      }
    }

    // ============================================================
    // 2. BOARD COLLECTION
    // ============================================================
    console.log("\n📊 Tạo index cho collection BOARD...");
    const boards = db.collection("board");

    try {
      await boards.createIndex(
        { userId: 1, updatedAt: -1 },
        { name: "user_boards", background: true },
      );
      console.log("   ✅ user_boards");
    } catch (err) {
      if (err.code === 85) console.log("   ⚠️  user_boards — đã tồn tại");
      else console.log("   ❌ user_boards —", err.message);
    }

    // ============================================================
    // 3. USER COLLECTION
    // ============================================================
    console.log("\n👤 Tạo index cho collection USER...");
    const users = db.collection("user");

    // Index 1: Email unique
    try {
      await users.createIndex(
        { email: 1 },
        { name: "user_email", unique: true, background: true },
      );
      console.log("   ✅ user_email (unique)");
    } catch (err) {
      if (err.code === 85) console.log("   ⚠️  user_email — đã tồn tại");
      else if (err.code === 11000)
        console.log("   ⚠️  user_email — có duplicate email, chưa tạo unique");
      else console.log("   ❌ user_email —", err.message);
    }

    // Index 2: Text search
    try {
      await users.createIndex(
        { name: "text", email: "text" },
        { name: "user_search", background: true },
      );
      console.log("   ✅ user_search");
    } catch (err) {
      if (err.code === 85) console.log("   ⚠️  user_search — đã tồn tại");
      else console.log("   ❌ user_search —", err.message);
    }

    // ============================================================
    // 4. BOARDMEMBER COLLECTION
    // ============================================================
    console.log("\n👥 Tạo index cho collection BOARDMEMBER...");
    const boardMembers = db.collection("boardmember");

    // ✅ Kiểm tra duplicate trước khi tạo unique index
    console.log("   🔍 Kiểm tra duplicate...");
    const duplicates = await boardMembers
      .aggregate([
        {
          $group: {
            _id: { boardId: "$boardId", userId: "$userId" },
            count: { $sum: 1 },
          },
        },
        { $match: { count: { $gt: 1 } } },
      ])
      .toArray();

    if (duplicates.length > 0) {
      console.log(`   ⚠️  Có ${duplicates.length} duplicate records!`);
      console.log("   ⚠️  Bỏ qua unique index, chỉ tạo index thường");
    }

    // Index 1: Unique (nếu không duplicate)
    if (duplicates.length === 0) {
      try {
        await boardMembers.createIndex(
          { boardId: 1, userId: 1 },
          { name: "board_member_unique", unique: true, background: true },
        );
        console.log("   ✅ board_member_unique (unique)");
      } catch (err) {
        if (err.code === 85)
          console.log("   ⚠️  board_member_unique — đã tồn tại");
        else console.log("   ❌ board_member_unique —", err.message);
      }
    } else {
      // Tạo index thường
      try {
        await boardMembers.createIndex(
          { boardId: 1, userId: 1 },
          { name: "board_member_idx", background: true },
        );
        console.log("   ✅ board_member_idx (không unique)");
      } catch (err) {
        if (err.code === 85)
          console.log("   ⚠️  board_member_idx — đã tồn tại");
        else console.log("   ❌ board_member_idx —", err.message);
      }
    }

    // Index 2: Board members list
    try {
      await boardMembers.createIndex(
        { boardId: 1, role: 1 },
        { name: "board_members", background: true },
      );
      console.log("   ✅ board_members");
    } catch (err) {
      if (err.code === 85) console.log("   ⚠️  board_members — đã tồn tại");
      else console.log("   ❌ board_members —", err.message);
    }

    // Index 3: User's boards
    try {
      await boardMembers.createIndex(
        { userId: 1 },
        { name: "user_boards_member", background: true },
      );
      console.log("   ✅ user_boards_member");
    } catch (err) {
      if (err.code === 85)
        console.log("   ⚠️  user_boards_member — đã tồn tại");
      else console.log("   ❌ user_boards_member —", err.message);
    }

    // ============================================================
    // SUMMARY
    // ============================================================
    console.log("\n" + "=".repeat(50));
    console.log("📊 TỔNG KẾT:");
    console.log("=".repeat(50));

    for (const name of ["task", "board", "user", "boardmember"]) {
      const indexes = await db.collection(name).indexes();
      console.log(`\n📁 ${name.toUpperCase()}: ${indexes.length} indexes`);
      indexes.forEach((idx) => {
        const keys = Object.keys(idx.key).join(", ");
        console.log(`   • ${idx.name} (${keys})`);
      });
    }

    console.log("\n" + "=".repeat(50));
    console.log("✅ HOÀN TẤT!");
    console.log("=".repeat(50));
  } catch (error) {
    console.error("\n❌ Lỗi:", error.message);
    console.error(error);
  } finally {
    await client.close();
    console.log("\n🔌 Đã ngắt kết nối MongoDB");
  }
}

main();
