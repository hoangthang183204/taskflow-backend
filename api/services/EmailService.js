// api/services/EmailService.js
const nodemailer = require("nodemailer");

// ============================================================
// TRANSPORTER
// ============================================================
let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || "smtp.gmail.com",
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  return transporter;
}

// ============================================================
// HELPERS
// ============================================================
function getPriorityBadge(priority) {
  const badges = {
    low: {
      bg: "#ecfdf5",
      text: "#059669",
      border: "#a7f3d0",
      label: "Thấp",
      dot: "#10b981",
    },
    medium: {
      bg: "#fffbeb",
      text: "#d97706",
      border: "#fde68a",
      label: "Trung",
      dot: "#f59e0b",
    },
    high: {
      bg: "#fef2f2",
      text: "#dc2626",
      border: "#fecaca",
      label: "Cao",
      dot: "#ef4444",
    },
  };
  return badges[priority] || badges.medium;
}

function getDueDateInfo(daysLeft) {
  if (daysLeft < 0) {
    return {
      color: "#dc2626",
      bg: "#fef2f2",
      label: `Quá hạn ${Math.abs(daysLeft)} ngày`,
      icon: "⚠️",
    };
  }
  if (daysLeft === 0) {
    return {
      color: "#ea580c",
      bg: "#fff7ed",
      label: "Hôm nay",
      icon: "⚠️",
    };
  }
  if (daysLeft === 1) {
    return {
      color: "#d97706",
      bg: "#fffbeb",
      label: "Còn 1 ngày",
      icon: "⚠️",
    };
  }
  return {
    color: "#2563eb",
    bg: "#eff6ff",
    label: `Còn ${daysLeft} ngày`,
    icon: "📅",
  };
}

function formatDate(dateStr) {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
    });
  } catch {
    return dateStr;
  }
}

// ============================================================
// EMAIL TEMPLATE — Đồng bộ với Web App
// ============================================================
function buildReminderEmail(userName, tasks) {
  const sortedTasks = [...tasks].sort((a, b) => a.daysLeft - b.daysLeft);

  const urgentTasks = sortedTasks.filter((t) => t.daysLeft <= 1);
  const soonTasks = sortedTasks.filter((t) => t.daysLeft >= 2);

  const totalUrgent = urgentTasks.length;

  // Task card — giống hệt TaskCardContent trên web
  const renderTask = (task) => {
    const dueInfo = getDueDateInfo(task.daysLeft);
    const priorityInfo = getPriorityBadge(task.priority);

    return `
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 8px;">
        <tr>
          <td style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px; box-shadow: 0 1px 2px rgba(0,0,0,0.04);">
            <!-- Task title -->
            <div style="font-size: 13px; font-weight: 600; color: #111827; margin: 0 0 8px 0; line-height: 1.4; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
              ${task.title}
            </div>

            <!-- Badges row -->
            <table cellpadding="0" cellspacing="0" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
              <tr>
                <!-- Priority badge -->
                <td style="padding-right: 6px;">
                  <span style="display: inline-block; padding: 2px 6px; background: ${priorityInfo.bg}; color: ${priorityInfo.text}; border: 1px solid ${priorityInfo.border}; border-radius: 4px; font-size: 10px; font-weight: 600; line-height: 1.4;">
                    <span style="display: inline-block; width: 6px; height: 6px; background: ${priorityInfo.dot}; border-radius: 50%; vertical-align: middle; margin-right: 3px;"></span>${priorityInfo.label}
                  </span>
                </td>

                <!-- Due badge -->
                <td style="padding-right: 6px;">
                  <span style="display: inline-block; padding: 2px 6px; background: ${dueInfo.bg}; color: ${dueInfo.color}; border-radius: 4px; font-size: 10px; font-weight: 600; line-height: 1.4;">
                    ${dueInfo.icon} ${dueInfo.label}
                  </span>
                </td>

                <!-- Date -->
                <td>
                  <span style="color: #6b7280; font-size: 10px; font-weight: 500;">
                    📅 ${formatDate(task.dueDate)}
                  </span>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    `;
  };

  return `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nhắc nhở task - TaskFlow</title>
</head>
<body style="margin: 0; padding: 0; background-color: #fafbfc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">

  <!-- Outer -->
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fafbfc; padding: 40px 16px;">
    <tr>
      <td align="center">

        <!-- Main container -->
        <table width="560" cellpadding="0" cellspacing="0" style="max-width: 560px; width: 100%; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.04);">

          <!-- ============================================ -->
          <!-- HEADER — Giống web header -->
          <!-- ============================================ -->
          <tr>
            <td style="padding: 20px 24px; border-bottom: 1px solid #f3f4f6; background: #ffffff;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <!-- Logo -->
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="vertical-align: middle; padding-right: 8px;">
                          <div style="width: 32px; height: 32px; background: #111827; border-radius: 8px; text-align: center; line-height: 32px;">
                            <span style="font-size: 16px;">⏰</span>
                          </div>
                        </td>
                        <td style="vertical-align: middle;">
                          <span style="font-size: 16px; font-weight: 700; color: #111827; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                            TaskFlow
                          </span>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td align="right">
                    <span style="display: inline-block; padding: 4px 10px; background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; border-radius: 6px; font-size: 11px; font-weight: 600;">
                      🔔 Nhắc nhở
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ============================================ -->
          <!-- GREETING -->
          <!-- ============================================ -->
          <tr>
            <td style="padding: 24px 24px 16px;">
              <h1 style="color: #111827; margin: 0 0 6px 0; font-size: 18px; font-weight: 700; letter-spacing: -0.2px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                Xin chào ${userName}! 👋
              </h1>
              <p style="color: #6b7280; margin: 0; font-size: 13px; line-height: 1.5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                ${
                  totalUrgent > 0
                    ? `Bạn có <strong style="color: #dc2626;">${totalUrgent} task</strong> cần xử lý ngay${
                        soonTasks.length > 0
                          ? ` và <strong style="color: #d97706;">${soonTasks.length} task</strong> sắp đến hạn`
                          : ""
                      }.`
                    : `Bạn có <strong style="color: #d97706;">${soonTasks.length} task</strong> sắp đến hạn.`
                }
              </p>
            </td>
          </tr>

          <!-- ============================================ -->
          <!-- URGENT SECTION -->
          <!-- ============================================ -->
          ${
            urgentTasks.length > 0
              ? `
          <tr>
            <td style="padding: 0 24px 16px;">
              <!-- Section label -->
              <table cellpadding="0" cellspacing="0" style="margin-bottom: 10px;">
                <tr>
                  <td style="vertical-align: middle; padding-right: 6px;">
                    <div style="width: 6px; height: 6px; background: #dc2626; border-radius: 50%;"></div>
                  </td>
                  <td style="vertical-align: middle;">
                    <span style="font-size: 11px; font-weight: 700; color: #dc2626; letter-spacing: 0.3px; text-transform: uppercase; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                      Cần xử lý ngay · ${urgentTasks.length}
                    </span>
                  </td>
                </tr>
              </table>

              ${urgentTasks.slice(0, 5).map(renderTask).join("")}

              ${
                urgentTasks.length > 5
                  ? `<p style="text-align: center; color: #9ca3af; font-size: 11px; margin: 4px 0 0 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                      và ${urgentTasks.length - 5} task khác...
                    </p>`
                  : ""
              }
            </td>
          </tr>
          `
              : ""
          }

          <!-- ============================================ -->
          <!-- SOON SECTION -->
          <!-- ============================================ -->
          ${
            soonTasks.length > 0
              ? `
          <tr>
            <td style="padding: 0 24px 16px;">
              <table cellpadding="0" cellspacing="0" style="margin-bottom: 10px;">
                <tr>
                  <td style="vertical-align: middle; padding-right: 6px;">
                    <div style="width: 6px; height: 6px; background: #d97706; border-radius: 50%;"></div>
                  </td>
                  <td style="vertical-align: middle;">
                    <span style="font-size: 11px; font-weight: 700; color: #d97706; letter-spacing: 0.3px; text-transform: uppercase; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                      Sắp đến hạn · ${soonTasks.length}
                    </span>
                  </td>
                </tr>
              </table>

              ${soonTasks.slice(0, 3).map(renderTask).join("")}

              ${
                soonTasks.length > 3
                  ? `<p style="text-align: center; color: #9ca3af; font-size: 11px; margin: 4px 0 0 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                      và ${soonTasks.length - 3} task khác...
                    </p>`
                  : ""
              }
            </td>
          </tr>
          `
              : ""
          }

          <!-- ============================================ -->
          <!-- CTA — Button đen giống web -->
          <!-- ============================================ -->
          <tr>
            <td style="padding: 8px 24px 24px;" align="center">
              <a href="${process.env.FRONTEND_URL || "http://localhost:3000"}/board"
                 style="display: inline-block; background: #111827; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-size: 13px; font-weight: 600; letter-spacing: 0.2px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                Mở TaskFlow →
              </a>
            </td>
          </tr>

          <!-- ============================================ -->
          <!-- TIP -->
          <!-- ============================================ -->
          <tr>
            <td style="padding: 0 24px 20px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background: #fafbfc; border-radius: 8px; padding: 12px;">
                <tr>
                  <td style="padding: 12px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                    <p style="color: #6b7280; font-size: 11px; line-height: 1.5; margin: 0;">
                      💡 <strong style="color: #111827;">Mẹo:</strong> Hoàn thành task đúng hạn để duy trì streak và tăng năng suất làm việc.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ============================================ -->
          <!-- FOOTER -->
          <!-- ============================================ -->
          <tr>
            <td style="background: #fafbfc; padding: 20px 24px; text-align: center; border-top: 1px solid #f3f4f6;">
              <p style="color: #111827; font-size: 12px; font-weight: 600; margin: 0 0 4px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                TaskFlow
              </p>
              <p style="color: #9ca3af; font-size: 10px; margin: 0 0 8px 0; line-height: 1.5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                Email nhắc nhở tự động · Không trả lời email này
              </p>
              <p style="color: #9ca3af; font-size: 10px; margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                © ${new Date().getFullYear()} TaskFlow. Bảo lưu mọi quyền.
              </p>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>
  `;
}

// ============================================================
// SERVICE
// ============================================================
module.exports = {
  sendReminderEmail: async ({ to, userName, tasks }) => {
    try {
      if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.warn("⚠️  [EmailService] EMAIL_USER/PASS chưa set");
        return { success: false, reason: "EMAIL_NOT_CONFIGURED" };
      }

      if (!tasks || tasks.length === 0) {
        return { success: false, reason: "NO_TASKS" };
      }

      const transporter = getTransporter();
      const html = buildReminderEmail(userName, tasks);

      const info = await transporter.sendMail({
        from: `"TaskFlow" <${process.env.EMAIL_USER}>`,
        to,
        subject: `⏰ Bạn có ${tasks.length} task cần xử lý - TaskFlow`,
        html,
      });

      console.log(`✅ [EmailService] Sent to ${to}:`, info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (err) {
      console.error("❌ [EmailService] Error:", err.message);
      return { success: false, error: err.message };
    }
  },

  verifyConnection: async () => {
    try {
      const transporter = getTransporter();
      await transporter.verify();
      console.log("✅ [EmailService] Connection ready");
      return true;
    } catch (err) {
      console.error("❌ [EmailService] Connection error:", err.message);
      return false;
    }
  },
};