// config/bootstrap.js
require("dotenv").config();
const cron = require("node-cron");

module.exports.bootstrap = async function (cb) {
  console.log("\n" + "═".repeat(60));
  console.log("🚀 TaskFlow Backend Bootstrapping");
  console.log("═".repeat(60));

  // ============================================================
  // 1. CHECK ENV
  // ============================================================
  if (!process.env.JWT_SECRET) {
    console.error("❌ FATAL: JWT_SECRET not found");
    return cb(new Error("JWT_SECRET is required."));
  }
  console.log("✅ JWT_SECRET configured");

  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    console.log("✅ EMAIL_USER:", process.env.EMAIL_USER);
  }

  // ============================================================
  // 2. VERIFY EMAIL
  // ============================================================
  try {
    const EmailService = require("../api/services/EmailService");
    await EmailService.verifyConnection();
    console.log("✅ [EmailService] Ready");
  } catch (err) {
    console.warn("⚠️  [EmailService] Failed:", err.message);
  }

  // ============================================================
  // 3. ✅ SETUP SOCKET HANDLER — ĐƠN GIẢN
  // ============================================================
  try {
    const jwt = require("jsonwebtoken");
    const io =
      sails.io ||
      (sails.hooks && sails.hooks.sockets && sails.hooks.sockets.io);

    console.log("\n🔍 [Bootstrap] sails.io:", !!io);

    if (!io || typeof io.on !== "function") {
      console.warn("⚠️  sails.io không tồn tại");
      console.warn("   💡 Cài: npm install sails-hook-sockets");
    } else {
      console.log("✅ [Bootstrap] Registering socket handler...");

      // ✅ QUAN TRỌNG: Middleware verify + join room
      io.use((socket, next) => {
        console.log(`🔍 [Socket.io.use] MIDDLEWARE — socketId: ${socket.id}`);

        const token =
          socket.handshake?.query?.token ||
          socket.handshake?.auth?.token ||
          null;

        const boardId =
          socket.handshake?.query?.boardId ||
          socket.handshake?.auth?.boardId ||
          null;

        console.log(`   token: ${token ? "✅" : "❌"}`);
        console.log(`   boardId: ${boardId || "❌"}`);

        if (!token) {
          console.warn(`   ⚠️  Missing token — allowing anyway`);
          socket.userId = null;
          return next();
        }

        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          socket.userId = decoded.id;
          console.log(`   ✅ Token valid — user=${decoded.id}`);
          return next();
        } catch (err) {
          console.warn(`   ⚠️  Invalid token: ${err.message}`);
          socket.userId = null;
          return next();
        }
      });

      // ✅ Connection handler
      io.on("connection", (socket) => {
        const token = socket.handshake?.query?.token;
        const boardId = socket.handshake?.query?.boardId;
        const userId = socket.userId;

        console.log(`🔥 [Socket] CONNECTION RECEIVED: ${socket.id}`);
        console.log(`   Handshake: token=${token ? "✅" : "❌"} boardId=${boardId || "❌"} user=${userId || "guest"}`);

        // ✅ JOIN ROOM — QUAN TRỌNG
        if (boardId) {
          sails.sockets.join(socket, `board:${boardId}`);
          console.log(`   ✅ Joined room: board:${boardId}`);
          socket.emit("joined", { boardId, userId });
        } else {
          console.warn(`   ⚠️  No boardId — not joining room`);
        }

        // ✅ Listen join:board (frontend emit)
        socket.on("join:board", (data, callback) => {
          const bid = data?.boardId || boardId;
          if (!bid) {
            callback?.({ success: false, error: "Missing boardId" });
            return;
          }
          sails.sockets.join(socket, `board:${bid}`);
          console.log(`   ✅ Socket ${socket.id} joined board:${bid} via event`);
          callback?.({ success: true, room: `board:${bid}` });
        });

        // ✅ Listen leave:board
        socket.on("leave:board", (data) => {
          const bid = data?.boardId;
          if (bid) {
            sails.sockets.leave(socket, `board:${bid}`);
            console.log(`   🔌 Socket ${socket.id} left board:${bid}`);
          }
        });

        // ✅ Disconnect
        socket.on("disconnect", (reason) => {
          console.log(`🔌 [Socket] Disconnected: ${socket.id} (${reason})`);
        });
      });

      console.log("✅ [Bootstrap] Socket handler registered");
    }
  } catch (err) {
    console.error("❌ Socket setup error:", err.message);
  }

  // ============================================================
  // 4. CRON JOBS
  // ============================================================
  try {
    if (sails.config.cronJobs) {
      sails.config.cronJobs.forEach((job) => {
        try {
          job.stop();
        } catch {}
      });
    }
    sails.config.cronJobs = [];

    const ReminderService = require("../api/services/ReminderService");

    console.log("\n⏰ Setup cron jobs:");

    const dailyJob = cron.schedule(
      "0 8 * * *",
      async () => {
        console.log("\n🕐 [CRON] Daily reminder...");
        try {
          const result = await ReminderService.sendDailyReminders();
          console.log("✅ [CRON] Done:", result);
        } catch (err) {
          console.error("❌ [CRON] Error:", err);
        }
      },
      { scheduled: true, timezone: "Asia/Ho_Chi_Minh" }
    );

    const eveningJob = cron.schedule(
      "0 20 * * *",
      async () => {
        console.log("\n🕐 [CRON] Evening reminder...");
        try {
          const result = await ReminderService.sendDailyReminders();
          console.log("✅ [CRON] Done:", result);
        } catch (err) {
          console.error("❌ [CRON] Error:", err);
        }
      },
      { scheduled: true, timezone: "Asia/Ho_Chi_Minh" }
    );

    sails.config.cronJobs.push(dailyJob, eveningJob);
    console.log("   ✅ dailyReminder: 0 8 * * *");
    console.log("   ✅ eveningReminder: 0 20 * * *");
  } catch (err) {
    console.error("❌ Cron error:", err.message);
  }

  console.log("\n" + "═".repeat(60) + "\n");
  return cb();
};