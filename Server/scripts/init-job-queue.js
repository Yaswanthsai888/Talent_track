const Redis = require('ioredis');

async function initJobQueue() {
    try {
        const redis = new Redis({
            host: 'redis',
            port: 6379,
            maxRetriesPerRequest: 3
        });

        await redis.ping();
        console.log('Job queue initialized successfully');
        await redis.quit();
    } catch (error) {
        console.error('Failed to initialize job queue:', error);
        // Don't exit process, allow server to start anyway
    }
}

initJobQueue();
