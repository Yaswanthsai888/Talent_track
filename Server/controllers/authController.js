const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const logger = require('../utils/logger');

const register = asyncHandler(async (req, res) => {
    const { name, email, password, role } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
        res.status(400);
        throw new Error('User already exists');
    }

    const user = await User.create({
        name,
        email,
        password,
        role: role || 'user'
    });

    if (user) {
        res.status(201).json({
            success: true,
            data: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                token: generateToken(user._id)
            }
        });
    } else {
        res.status(400);
        throw new Error('Invalid user data');
    }
});

const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    logger.info(`Login attempt for email: ${email}`);

    const user = await User.findOne({ email });

    if (!user || !(await user.matchPassword(password))) {
        logger.warn(`Failed login attempt for email: ${email}`);
        res.status(401);
        throw new Error('Invalid email or password');
    }

    if (user.isAccountLocked) {
        logger.warn(`Attempted login to locked account: ${email}`);
        res.status(423);
        throw new Error('Account is locked. Please try again later');
    }

    await user.resetLoginAttempts();
    user.lastLogin = new Date();
    await user.save();

    logger.info(`Successful login for user: ${email}, role: ${user.role}`);

    res.json({
        success: true,
        data: {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            token: generateToken(user) // Pass entire user object
        }
    });
});

const getUserProfile = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id).select('-password');
    if (user) {
        res.json({
            success: true,
            data: user
        });
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

module.exports = {
    register,
    login,
    getUserProfile
};
