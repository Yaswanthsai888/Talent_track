const express = require('express');
const router = express.Router();
const multer = require('multer');
const axios = require('axios');
const User = require('../models/User');
const authMiddleware = require('../middleware/authMiddleware');

// Configure multer for file upload
const upload = multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => {
            cb(null, './uploads/resumes');
        },
        filename: (req, file, cb) => {
            cb(null, `${Date.now()}-${file.originalname}`);
        }
    }),
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only PDF and DOCX are allowed.'), false);
        }
    },
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

router.post('/upload', 
    authMiddleware.protect,
    upload.single('resume'), 
    async (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json({ error: 'No file uploaded' });
            }

            // Send file to resume parsing microservice
            const formData = new FormData();
            formData.append('file', req.file);

            const parseResponse = await axios.post(
                process.env.RESUME_PARSER_URL || 'http://localhost:5001/parse', 
                formData, 
                {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );

            // Update user profile with parsed skills
            const user = await User.findByIdAndUpdate(
                req.user._id, 
                { 
                    'profile.skills': parseResponse.data.skills,
                    'profile.resumeUrl': req.file.path 
                },
                { new: true }
            );

            res.json({
                message: 'Resume uploaded and parsed successfully',
                skills: parseResponse.data.skills,
                resumePath: req.file.path
            });
        } catch (error) {
            console.error('Resume upload error:', error);
            res.status(500).json({ 
                error: 'Resume parsing failed', 
                details: error.message 
            });
        }
    }
);

module.exports = router;
