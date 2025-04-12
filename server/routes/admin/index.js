const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../../middleware/auth');
const Admin = require('../../models/Admin');

router.get('/profile', protect, restrictTo('admin'), async (req, res) => {
  try {
    const admin = await Admin.findById(req.user._id)
      .select('-password')
      .lean();

    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    res.json(admin);
  } catch (error) {
    console.error('Admin profile fetch error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Add more admin routes here
router.get('/candidates', candidateController.getAllCandidates);
router.get('/jobs', jobController.getJobs);
router.get('/analytics', analyticsController.getDashboardStats);

module.exports = router;
