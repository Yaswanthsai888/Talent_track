const winston = require('winston');

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({ 
            filename: './logs/performance.log', 
            level: 'warn' 
        })
    ]
});

const performanceMiddleware = {
    // Measure request processing time
    requestTimer: (req, res, next) => {
        const start = process.hrtime();

        // Hook into response finish event
        res.on('finish', () => {
            const duration = process.hrtime(start);
            const durationMs = duration[0] * 1000 + duration[1] / 1000000;

            const logData = {
                method: req.method,
                path: req.path,
                statusCode: res.statusCode,
                responseTime: durationMs,
                timestamp: new Date().toISOString()
            };

            // Log slow requests
            if (durationMs > 1000) {
                logger.warn('Slow Request', logData);
            } else {
                logger.info('Request Performance', logData);
            }
        });

        next();
    },

    // Track memory usage
    memoryTracker: (req, res, next) => {
        const memoryUsageBefore = process.memoryUsage();
        
        res.on('finish', () => {
            const memoryUsageAfter = process.memoryUsage();
            
            const memoryDiff = {
                rss: memoryUsageAfter.rss - memoryUsageBefore.rss,
                heapTotal: memoryUsageAfter.heapTotal - memoryUsageBefore.heapTotal,
                heapUsed: memoryUsageAfter.heapUsed - memoryUsageBefore.heapUsed
            };

            logger.info('Memory Usage', {
                method: req.method,
                path: req.path,
                memoryDiff,
                timestamp: new Date().toISOString()
            });
        });

        next();
    },

    // Error tracking with performance context
    errorTracker: (err, req, res, next) => {
        const errorLog = {
            message: err.message,
            stack: err.stack,
            method: req.method,
            path: req.path,
            body: req.body,
            params: req.params,
            query: req.query,
            timestamp: new Date().toISOString()
        };

        logger.error('Request Error', errorLog);

        // Send error response
        res.status(err.statusCode || 500).json({
            error: 'Internal Server Error',
            message: process.env.NODE_ENV === 'production' 
                ? 'An unexpected error occurred' 
                : err.message
        });
    }
};

module.exports = performanceMiddleware;
