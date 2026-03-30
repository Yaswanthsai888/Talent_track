const winston = require('winston');
const Redis = require('ioredis');

// Create a logger if not already created
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({ filename: 'error.log', level: 'error' }),
        new winston.transports.File({ filename: 'combined.log' })
    ]
});

class CacheManager {
    constructor() {
        this.inMemoryCache = new Map();
        this.redisClient = null;
        this.initRedis();
    }

    initRedis() {
        try {
            this.redisClient = new Redis({
                host: process.env.REDIS_HOST || 'localhost',
                port: parseInt(process.env.REDIS_PORT) || 6379,
                retryStrategy: (times) => {
                    const maxRetryTime = 2000;
                    const delay = Math.min(times * 50, maxRetryTime);
                    logger.warn(`Redis connection attempt ${times}, retrying in ${delay}ms`);
                    return delay;
                },
                maxRetriesPerRequest: 3
            });

            this.redisClient.on('ready', () => {
                logger.info('Redis connection established');
            });

            this.redisClient.on('error', (err) => {
                logger.error('Redis connection error:', err);
            });
        } catch (error) {
            logger.error('Failed to initialize Redis:', error);
        }
    }

    async get(key) {
        try {
            // First try Redis
            if (this.redisClient) {
                const redisValue = await this.redisClient.get(key);
                if (redisValue) return JSON.parse(redisValue);
            }

            // Fallback to in-memory cache
            const item = this.inMemoryCache.get(key);
            if (!item) return null;

            // Check if item is expired
            if (item.expiry && Date.now() > item.expiry) {
                this.inMemoryCache.delete(key);
                return null;
            }

            return item.value;
        } catch (error) {
            logger.error('Cache get error:', error);
            return null;
        }
    }

    async set(key, data, expireIn = 3600) {
        try {
            const expiry = Date.now() + (expireIn * 1000);
            const serializedData = JSON.stringify(data);

            // Try to set in Redis first
            if (this.redisClient) {
                await this.redisClient.set(key, serializedData, 'EX', expireIn);
            }

            // Fallback to in-memory cache
            this.inMemoryCache.set(key, { 
                value: data, 
                expiry 
            });
        } catch (error) {
            logger.error('Cache set error:', error);
        }
    }

    async invalidate(pattern) {
        try {
            // Invalidate Redis keys
            if (this.redisClient) {
                const keys = await this.redisClient.keys(`*${pattern}*`);
                if (keys.length) {
                    await this.redisClient.del(...keys);
                }
            }

            // Invalidate in-memory cache
            for (let key of this.inMemoryCache.keys()) {
                if (key.includes(pattern)) {
                    this.inMemoryCache.delete(key);
                }
            }
        } catch (error) {
            logger.error('Cache invalidate error:', error);
        }
    }

    // Graceful shutdown method
    async shutdown() {
        if (this.redisClient) {
            await this.redisClient.quit();
            logger.info('Redis connection closed');
        }
    }
}

const cache = new CacheManager();

// Graceful shutdown handlers
process.on('SIGINT', async () => {
    await cache.shutdown();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    await cache.shutdown();
    process.exit(0);
});

module.exports = cache;
