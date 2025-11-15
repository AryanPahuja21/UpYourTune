import { createClient } from "redis";

const redis = createClient({
  url: process.env.REDIS_URL || "redis://redis:6379",
});

// Logs
redis.on("connect", () => console.log("✅ Redis connected"));
redis.on("error", (err) => console.error("❌ Redis error:", err));

// Required for Redis v4 (safe connect)
if (!redis.isOpen) {
  redis.connect();
}

export default redis;
