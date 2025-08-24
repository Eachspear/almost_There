// models/userinterests.js
const mongoose = require("mongoose");

const userInterestsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: true,
    unique: true
  },
  interests: [{
    type: String,
    trim: true
  }],
  activities: [{
    type: String,
    trim: true
  }],
  bio: {
    type: String,
    trim: true,
    maxlength: 500
  },
  isProfileComplete: {
    type: Boolean,
    default: false
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  embedding: {
    type: [Number],
    default: []
  }
  
}, { timestamps: true });

const UserInterests = mongoose.model("UserInterests", userInterestsSchema);

module.exports = UserInterests;