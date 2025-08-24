require('dotenv').config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const Message = require("./models/Message");

// Routes
const route = require("./routes/user");
const locationRoutes = require("./routes/locationRoutes");
const interestsRoutes = require("./routes/interestRoute");
const connectionRoutes = require("./routes/connectionsRoutes");
const chatRoutes = require("./routes/chatRoutes");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173"], // frontend dev URL
    methods: ["GET", "POST"]
  }
});

const port = 8500;

// MongoDB connect
mongoose.connect("mongodb://localhost:27017/InstaHang_Users")
  .then(() => console.log("Database Connected"))
  .catch(err => console.error("DB error", err));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors());

// REST routes
app.use("/user", route);
app.use("/location", locationRoutes);
app.use("/interests", interestsRoutes);
app.use("/connections", connectionRoutes);
app.use("/chat", chatRoutes);

app.get("/", (req, res) => {
  return res.end("HOMEPAGE");
});

// ---- SOCKET.IO SETUP ----
const userRoom = (userId) => `user:${userId}`;

// Authenticate socket connections
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error("No token provided"));
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = payload.userId;
    next();
  } catch (e) {
    next(new Error("Invalid token"));
  }
});

io.on("connection", async (socket) => {
  const uid = socket.userId?.toString();
  if (!uid) {
    socket.disconnect(true);
    return;
  }

  // Join a room specific to the user
  socket.join(userRoom(uid));
  console.log(`User ${uid} connected via socket ${socket.id}`);

  // Send any unread messages when user connects
  try {
    const unreadMessages = await Message.find({
      to: uid,
      read: false
    }).sort({ createdAt: 1 });

    console.log(`Delivering ${unreadMessages.length} unread messages to user ${uid}`);

    // Send each unread message
    for (const msg of unreadMessages) {
      socket.emit("message", msg);
    }

    // Mark messages as read after delivery
    if (unreadMessages.length > 0) {
      await Message.updateMany(
        { to: uid, read: false },
        { read: true }
      );
    }
  } catch (err) {
    console.error("Error loading unread messages:", err);
  }

  // Handle sending messages
  socket.on("send_message", async (data, cb) => {
    try {
      const { to, text } = data || {};
      if (!to || !text) return cb && cb({ ok: false, error: "to and text required" });

      // Create the message in database
      const msg = await Message.create({ from: uid, to, text });
      console.log(`Message saved: ${msg._id} from ${uid} to ${to}`);

      // Try to deliver to recipient if they're online
      const recipientSockets = io.sockets.adapter.rooms.get(userRoom(to));
      if (recipientSockets && recipientSockets.size > 0) {
        // Recipient is online, deliver immediately and mark as read
        io.to(userRoom(to)).emit("message", msg);
        await Message.findByIdAndUpdate(msg._id, { read: true });
        console.log(`Message delivered immediately to online user ${to}`);
      } else {
        // Recipient is offline, message will be delivered when they connect
        console.log(`User ${to} is offline, message will be delivered on connection`);
      }

      // Send acknowledgment to sender (don't echo the message back)
      cb && cb({ ok: true, message: msg });
    } catch (err) {
      console.error("send_message error", err);
      cb && cb({ ok: false, error: "failed to send" });
    }
  });

  socket.on("disconnect", () => {
    console.log("Socket disconnected:", socket.id);
  });
});

// Start server
server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});