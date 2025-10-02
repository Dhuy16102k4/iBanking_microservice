const redis = require('redis');
let redisClient;

async function initRedis() {
  if (!redisClient) {
    redisClient = redis.createClient({ url: 'redis://redis:6379' });
    redisClient.on('error', (err) => console.error('❌ Redis Error:', err));
    await redisClient.connect();
  }
  return redisClient;
}

async function idempotencyMiddleware(req, res, next) {
  const client = await initRedis();
  const idemKey = req.headers['idempotency-key'];

  if (!idemKey) {
    return res.status(400).json({ message: 'Idempotency-Key header required' });
  }

  const cached = await client.get(`idem:${idemKey}`);
  if (cached) {
    const parsed = JSON.parse(cached);
    return res.status(200).json({
      message: 'Idempotent replay',
      ...parsed,
    });
  }

  // attach helper để controller lưu kết quả
  req.saveIdempotency = async (data, ttl = 600) => {
    await client.set(`idem:${idemKey}`, JSON.stringify(data), { PX: ttl * 1000 });
  };

  next();
}

module.exports = idempotencyMiddleware;
