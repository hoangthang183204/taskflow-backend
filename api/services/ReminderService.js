// api/services/ReminderService.js
const EmailService = require("./EmailService");

module.exports = {
  /**
   * Tìm tasks sắp đến hạn và gửi email nhắc nhở
   */
  sendDailyReminders: async () => {
    try {
      console.log("\n🔔 [ReminderService] Bắt đầu...");

      const now = new Date();
      now.setHours(0, 0, 0, 0);

      // ✅ Tìm tasks active có dueDate
      const tasks = await Task.find({
        isDeleted: false,
        isArchived: false,
        dueDate: { "!=": null },
      });

      console.log(`   📋 Tìm thấy ${tasks.length} task có dueDate`);

      // ✅ Filter tasks sắp đến hạn (≤ 3 ngày) và chưa done
      const dueSoonTasks = tasks.filter((t) => {
        if (!t.dueDate) return false;
        if (t.status === "done") return false;

        const due = new Date(t.dueDate);
        due.setHours(0, 0, 0, 0);
        const daysLeft = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
        return daysLeft <= 3;
      });

      console.log(`   ⏰ Có ${dueSoonTasks.length} task sắp đến hạn`);

      if (dueSoonTasks.length === 0) {
        console.log("   ✅ Không có task nào cần nhắc");
        return { sent: 0, total: 0 };
      }

      // ✅ Group theo user
      const tasksByUser = {};
      for (const task of dueSoonTasks) {
        const userId = task.assignedTo || task.userId;
        if (!userId) continue;

        const due = new Date(task.dueDate);
        due.setHours(0, 0, 0, 0);
        const daysLeft = Math.ceil((due - now) / (1000 * 60 * 60 * 24));

        if (!tasksByUser[userId]) tasksByUser[userId] = [];

        tasksByUser[userId].push({
          title: task.title,
          dueDate: task.dueDate,
          daysLeft,
          status: task.status,
          priority: task.priority,
        });
      }

      // ✅ Gửi email cho mỗi user
      let sentCount = 0;
      const userIds = Object.keys(tasksByUser);

      console.log(`   👥 Có ${userIds.length} user cần nhắc`);

      for (const userId of userIds) {
        const userTasks = tasksByUser[userId];

        // Lấy user
        const user = await User.findOne({ id: userId, isDeleted: false });
        if (!user || !user.email) continue;

        // Sort theo daysLeft
        userTasks.sort((a, b) => a.daysLeft - b.daysLeft);

        // Chỉ gửi nếu có task urgent (≤ 2 ngày)
        const hasUrgent = userTasks.some((t) => t.daysLeft <= 2);
        if (!hasUrgent) {
          console.log(`   ⏭️  Skip ${user.email} (không có task urgent)`);
          continue;
        }

        console.log(
          `   📧 Sending to ${user.email} (${userTasks.length} tasks)`
        );

        const result = await EmailService.sendReminderEmail({
          to: user.email,
          userName: user.name,
          tasks: userTasks,
        });

        if (result.success) sentCount++;

        // Delay 1s tránh rate limit Gmail
        await new Promise((r) => setTimeout(r, 1000));
      }

      console.log(
        `✅ [ReminderService] Đã gửi ${sentCount}/${userIds.length} email\n`
      );

      return { sent: sentCount, total: userIds.length };
    } catch (err) {
      console.error("❌ [ReminderService] Error:", err);
      return { sent: 0, error: err.message };
    }
  },
};