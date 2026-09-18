// scripts/test-rate-limit.js
/**
 * Test rate limit cho TaskFlow API
 * Chạy: node scripts/test-rate-limit.js
 */

const BASE_URL = process.env.API_URL || "http://localhost:1337";

// ============================================================
// HELPERS
// ============================================================
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const colors = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
  gray: "\x1b[90m",
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  heading: (msg) =>
    console.log(
      `\n${colors.cyan}${"═".repeat(60)}\n${msg}\n${"═".repeat(60)}${colors.reset}`
    ),
};

// ============================================================
// TEST 1: LOGIN BRUTE FORCE
// ============================================================
async function testLoginRateLimit() {
  log.heading("🔴 TEST 1: Login Brute Force");
  log.info("Gọi login 7 lần sai → mong đợi block ở lần 6");

  let blockedAt = null;
  const testEmail = `brute-${Date.now()}@test.com`;

  for (let i = 1; i <= 7; i++) {
    try {
      const res = await fetch(`${BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: testEmail,
          password: "wrongpassword",
        }),
      });

      const data = await res.json().catch(() => ({}));

      const statusColor =
        res.status === 429
          ? colors.red
          : res.status === 200
          ? colors.green
          : colors.yellow;

      console.log(
        `   Lần ${i}: ${statusColor}${res.status}${colors.reset} ${
          res.status === 429 ? `(Blocked - retry ${data.retryAfter}s)` : ""
        }`
      );

      if (res.status === 429) {
        blockedAt = i;
        log.success(`Rate limit hoạt động! Blocked ở lần thứ ${i}`);
        log.info(`Retry after: ${data.retryAfter} giây`);
        break;
      }

      await sleep(100);
    } catch (err) {
      log.error(`Lần ${i}: ${err.message}`);
    }
  }

  if (!blockedAt) {
    log.warning("Rate limit CHƯA hoạt động cho login");
  }

  return blockedAt;
}

// ============================================================
// TEST 2: REGISTER SPAM
// ============================================================
async function testRegisterRateLimit() {
  log.heading("🔴 TEST 2: Register Spam");
  log.info("Gọi register 5 lần → mong đợi block ở lần 4 (3/giờ)");

  let blockedAt = null;
  const timestamp = Date.now();

  for (let i = 1; i <= 5; i++) {
    try {
      const res = await fetch(`${BASE_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `Test User ${i}`,
          email: `test-${timestamp}-${i}@test.com`,
          password: "Password123!",
        }),
      });

      const data = await res.json().catch(() => ({}));

      const statusColor =
        res.status === 429
          ? colors.red
          : res.status < 400
          ? colors.green
          : colors.yellow;

      console.log(
        `   Lần ${i}: ${statusColor}${res.status}${colors.reset} ${
          res.status === 429
            ? `(Blocked - retry ${data.retryAfter}s)`
            : data.message || ""
        }`
      );

      if (res.status === 429) {
        blockedAt = i;
        log.success(`Rate limit hoạt động! Blocked ở lần thứ ${i}`);
        break;
      }

      await sleep(150);
    } catch (err) {
      log.error(`Lần ${i}: ${err.message}`);
    }
  }

  if (!blockedAt) {
    log.warning("Rate limit CHƯA hoạt động cho register");
  }

  return blockedAt;
}

// ============================================================
// TEST 3: HEADERS CHECK
// ============================================================
async function testRateLimitHeaders() {
  log.heading("📊 TEST 3: Rate Limit Headers");
  log.info("Kiểm tra response headers có đúng IETF standard không");

  try {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: `header-${Date.now()}@test.com`,
        password: "wrong",
      }),
    });

    const headers = {
      "RateLimit-Limit": res.headers.get("RateLimit-Limit"),
      "RateLimit-Remaining": res.headers.get("RateLimit-Remaining"),
      "RateLimit-Reset": res.headers.get("RateLimit-Reset"),
      "Retry-After": res.headers.get("Retry-After"),
    };

    console.log("   Response headers:");
    Object.entries(headers).forEach(([key, val]) => {
      const color = val ? colors.green : colors.gray;
      console.log(`   ${color}${key}: ${val || "(not set)"}${colors.reset}`);
    });

    if (headers["RateLimit-Limit"]) {
      log.success("Headers chuẩn IETF đã được set");
    } else {
      log.warning("Headers chưa được set — kiểm tra config rateLimits.js");
    }

    return headers;
  } catch (err) {
    log.error(`Không gọi được API: ${err.message}`);
    return null;
  }
}

// ============================================================
// MAIN
// ============================================================
async function main() {
  console.clear();
  console.log(`
${colors.cyan}╔══════════════════════════════════════════════════════════╗
║   🧪 TaskFlow Rate Limit Test Suite                     ║
║   Testing: ${BASE_URL.padEnd(46)} ║
╚══════════════════════════════════════════════════════════╝${colors.reset}
  `);

  // Kiểm tra API có chạy không
  try {
    await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    log.success("API server đang chạy");
  } catch (err) {
    log.error(`Không kết nối được API: ${BASE_URL}`);
    log.info("Chạy backend trước: npm run dev");
    process.exit(1);
  }

  // Chạy tests
  const results = {
    login: await testLoginRateLimit(),
    register: await testRegisterRateLimit(),
    headers: await testRateLimitHeaders(),
  };

  // Tổng kết
  log.heading("📋 TỔNG KẾT");

  const loginOk = results.login ? `${colors.green}✅${colors.reset}` : `${colors.red}❌${colors.reset}`;
  const registerOk = results.register ? `${colors.green}✅${colors.reset}` : `${colors.red}❌${colors.reset}`;
  const headersOk = results.headers?.["RateLimit-Limit"] ? `${colors.green}✅${colors.reset}` : `${colors.red}❌${colors.reset}`;

  console.log(`
   ${loginOk} Login rate limit      ${
    results.login ? `(blocked lần ${results.login})` : "(CHƯA hoạt động)"
  }
   ${registerOk} Register rate limit   ${
    results.register ? `(blocked lần ${results.register})` : "(CHƯA hoạt động)"
  }
   ${headersOk} Response headers      ${
    results.headers?.["RateLimit-Limit"] ? "(đã set)" : "(CHƯA set)"
  }
  `);

  const allGood = results.login && results.register && results.headers?.["RateLimit-Limit"];

  if (allGood) {
    console.log(`\n${colors.green}🎉 TẤT CẢ TEST ĐỀU PASS!${colors.reset}\n`);
  } else {
    console.log(
      `\n${colors.yellow}⚠️  MỘT SỐ TEST CHƯA PASS — Kiểm tra config${colors.reset}\n`
    );
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});