const mongoose = require("mongoose");

const userLocationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: true,
    unique: true
  },
  // Adding a GeoJSON object for location
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true
    }
  },
  // Keep individual lat/long fields for backward compatibility
  latitude: {
    type: Number,
    required: true
  },
  longitude: {
    type: Number,
    required: true
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Add a 2dsphere index on the location field
userLocationSchema.index({ location: '2dsphere' });

const UserLocation = mongoose.model("UserLocation", userLocationSchema);

module.exports = UserLocation;