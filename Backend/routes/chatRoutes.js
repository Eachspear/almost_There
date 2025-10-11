// routes/chatRoutes.js
const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const Message = require("../models/Message");
const User = require("../models/user"); // Needed to get sender details

router.use(auth);

/**
 * 📩 Send a message (persists even if receiver is offline)
 */
router.post("/send", async (req, res) => {
  try {
    const userId = req.userId || req.user?._id || req.user?.id;
    const { to, text } = req.body || {};

    if (!userId) return res.status(401).json({ error: "User not authenticated" });
    if (!to || !text) return res.status(400).json({ error: "'to' and 'text' are required" });

    const msg = await Message.create({
      from: userId,
      to,
      text: text.trim(),
      read: false,
      delivered: false,
    });

    console.log("Message created:", msg._id);

    res.status(201).json({ ok: true, message: msg });
  } catch (err) {
    console.error("Send message error:", err);
    res.status(500).json({ error: "Failed to send message" });
  }
});

/**
 * 💬 Get full chat history between current user and peer
 * Marks incoming messages as 'read'
 */
router.get("/history/:peerId", async (req, res) => {
  try {
    const userId = req.userId || req.user?._id || req.user?.id;
    const peerId = req.params.peerId;

    if (!userId) return res.status(401).json({ error: "User not authenticated" });
    if (!peerId) return res.status(400).json({ error: "peerId is required" });

    const messages = await Message.find({
      $or: [
        { from: userId, to: peerId },
        { from: peerId, to: userId },
      ],
    }).sort({ createdAt: 1 });

    // ✅ Mark all messages received from this peer as read
    await Message.updateMany(
      { from: peerId, to: userId, read: false },
      { $set: { read: true } }
    );

    // ✅ Mark them as delivered if not yet
    await Message.updateMany(
      { to: userId, from: peerId, delivered: false },
      { $set: { delivered: true } }
    );

    res.json({ messages });
  } catch (err) {
    console.error("History fetch error:", err);
    res.status(500).json({ error: "Failed to fetch chat history" });
  }
});

/**
 * 🔔 Get all unread messages for the logged-in user
 * Used by Navbar for notification badges
 */
router.get("/unread", async (req, res) => {
  try {
    const userId = req.userId || req.user?._id || req.user?.id;
    if (!userId) return res.status(401).json({ error: "User not authenticated" });

    const unreadMessages = await Message.find({ to: userId, read: false })
      .populate("from", "name UserName profilePic")
      .sort({ createdAt: -1 });

    const unreadCount = unreadMessages.length;

    const formattedMessages = unreadMessages.map((msg) => ({
      senderId: msg.from?._id,
      senderName: msg.from?.name || msg.from?.UserName || "Unknown User",
      senderPic: msg.from?.profilePic,
      text: msg.text,
      sentAt: msg.createdAt,
    }));

    res.json({
      unreadCount,
      messages: formattedMessages,
    });
  } catch (err) {
    console.error("Unread fetch error:", err);
    res.status(500).json({ error: "Failed to fetch unread messages" });
  }
});

/**
 * ✅ Optional — Mark all messages as delivered for user
 * Could be called when user comes online (future use)
 */
router.post("/delivered", async (req, res) => {
  try {
    const userId = req.userId || req.user?._id || req.user?.id;
    if (!userId) return res.status(401).json({ error: "User not authenticated" });

    await Message.updateMany({ to: userId, delivered: false }, { $set: { delivered: true } });
    res.json({ ok: true });
  } catch (err) {
    console.error("Mark delivered error:", err);
    res.status(500).json({ error: "Failed to update delivery status" });
  }
});

module.exports = router;
