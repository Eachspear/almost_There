const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema(
  {
    from: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
    to: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
    text: { type: String, required: true, trim: true },
    read: { type: Boolean, default: false },
    delivered: { type: Boolean, default: false }, // New field for delivery status
  },
  { timestamps: true }
);

// Index for faster queries on unread messages
MessageSchema.index({ to: 1, read: 1 });
MessageSchema.index({ to: 1, delivered: 1 });

module.exports = mongoose.model("Message", MessageSchema);