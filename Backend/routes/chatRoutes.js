// routes/chatRoutes.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Message = require('../models/Message');

router.use(auth);

// GET /chat/history/:peerId -> both directions, sorted
router.get('/history/:peerId', async (req, res) => {
  try {
    // Use the userId that your auth middleware provides
    const userId = req.userId || req.user?._id || req.user?.id;
    const peerId = req.params.peerId;
    
    console.log('History request - User ID:', userId, 'Peer ID:', peerId);
    console.log('Full req.user:', req.user);
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    if (!peerId) {
      return res.status(400).json({ error: 'peerId is required' });
    }

    const msgs = await Message.find({
      $or: [
        { from: userId, to: peerId },
        { from: peerId, to: userId },
      ]
    }).sort({ createdAt: 1 });

    res.json({ messages: msgs });
  } catch (err) {
    console.error('History fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch chat history' });
  }
});

// POST /chat/send -> persist a message even if receiver is offline
router.post('/send', async (req, res) => {
  try {
    // Use the userId that your auth middleware provides
    const userId = req.userId || req.user?._id || req.user?.id;
    const { to, text } = req.body || {};
    
    console.log('Send message request - User ID:', userId, 'To:', to, 'Text:', text);
    console.log('Full req.user:', req.user);
    console.log('Full req.body:', req.body);
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    if (!to || !text) {
      return res.status(400).json({ error: 'to and text are required' });
    }

    const msg = await Message.create({ 
      from: userId, 
      to: to, 
      text: text.trim() 
    });
    
    console.log('Message created successfully:', msg._id);
    res.json({ ok: true, message: msg });
  } catch (err) {
    console.error('Send message error:', err);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

module.exports = router;