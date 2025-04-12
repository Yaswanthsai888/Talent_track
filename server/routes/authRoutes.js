const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Admin = require('../models/Admin');
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

// Configure multer for resume upload
const upload = multer({ dest: 'uploads/' });

// User Registration with resume upload
router.post('/register', upload.single('resume'), async (req, res) => {
  try {
    const { name, email, password, role, phoneNumber, experience, companyName, adminKey } = req.body;
    let extractedSkills = [];

    // Log the registration attempt
    console.log('Registration attempt:', {
      email,
      role,
      passwordLength: password?.length
    });

    // Validate inputs
    if (!name || !email || !password || !phoneNumber) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Additional admin-specific validations
    if (role === 'admin') {
      if (!companyName || !adminKey) {
        return res.status(400).json({ 
          message: 'Company name and admin key are required for admin registration' 
        });
      }

      // Check admin registration key (replace with your actual secure method)
      if (adminKey !== process.env.ADMIN_REGISTRATION_KEY_NEW) {
        return res.status(403).json({ message: 'Invalid admin registration key' });
      }
    }

    // Parse resume if uploaded
    if (req.file) {
      try {
        const formData = new FormData();
        formData.append('file', fs.createReadStream(req.file.path), {
          filename: req.file.originalname,
          contentType: 'application/pdf'
        });

        const parseResponse = await axios.post('http://localhost:8000/parse-resume/', formData, {
          headers: formData.getHeaders()
        });

        if (parseResponse.data.success) {
          // Format skills as an array of strings
          extractedSkills = parseResponse.data.skills.map(skill => skill.trim());
        }

        // Clean up uploaded file
        fs.unlinkSync(req.file.path);
      } catch (error) {
        console.error('Resume parsing error:', error);
      }
    }

    // Parse skills if they come as JSON string
    if (req.body.skills) {
      try {
        const parsedSkills = JSON.parse(req.body.skills);
        extractedSkills = parsedSkills.map(skill => skill.trim());
      } catch (error) {
        console.error('Skills parsing error:', error);
      }
    }

    // Check if user exists
    const existingUser = await User.findOne({ email }) || await Admin.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create user based on role - Let the schema handle password hashing
    let newUser;
    if (role === 'admin') {
      newUser = new Admin({
        name,
        email,
        password, // Don't hash here, let schema middleware handle it
        phoneNumber,
        companyName: req.body.companyName,
        adminKey: req.body.adminKey
      });
    } else {
      newUser = new User({
        name,
        email,
        password, // Don't hash here, let schema middleware handle it
        phoneNumber,
        experience,
        skills: extractedSkills // This will now be a properly formatted array
      });
    }

    await newUser.save();

    // Generate token
    const token = jwt.sign(
      { id: newUser._id, role }, 
      process.env.JWT_SECRET, 
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'Registration successful',
      token,
      role,
      skills: extractedSkills
    });
  } catch (error) {
    console.error('Registration error:', {
      message: error.message,
      details: error.errors
    });
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        message: 'Validation error',
        errors: Object.keys(error.errors).reduce((acc, key) => {
          acc[key] = error.errors[key].message;
          return acc;
        }, {})
      });
    }
    
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// User Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    console.log('Login request:', {
      email,
      hasPassword: Boolean(password),
      passwordLength: password?.length
    });

    // Find user and explicitly include password
    let user = await User.findOne({ email: email.toLowerCase() })
      .select('+password')
      .exec();

    if (!user) {
      user = await Admin.findOne({ email: email.toLowerCase() })
        .select('+password')
        .exec();
    }

    if (!user) {
      console.log('User not found:', email);
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    console.log('Found user:', {
      id: user._id,
      email: user.email,
      hasPassword: Boolean(user.password),
      passwordLength: user.password?.length
    });

    // Try password comparison
    const isMatch = await user.comparePassword(password);
    console.log('Password match result:', isMatch);

    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate token with proper role
    const role = user.constructor.modelName === 'Admin' ? 'admin' : 'user';
    const token = jwt.sign(
      { id: user._id, role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Success response
    res.json({
      message: 'Login successful',
      token,
      role,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

module.exports = router;
