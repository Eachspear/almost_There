// routes/interestsRoutes.js
const express = require('express');
const router = express.Router();
const { 
  updateUserInterests, 
  getUserInterests, 
  findUsersWithMatchingInterests 
} = require('../controllers/interests');
const authMiddleware = require('../middleware/auth');

// Protected routes - require authentication
router.post('/update', authMiddleware, updateUserInterests);
router.get('/', authMiddleware, getUserInterests);
router.get('/matches', authMiddleware, findUsersWithMatchingInterests);

module.exports = router;