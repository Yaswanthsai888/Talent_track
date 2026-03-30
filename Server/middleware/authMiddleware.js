const jwt = require('jsonwebtoken');
const User = require('../models/User');
const winston = require('winston');

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({ filename: 'auth.log', level: 'warn' })
    ]
});

class AuthError extends Error {
    constructor(message, statusCode = 401) {
        super(message);
        this.statusCode = statusCode;
        this.name = 'AuthenticationError';
    }
}

const passwordComplexityCheck = (password) => {
    const complexityRegex = {
        length: password.length >= 12,
        uppercase: /[A-Z]/.test(password),
        lowercase: /[a-z]/.test(password),
        number: /[0-9]/.test(password),
        specialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };

    const missingRequirements = Object.entries(complexityRegex)
        .filter(([key, value]) => !value)
        .map(([key]) => key);

    return {
        isValid: Object.values(complexityRegex).every(Boolean),
        missingRequirements
    };
};

const authMiddleware = {
    async protect(req, res, next) {
        let token;

        if (req.headers.authorization && 
            req.headers.authorization.startsWith('Bearer')) {
            try {
                token = req.headers.authorization.split(' ')[1];
                
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                
                req.user = await User.findById(decoded.id)
                    .select('-password')
                    .lean();

                if (!req.user) {
                    throw new AuthError('User not found');
                }

                next();
            } catch (error) {
                logger.warn(`Authentication failed: ${error.message}`);
                
                if (error.name === 'TokenExpiredError') {
                    return res.status(401).json({
                        error: 'Token expired',
                        message: 'Please log in again'
                    });
                }

                return res.status(401).json({
                    error: 'Not authorized',
                    message: error.message
                });
            }
        }

        if (!token) {
            logger.warn('No authentication token provided');
            return res.status(401).json({
                error: 'Not authorized',
                message: 'No token provided'
            });
        }
    },

    async adminOnly(req, res, next) {
        if (!req.user || req.user.role !== 'admin') {
            logger.warn(`Unauthorized admin access attempt by user ${req.user?.id}`);
            return res.status(403).json({
                error: 'Forbidden',
                message: 'Admin access required'
            });
        }
        next();
    },

    async checkPasswordComplexity(req, res, next) {
        const { password } = req.body;

        if (!password) {
            return res.status(400).json({
                error: 'Password validation failed',
                message: 'Password is required'
            });
        }

        const complexityCheck = passwordComplexityCheck(password);

        if (!complexityCheck.isValid) {
            logger.warn('Password complexity check failed', {
                missingRequirements: complexityCheck.missingRequirements
            });

            return res.status(400).json({
                error: 'Password complexity requirements not met',
                missingRequirements: complexityCheck.missingRequirements,
                requirements: {
                    length: 'At least 12 characters',
                    uppercase: 'At least one uppercase letter',
                    lowercase: 'At least one lowercase letter',
                    number: 'At least one number',
                    specialChar: 'At least one special character'
                }
            });
        }

        next();
    },

    generateTokens(user) {
        const accessToken = jwt.sign(
            { id: user._id, role: user.role }, 
            process.env.JWT_SECRET, 
            { expiresIn: process.env.JWT_EXPIRATION || '30d' }
        );

        const refreshToken = jwt.sign(
            { id: user._id }, 
            process.env.JWT_REFRESH_SECRET, 
            { expiresIn: process.env.JWT_REFRESH_EXPIRATION || '90d' }
        );

        return { accessToken, refreshToken };
    }
};

module.exports = authMiddleware;
