const jwt = require('jsonwebtoken');
const logger = require('./logger');

const generateToken = (user) => {
    try {
        if (!process.env.JWT_SECRET) {
            throw new Error('JWT_SECRET is not defined');
        }

        return jwt.sign(
            { 
                id: user._id,
                role: user.role 
            },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRATION || '24h' }
        );
    } catch (error) {
        logger.error('Token generation failed:', error);
        throw new Error('Failed to generate authentication token');
    }
};

module.exports = generateToken;
