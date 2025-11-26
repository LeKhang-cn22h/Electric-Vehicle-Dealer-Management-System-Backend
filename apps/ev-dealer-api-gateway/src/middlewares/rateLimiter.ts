// src/middlewares/rateLimiter.ts
import { Request, Response, NextFunction } from 'express';
import Redis from 'ioredis';

// Tạo Redis client
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  db: 0,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
});

redis.on('connect', () => {
  console.log(' Redis connected for rate limiting');
});

redis.on('error', (err) => {
  console.error(' Redis error:', err);
});

/**
 * Sliding Window Rate Limiter với Redis
 * @param maxRequests - Số requests tối đa
 * @param windowMs - Khung thời gian (milliseconds)
 */
export function slidingWindow(maxRequests: number, windowMs: number) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // 1. Xác định identifier (IP hoặc User ID)
      const user = (req as any).user;
      const identifier = user?.id ? `user:${user.id}` : `ip:${req.ip || 'unknown'}`;

      // 2. Tạo Redis key
      const key = `ratelimit:${identifier}`;
      const now = Date.now();
      const windowStart = now - windowMs;

      // 3. Pipeline để tối ưu performance
      const pipeline = redis.pipeline();

      // Xóa requests cũ ngoài window
      pipeline.zremrangebyscore(key, 0, windowStart);

      // Đếm số requests trong window
      pipeline.zcard(key);

      // Thêm request hiện tại
      pipeline.zadd(key, now, `${now}-${Math.random()}`);

      // Set TTL
      pipeline.expire(key, Math.ceil(windowMs / 1000) + 1);

      const results = await pipeline.exec();

      // results[1] là kết quả của zcard (đếm số requests)
      const requestCount = (results?.[1]?.[1] as number) || 0;

      // 4. Kiểm tra rate limit
      if (requestCount >= maxRequests) {
        const resetTime = Math.ceil(windowMs / 1000);

        res.status(429).json({
          statusCode: 429,
          error: 'Too Many Requests',
          message: `Bạn đã vượt quá giới hạn ${maxRequests} requests trong ${resetTime} giây. Vui lòng thử lại sau.`,
          retryAfter: resetTime,
        });
        return;
      }

      // 5. Thêm headers để client biết rate limit status
      res.setHeader('X-RateLimit-Limit', maxRequests.toString());
      res.setHeader('X-RateLimit-Remaining', (maxRequests - requestCount - 1).toString());
      res.setHeader('X-RateLimit-Reset', new Date(now + windowMs).toISOString());

      next();
    } catch (error) {
      console.error('[RateLimit] Error:', error);
      // Fail open - cho phép request nếu Redis lỗi
      next();
    }
  };
}

/**
 * Rate limit configs theo từng tầng
 */
export const rateLimitConfigs = {
  // PUBLIC: Rất rộng rãi - cho các endpoint công khai
  public: slidingWindow(1000, 60000), // 1000 requests/phút

  // READ: Rộng rãi - cho GET requests
  read: slidingWindow(200, 60000), // 200 requests/phút

  // SEARCH: Trung bình - cho search/filter operations
  search: slidingWindow(50, 60000), // 50 requests/phút

  // WRITE: Nghiêm ngặt - cho POST/PATCH/DELETE
  write: slidingWindow(20, 60000), // 20 requests/phút

  // AUTH: Rất nghiêm ngặt - cho login/register
  auth: slidingWindow(5, 300000), // 5 requests/5 phút

  // PAYMENT: Cực kỳ nghiêm ngặt - cho thanh toán
  payment: slidingWindow(3, 600000), // 3 requests/10 phút
};

/**
 * Helper: Get rate limit info from Redis
 */
export async function getRateLimitInfo(identifier: string): Promise<{
  count: number;
  limit: number;
  resetAt: Date;
}> {
  const key = `ratelimit:${identifier}`;
  const count = await redis.zcard(key);
  const ttl = await redis.ttl(key);

  return {
    count,
    limit: 100, // default
    resetAt: new Date(Date.now() + ttl * 1000),
  };
}

/**
 * Helper: Clear rate limit for specific user/ip
 */
export async function clearRateLimit(identifier: string): Promise<void> {
  const key = `ratelimit:${identifier}`;
  await redis.del(key);
  console.log(`[RateLimit] Cleared for ${identifier}`);
}

/**
 * Helper: Clear all rate limits
 */
export async function clearAllRateLimits(): Promise<number> {
  const keys = await redis.keys('ratelimit:*');
  if (keys.length > 0) {
    await redis.del(...keys);
  }
  console.log(`[RateLimit] Cleared ${keys.length} keys`);
  return keys.length;
}
