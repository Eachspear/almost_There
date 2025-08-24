const express = require('express');
const router = express.Router();
const { 
    getSignin, 
    createUser, 
    AuthenticateUser, 
    verifyEmail, 
    resendVerificationEmail 
} = require('../controllers/user');

// Auth routes
router.get('/signin', getSignin);
router.post('/signup', createUser);
router.post('/login', AuthenticateUser);

// Email verification routes
router.get('/verify/:token', verifyEmail);
router.post('/resend-verification', resendVerificationEmail);

module.exports = router;