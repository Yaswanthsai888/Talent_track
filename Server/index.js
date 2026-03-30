require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const winston = require('winston');
const { createLogger, format, transports } = winston;
const expressWinston = require('express-winston');

// Create a logger
const logger = createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: format.combine(
        format.timestamp(),
        format.errors({ stack: true }),
        format.splat(),
        format.json()
    ),
    defaultMeta: { service: 'talent-track-server' },
    transports: [
        new transports.File({ 
            filename: `${process.env.LOG_DIR || './logs'}/error.log`, 
            level: 'error' 
        }),
        new transports.File({ 
            filename: `${process.env.LOG_DIR || './logs'}/combined.log` 
        }),
        new transports.Console({
            format: format.combine(
                format.colorize(),
                format.simple()
            )
        })
    ]
});

// Graceful error handling
process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

const app = express();

// Security Middleware
app.use(helmet());

// CORS Configuration
const corsOptions = {
    origin: (process.env.CORS_ORIGINS || '').split(','),
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Body Parsing Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate Limiting (optional, can be expanded)
const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100
});
app.use(limiter);

// Performance and monitoring middleware
const performanceMiddleware = require('./middleware/performanceMiddleware');
app.use(performanceMiddleware.requestTimer);
app.use(performanceMiddleware.memoryTracker);

// Before routes setup, add logging middleware
app.use(expressWinston.logger({
    winstonInstance: logger,
    meta: true,
    msg: "HTTP {{req.method}} {{req.url}}",
    expressFormat: true,
    colorize: false
}));

// Import all routes
const authRoutes = require('./routes/auth');
const testRoutes = require('./routes/tests');
const evaluationRoutes = require('./routes/evaluation');
const userRoutes = require('./routes/users');
const jobRoutes = require('./routes/jobs');
const analyticsRoutes = require('./routes/analytics');
const rankingRoutes = require('./routes/ranking');
const userTestRoutes = require('./routes/user-tests');

// Routes setup with base path
app.use('/api/auth', authRoutes);
app.use('/api/tests', testRoutes);
app.use('/api/evaluation', evaluationRoutes);
app.use('/api/users', userRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/ranking', rankingRoutes);
app.use('/api/user-tests', userTestRoutes);

// Remove this line as we're not using routeConfig anymore
// app.use(routeConfig.BASE_PATH, routes);

// Error logging middleware
app.use(expressWinston.errorLogger({
    winstonInstance: logger
}));

// Error Handling Middleware
const errorHandler = require('./middleware/errorHandler');
app.use(errorHandler);
app.use(performanceMiddleware.errorTracker);

// MongoDB Connection
const connectDB = async () => {
    try {
        mongoose.set('debug', process.env.MONGO_DEBUG === 'true');
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        logger.info('MongoDB connected successfully');
    } catch (error) {
        logger.error('MongoDB connection error:', error);
        process.exit(1);
    }
};

// Server Configuration
const PORT = process.env.PORT || 5000;

// Start Server
const startServer = async () => {
    await connectDB();
    const server = app.listen(PORT, () => {
        logger.info(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
    });

    // Graceful Shutdown
    const gracefulShutdown = (signal) => {
        logger.info(`Received ${signal}. Shutting down gracefully`);
        server.close(() => {
            mongoose.connection.close(false, () => {
                logger.info('MongoDB connection closed');
                process.exit(0);
            });
        });
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
};

startServer();
