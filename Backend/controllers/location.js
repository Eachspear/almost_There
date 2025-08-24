const UserLocation = require("../models/userlocation");
const User = require("../models/user");
const mongoose=require("mongoose");

// Update user location
async function updateUserLocation(req, res) {
    try {
      const userId = req.userId; // Assuming this is set by your auth middleware
      const { latitude, longitude } = req.body;
      
      // Validate inputs
      if (!latitude || !longitude) {
        return res.status(400).json({ error: "Latitude and longitude are required" });
      }
      
      // Check if user exists
      const userExists = await User.findById(userId);
      if (!userExists) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Convert latitude and longitude to numbers
      const lat = parseFloat(latitude);
      const lng = parseFloat(longitude);
      
      // Update or create location entry
      const updatedLocation = await UserLocation.findOneAndUpdate(
        { userId },
        { 
          latitude: lat,
          longitude: lng,
          // Add GeoJSON format for MongoDB geospatial queries
          location: {
            type: "Point",
            coordinates: [lng, lat] // GeoJSON uses [longitude, latitude] order
          },
          lastUpdated: Date.now()
        },
        { upsert: true, new: true }
      );
      
      return res.status(200).json({
        message: "Location updated successfully",
        location: {
          latitude: updatedLocation.latitude,
          longitude: updatedLocation.longitude,
          lastUpdated: updatedLocation.lastUpdated
        }
      });
    } catch (error) {
      console.error("Error updating location:", error);
      return res.status(500).json({ error: "Server error" });
    }
  }
// Get user location
async function getUserLocation(req, res) {
  try {
    const userId = req.userId; // From auth middleware
    
    const location = await UserLocation.findOne({ userId });
    
    if (!location) {
      return res.status(404).json({ error: "Location not found for this user" });
    }
    
    return res.status(200).json({
      location: {
        latitude: location.latitude,
        longitude: location.longitude,
        lastUpdated: location.lastUpdated
      }
    });
  } catch (error) {
    console.error("Error fetching location:", error);
    return res.status(500).json({ error: "Server error" });
  }
}

// Update location on login
async function updateLocationOnLogin(req, res, next) {
  try {
    const userId = req.userId; // This should be set in the AuthenticateUser function
    const { latitude, longitude } = req.body;
    
    // Skip if no location data provided
    if (!latitude || !longitude) {
      return next();
    }
    
    // Update location silently - don't interrupt login flow
    await UserLocation.findOneAndUpdate(
      { userId },
      { 
        latitude,
        longitude,
        lastUpdated: Date.now()
      },
      { upsert: true, new: true }
    );


    // location = await UserLocation.findOne({userId});
    // console.log(location)
    
    next();
  } catch (error) {
    console.error("Error updating location during login:", error);
    // Continue login process even if location update fails
    next();
  }
}

// Get nearby users within a specified radius
async function getNearbyUsers(req, res) {
  try {
    const userId = req.userId; // Current user ID from auth middleware
    const { radius } = req.query; // Radius in kilometers
    
    // Validate radius
    const radiusInKm = parseFloat(radius) || 100; // Default to 5km if not provided
    
    // Get current user's location
    const userLocation = await UserLocation.findOne({ userId });
    
    if (!userLocation) {
      return res.status(404).json({ error: "Your location is not available. Please update your location first." });
    }
    
    const { latitude, longitude } = userLocation;
    
    // Find nearby users with enhanced interest information
    const nearbyUsers = await UserLocation.aggregate([
      {
        $geoNear: {
          near: { 
            type: "Point", 
            coordinates: [parseFloat(longitude), parseFloat(latitude)] 
          },
          distanceField: "distance",
          maxDistance: radiusInKm * 1000, // Convert km to meters
          spherical: true,
          query: { userId: { $ne: new mongoose.Types.ObjectId(userId) } } // Exclude current user
        }
      },
      {
        $lookup: {
          from: "users", // The name of your users collection
          localField: "userId",
          foreignField: "_id",
          as: "userDetails"
        }
      },
      {
        $unwind: "$userDetails"
      },
      // Add lookup to get interests
      {
        $lookup: {
          from: "userinterests",
          localField: "userId",
          foreignField: "userId",
          as: "interestsDetails"
        }
      },
      {
        $addFields: {
          interestsProfile: { 
            $cond: { 
              if: { $gt: [{ $size: "$interestsDetails" }, 0] }, 
              then: { $arrayElemAt: ["$interestsDetails", 0] }, 
              else: null 
            } 
          }
        }
      },
      {
        $project: {
          _id: 0,
          userId: 1,
          distance: 1, // Distance in meters
          distanceInKm: { $divide: ["$distance", 1000] }, // Convert to kilometers
          latitude: 1,
          longitude: 1,
          lastUpdated: 1,
          user: {
            name: "$userDetails.name",
            UserName: "$userDetails.UserName"
            // Don't include sensitive info like email
          },
          interests: {
            $cond: {
              if: "$interestsProfile",
              then: {
                interests: "$interestsProfile.interests",
                activities: "$interestsProfile.activities",
                bio: "$interestsProfile.bio",
                isProfileComplete: "$interestsProfile.isProfileComplete"
              },
              else: null
            }
          }
        }
      },
      {
        $sort: { distance: 1 } // Sort by distance, closest first
      }
    ]);
    
    return res.status(200).json({
      message: `Found ${nearbyUsers.length} users within ${radiusInKm}km radius`,
      users: nearbyUsers
    });
  } catch (error) {
    console.error("Error finding nearby users:", error);
    return res.status(500).json({ error: "Server error: " + error.message });
  }
}

module.exports = {
  updateUserLocation,
  getUserLocation,
  updateLocationOnLogin,
  getNearbyUsers
};