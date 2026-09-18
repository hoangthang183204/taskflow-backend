const Redis = require("ioredis");

let client = null;

const getClient = () => {
  if (!client) {
    client = new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    });
    client.on("error", (err) => sails.log.error("Redis error:", err.message));
  }
  return client;
};

module.exports = {
  get: async (key) => {
    try {
      const val = await getClient().get(key);
      return val ? JSON.parse(val) : null;
    } catch { return null; }
  },

  set: async (key, value, ttlSeconds = 300) => {
    try {
      await getClient().set(key, JSON.stringify(value), "EX", ttlSeconds);
    } catch (e) { /* ignore */ }
  },

  del: async (key) => {
    try { await getClient().del(key); } catch {}
  },

  // Invalidate pattern
  delPattern: async (pattern) => {
    try {
      const keys = await getClient().keys(pattern);
      if (keys.length) await getClient().del(...keys);
    } catch {}
  },
};