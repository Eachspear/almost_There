const mongoose = require('mongoose');

// Debug the mongoose connection
console.log('Mongoose connection state:', mongoose.connection.readyState);
// 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting

const connectionSchema = new mongoose.Schema(
  {
    requesterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user', // IMPORTANT: Make sure this reference matches your actual model name
      required: true,
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user', // IMPORTANT: Make sure this reference matches your actual model name
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

// Create a compound index to ensure uniqueness of connections
connectionSchema.index({ requesterId: 1, receiverId: 1 }, { unique: true });

// Check if model already exists to avoid OverwriteModelError
const Connection = mongoose.models.Connection || mongoose.model('Connection', connectionSchema);

console.log('Connection model initialized successfully');

module.exports = Connection;