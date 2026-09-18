// config/cron.js
const cron = require("node-cron");
const ReminderService = require("../api/services/ReminderService");

module.exports.cron = {
  // ✅ 8h sáng mỗi ngày
  dailyReminder: {
    schedule: "0 8 * * *", // 8:00 AM
    onTick: async () => {
      console.log("\n🕐 [CRON] Daily reminder (8:00 AM)...");
      await ReminderService.sendDailyReminders();
    },
    start: true,
  },

  // ✅ 8h tối mỗi ngày
  eveningReminder: {
    schedule: "0 20 * * *", // 8:00 PM
    onTick: async () => {
      console.log("\n🕐 [CRON] Evening reminder (8:00 PM)...");
      await ReminderService.sendDailyReminders();
    },
    start: true,
  },
};