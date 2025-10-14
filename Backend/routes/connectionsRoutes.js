// routes/connectionRoutes.js
const express = require('express');
const router = express.Router();
const connectionController = require('../controllers/connectionController');
const auth = require('../middleware/auth'); // Assuming you have authentication middleware

// Protected routes - require authentication
router.use(auth);

// Send a connection request
router.post('/request', connectionController.sendConnectionRequest);

// Get all pending connection requests (received)
router.get('/requests', connectionController.getConnectionRequests);

// Get all sent connection requests
router.get('/requests/sent', connectionController.getSentConnectionRequests);

// Respond to a connection request
router.post('/respond', connectionController.respondToRequest);

// Get all accepted connections
router.get('/', connectionController.getUserConnections);

router.delete('/:id', connectionController.removeConnection);


module.exports = router;