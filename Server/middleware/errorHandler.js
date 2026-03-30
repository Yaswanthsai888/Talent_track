const logger = require('../utils/logger');
const CustomError = require('../utils/CustomError');

const handleSandboxError = async (err, req) => {
    // Placeholder for sandbox error handling
    logger.error('Sandbox error:', err);
};

const errorHandler = async (err, req, res, next) => {
    logger.error(err);

    if (err instanceof CustomError) {
        return res.status(err.statusCode).json({
            success: false,
            error: err.message
        });
    }

    // Handle sandbox specific errors
    if (err.code === 'SANDBOX_ERROR') {
        await handleSandboxError(err, req);
        return res.status(503).json({
            success: false,
            error: 'Evaluation service temporarily unavailable',
            retryAfter: 30
        });
    }

    // Handle timeout errors
    if (err.code === 'TIMEOUT') {
        return res.status(408).json({
            success: false,
            error: 'Evaluation timed out',
            retryable: true
        });
    }

    // Handle concurrent request limits
    if (err.code === 'RATE_LIMIT') {
        return res.status(429).json({
            success: false,
            error: 'Too many requests',
            retryAfter: err.retryAfter
        });
    }

    // Default error response
    res.status(500).json({
        success: false,
        error: 'Internal server error'
    });
};

module.exports = errorHandler;
