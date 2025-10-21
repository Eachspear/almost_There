// routes/interestsRoutes.js
const express = require('express');
const router = express.Router();
const {
  updateUserInterests,
  getUserInterests,
  findUsersWithMatchingInterests,
  updatePersonality
} = require('../controllers/interests');
const authMiddleware = require('../middleware/auth');
const UserInterests = require('../models/userinterests');
const User = require('../models/user'); // ✅ Import User model

// 🔒 Protected routes (require authentication)
router.post('/update', authMiddleware, updateUserInterests);
router.get('/', authMiddleware, getUserInterests);
router.get('/matches', authMiddleware, findUsersWithMatchingInterests);
router.post('/updatePersonality', authMiddleware, updatePersonality);

// 👥 Public route — fetch a user's interests/profile by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Find profile by userId field
    const profile = await UserInterests.findOne({ userId: id });
    if (!profile) {
      return res.status(404).json({ error: "Profile not found" });
    }

    // ✅ Also fetch user details
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // ✅ Return complete profile with user details AND personality summary
    res.status(200).json({
      profile: {
        userId: profile.userId,
        userName: user.UserName,
        displayName: user.name,
        profilePic: user.profilePic,
        bio: profile.bio,
        interests: profile.interests,
        activities: profile.activities,
        personality: profile.personality,
        personalitySummary: profile.personalitySummary, // ✅ Include this!
        summary: profile.personalitySummary, // ✅ Also include as "summary" for compatibility
        lastUpdated: profile.lastUpdated
      }
    });
  } catch (error) {
    console.error("Error fetching profile by ID:", error);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;