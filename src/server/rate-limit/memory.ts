type RateLimitResult =
  | { allowed: true; remaining: number }
  | { allowed: false; remaining: 0; retryAfterMs: number };

type Bucket = {
  timestamps: number[];
};

const buckets = new Map<string, Bucket>();

export function checkSlidingWindowRateLimit(input: {
  key: string;
  limit: number;
  windowMs: number;
}): RateLimitResult {
  const now = Date.now();
  const windowStart = now - input.windowMs;
  const bucket = buckets.get(input.key) ?? { timestamps: [] };
  const timestamps = bucket.timestamps.filter((timestamp) => timestamp > windowStart);

  if (timestamps.length >= input.limit) {
    const oldest = timestamps[0] ?? now;
    buckets.set(input.key, { timestamps });
    return {
      allowed: false,
      remaining: 0,
      retryAfterMs: Math.max(1000, oldest + input.windowMs - now),
    };
  }

  timestamps.push(now);
  buckets.set(input.key, { timestamps });

  return {
    allowed: true,
    remaining: Math.max(0, input.limit - timestamps.length),
  };
}
