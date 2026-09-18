// scripts/test-email.js
// Chạy: node scripts/test-email.js

require("dotenv").config();
const EmailService = require("../api/services/EmailService");

async function main() {
  console.log("🧪 Test gửi email...\n");

  // Test connection
  const connected = await EmailService.verifyConnection();
  if (!connected) {
    console.error("❌ Không kết nối được SMTP. Kiểm tra .env");
    process.exit(1);
  }

  // Test send
  const result = await EmailService.sendReminderEmail({
    to: "your-email@gmail.com", // ← Đổi thành email của bạn
    userName: "Thang Hoang",
    tasks: [
      {
        title: "Hoàn thành báo cáo tốt nghiệp",
        dueDate: new Date().toISOString(),
        daysLeft: 0,
      },
      {
        title: "Review code TaskFlow",
        dueDate: new Date(Date.now() + 86400000).toISOString(),
        daysLeft: 1,
      },
      {
        title: "Chuẩn bị slide thuyết trình",
        dueDate: new Date(Date.now() + 2 * 86400000).toISOString(),
        daysLeft: 2,
      },
    ],
  });

  console.log("\n📊 Kết quả:", result);

  if (result.success) {
    console.log("\n✅ Kiểm tra inbox email của bạn!");
  } else {
    console.error("\n❌ Gửi thất bại:", result.error);
  }
}

main();