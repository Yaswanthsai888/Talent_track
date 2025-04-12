const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect } = require('../middleware/authMiddleware');

// Get user profile
router.get('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ message: 'Server error fetching profile' });
  }
});

// Update user profile
router.put('/profile', protect, async (req, res) => {
  try {
    const { name, skills, experience } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id, 
      { 
        name, 
        skills, 
        experience 
      }, 
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      message: 'Profile updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ message: 'Server error updating profile' });
  }
});

// Update user skills
router.put('/skills', protect, async (req, res) => {
  try {
    const { skills } = req.body;
    
    // Format skills before updating
    const formattedSkills = Array.isArray(skills) 
      ? skills.map(skill => skill.trim()).filter(Boolean)
      : typeof skills === 'string'
        ? skills.split(',').map(skill => skill.trim()).filter(Boolean)
        : [];

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { $addToSet: { skills: { $each: formattedSkills } } },
      { new: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      message: 'Skills updated successfully',
      skills: updatedUser.skills
    });
  } catch (error) {
    console.error('Skills update error:', error);
    res.status(500).json({ message: 'Server error updating skills' });
  }
});

module.exports = router;
