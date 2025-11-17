// src/middlewares/rateLimiter.ts
import Redis from 'ioredis';
import { Request, Response, NextFunction } from 'express';

/**
 * Redis client mặc định sẽ kết nối tới localhost:6379
 * Nếu muốn connect tới host khác (vd: Docker, remote), truyền config:
 *   new Redis({ host: '127.0.0.1', port: 6379 })
 */
const redis = new Redis();

/**
 * slidingWindow(limit, windowInSeconds)
 * - limit: số request tối đa cho mỗi key (thường key là IP)
 * - windowInSeconds: kích thước cửa sổ (ví dụ 60 giây)
 *
 * Trả về một middleware (req, res, next) để dùng với Express / NestJS (middleware layer).
 */
export function slidingWindow(limit: number, windowInSeconds: number) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Lấy identifier cho client. Thường dùng IP. X-Forwarded-For nếu có reverse proxy (APIM, Nginx...)
    // Lưu ý: x-forwarded-for có thể chứa nhiều IP (chuỗi), nên có thể cần split(',') lấy phần đầu.
    const ipHeader = req.headers['x-forwarded-for'];
    const ip =
      // ưu tiên header x-forwarded-for (proxy)
      (typeof ipHeader === 'string' ? ipHeader.split(',')[0].trim() : undefined) ||
      req.ip ||
      // req.connection.remoteAddress cũ, vẫn dùng như fallback
      (req.socket && (req.socket.remoteAddress as string)) ||
      'unknown';

    // Key Redis dùng để lưu lịch request cho client này
    const key = `rate_limit:${ip}`;

    // Thời điểm hiện tại (ms) và start của cửa sổ (ms)
    const now = Date.now();
    const windowStart = now - windowInSeconds * 1000;

    try {
      // 1) Lấy toàn bộ timestamps đã lưu (dạng array string)
      //    Lưu ý: dùng list (LPUSH/LRANGE) là cách đơn giản nhất nhưng không atomic.
      //    Nếu traffic lớn, nên chuyển sang ZSET + ZREMRANGEBYSCORE (mình sẽ note ở dưới).
      const timestamps = await redis.lrange(key, 0, -1);

      // 2) Lọc ra các timestamp còn nằm trong cửa sổ sliding
      const validTimestamps = timestamps.filter((ts) => Number(ts) > windowStart);

      // 3) Nếu số request trong window >= limit => reject (HTTP 429)
      if (validTimestamps.length >= limit) {
        return res.status(429).json({
          success: false,
          message: 'Too many requests — try again later',
        });
      }

      // 4) Nếu chưa vượt limit => push timestamp hiện tại vào list
      //    Dùng RPUSH để giữ thứ tự tăng dần (có thể dùng LPUSH + trim, tuỳ chọn)
      await redis.rpush(key, String(now));

      // 5) Đặt expire để key tự hết sau windowInSeconds (giúp Redis dọn dẹp)
      //    Nếu muốn giữ lâu hơn để debug có thể tăng TTL.
      await redis.expire(key, windowInSeconds);

      // 6) Cho request đi tiếp
      next();
    } catch (err) {
      // Nếu Redis lỗi, ta không block traffic (failure-safe): log và next()
      // (Bạn có thể thay đổi để trả 500 nếu muốn cực strict)
      console.error('Rate limit error:', err);
      next();
    }
  };
}
