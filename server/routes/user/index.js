const express = require('express');
const router = express.Router();
const { protect } = require('../../middleware/auth');
const User = require('../../models/User');

router.get('/profile', protect, async (req, res) => {
  try {
    if (req.userRole !== 'user') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const user = await User.findById(req.user._id)
      .select('-password')
      .lean();

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
