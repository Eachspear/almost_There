// routes/locationRoutes.js
const express = require('express');
const router = express.Router();
const { 
  updateUserLocation, 
  getUserLocation, 
  getNearbyUsers 
} = require('../controllers/location');
const authMiddleware = require('../middleware/auth'); // Your authentication middleware

// Protected routes - require authentication
router.post('/update', authMiddleware, updateUserLocation);
router.get('/', authMiddleware, getUserLocation);
router.get('/nearby', authMiddleware, getNearbyUsers);

module.exports = router;