// controllers/interests.js
const UserInterests = require("../models/userinterests");
const User = require("../models/user");
const mongoose = require("mongoose");

// Update or create user interests profile
async function updateUserInterests(req, res) {
  try {
    const userId = req.userId;
    const { interests, activities, bio } = req.body;
    
    // Check if user exists
    const userExists = await User.findById(userId);
    if (!userExists) {
      return res.status(404).json({ error: "User not found" });
    }
    
    // Update or create interests entry
    const updatedInterests = await UserInterests.findOneAndUpdate(
      { userId },
      { 
        interests: interests || [],
        activities: activities || [],
        bio: bio || "",
        isProfileComplete: true,
        lastUpdated: Date.now()
      },
      { upsert: true, new: true }
    );
    
    return res.status(200).json({
      message: "Interests profile updated successfully",
      profile: {
        interests: updatedInterests.interests,
        activities: updatedInterests.activities,
        bio: updatedInterests.bio,
        isProfileComplete: updatedInterests.isProfileComplete,
        lastUpdated: updatedInterests.lastUpdated
      }
    });
  } catch (error) {
    console.error("Error updating interests:", error);
    return res.status(500).json({ error: "Server error" });
  }
}

// Get user interests profile
async function getUserInterests(req, res) {
  try {
    const userId = req.userId;
    
    const profile = await UserInterests.findOne({ userId });
    
    if (!profile) {
      return res.status(200).json({ 
        isProfileComplete: false,
        message: "Profile not yet created"
      });
    }
    
   // In interests.js controller - getUserInterests function
return res.status(200).json({
  isProfileComplete: profile.isProfileComplete,
  profile: {
    interests: profile.interests,
    activities: profile.activities,
    bio: profile.bio,
    personality: profile.personality,
    personalitySummary: profile.personalitySummary,  // ✅ Changed from "summary"
    lastUpdated: profile.lastUpdated
  }
});

  } catch (error) {
    console.error("Error fetching interests profile:", error);
    return res.status(500).json({ error: "Server error" });
  }
}

// Check if profile is complete
async function checkProfileStatus(req, res, next) {
  try {
    const userId = req.userId;
    
    const profile = await UserInterests.findOne({ userId });
    
    // Add profile status to request object
    req.isProfileComplete = profile ? profile.isProfileComplete : false;
    
    next();
  } catch (error) {
    console.error("Error checking profile status:", error);
    // Continue to next middleware even if this check fails
    req.isProfileComplete = false;
    next();
  }
}

async function findUsersWithMatchingInterests(req, res) {
  try {
    const userId = req.userId;
    const { limit = 20, minSimilarity = 0 } = req.query;

    // Input validation with better error handling
    const parsedLimit = Number.isInteger(Number(limit)) && Number(limit) > 0 ? Number(limit) : 20;
    const parsedMinSimilarity = Number(minSimilarity) >= 0 && Number(minSimilarity) <= 1 
      ? Number(minSimilarity) 
      : 0;

    // Validate user exists and has a profile
    const userProfile = await UserInterests.findOne({ userId: new mongoose.Types.ObjectId(userId) });

    if (!userProfile) {
      return res.status(404).json({
        message: "User profile not found",
        users: []
      });
    }

    // Check if user has any interests or activities
    const hasInterests = Array.isArray(userProfile.interests) && userProfile.interests.length > 0;
    const hasActivities = Array.isArray(userProfile.activities) && userProfile.activities.length > 0;

    if (!hasInterests && !hasActivities) {
      return res.status(200).json({
        message: "Please add interests or activities to your profile first",
        users: []
      });
    }

    // Normalize interests and activities for case-insensitive comparison
    const normalizedInterests = (userProfile.interests || []).map(i => i.toLowerCase());
    const normalizedActivities = (userProfile.activities || []).map(a => a.toLowerCase());

    // Aggregation pipeline for finding users with matching interests
    const matchingUsers = await UserInterests.aggregate([
      // Stage 1: Create normalized fields for case-insensitive comparison
      {
        $addFields: {
          normalizedInterests: {
            $map: {
              input: { $ifNull: ["$interests", []] },
              as: "item",
              in: { $toLower: "$$item" }
            }
          },
          normalizedActivities: {
            $map: {
              input: { $ifNull: ["$activities", []] },
              as: "item",
              in: { $toLower: "$$item" }
            }
          }
        }
      },
      // Stage 2: Filter out the current user and find users with at least one matching interest or activity
      {
        $match: {
          userId: { $ne: new mongoose.Types.ObjectId(userId) },
          $or: [
            { normalizedInterests: { $in: normalizedInterests } },
            { normalizedActivities: { $in: normalizedActivities } }
          ]
        }
      },
      // Stage 3: Calculate intersection and union for Jaccard similarity
      {
        $addFields: {
          interestIntersection: {
            $size: {
              $setIntersection: ["$normalizedInterests", normalizedInterests]
            }
          },
          interestUnion: {
            $size: {
              $setUnion: ["$normalizedInterests", normalizedInterests]
            }
          },
          activityIntersection: {
            $size: {
              $setIntersection: ["$normalizedActivities", normalizedActivities]
            }
          },
          activityUnion: {
            $size: {
              $setUnion: ["$normalizedActivities", normalizedActivities]
            }
          }
        }
      },
      // Stage 4: Calculate Jaccard similarity scores
      {
        $addFields: {
          interestScore: {
            $cond: [
              { $gt: ["$interestUnion", 0] },
              { $divide: ["$interestIntersection", "$interestUnion"] },
              0
            ]
          },
          activityScore: {
            $cond: [
              { $gt: ["$activityUnion", 0] },
              { $divide: ["$activityIntersection", "$activityUnion"] },
              0
            ]
          }
        }
      },
      // Stage 5: Calculate weighted similarity score
      {
        $addFields: {
          similarityScore: {
            $add: [
              { $multiply: ["$interestScore", 0.6] },
              { $multiply: ["$activityScore", 0.4] }
            ]
          }
        }
      },
      // Stage 6: Filter based on minimum similarity threshold
      {
        $match: {
          similarityScore: { $gte: parsedMinSimilarity }
        }
      },
      // Stage 7: Join with users collection to get user details
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "userDetails"
        }
      },
      // Stage 8: Unwind the user details array
      { 
        $unwind: {
          path: "$userDetails",
          preserveNullAndEmptyArrays: false
        }
      },
      // Stage 9: Project the final result with useful data
      {
        $project: {
          _id: 0,
          userId: 1,
          similarityScore: { $round: ["$similarityScore", 2] },
          similarityCategory: {
            $switch: {
              branches: [
                { case: { $gte: ["$similarityScore", 0.8] }, then: "very-high" },
                { case: { $gte: ["$similarityScore", 0.6] }, then: "high" },
                { case: { $gte: ["$similarityScore", 0.4] }, then: "medium" },
                { case: { $gte: ["$similarityScore", 0.2] }, then: "low" }
              ],
              default: "very-low"
            }
          },
          matchDetails: {
            totalInterests: { $size: { $ifNull: ["$interests", []] } },
            totalActivities: { $size: { $ifNull: ["$activities", []] } },
            matchingInterests: "$interestIntersection",
            matchingActivities: "$activityIntersection"
          },
          interests: 1,
          activities: 1,
          lastUpdated: 1,
          user: {
            name: "$userDetails.name",
            username: "$userDetails.UserName",
            profilePic: "$userDetails.profilePic"
          }
        }
      },
      // Stage 10: Sort by similarity score
      { $sort: { similarityScore: -1 } },
      // Stage 11: Limit the results
      { $limit: parsedLimit }
    ]);

    // Add metadata to response
    const responseMetadata = {
      totalMatches: matchingUsers.length,
      userInterests: normalizedInterests.length,
      userActivities: normalizedActivities.length,
      filterCriteria: {
        limit: parsedLimit,
        minSimilarity: parsedMinSimilarity
      }
    };

    return res.status(200).json({
      message: matchingUsers.length > 0 
        ? `Found ${matchingUsers.length} users with similar interests` 
        : "No matching users found",
      metadata: responseMetadata,
      users: matchingUsers
    });

  } catch (error) {
    console.error("Error finding users with matching interests:", error);
    
    // Provide more specific error messages based on error type
    if (error.name === "CastError") {
      return res.status(400).json({ 
        error: "Invalid user ID format",
        details: error.message
      });
    }
    
    return res.status(500).json({ 
      error: "Failed to find matching users",
      message: error.message
    });
  }
}

// 🧠 Update personality traits for user
// 🧠 Update personality traits for user
async function updatePersonality(req, res) {
  try {
    const userId = req.userId;
    const { personality, summary } = req.body;

    if (!personality) {
      return res.status(400).json({ error: "Missing personality data" });
    }

    const updated = await UserInterests.findOneAndUpdate(
      { userId },
      {
        personality,
        personalitySummary: summary || "",
        lastUpdated: Date.now(),
        isProfileComplete: true
      },
      { new: true, upsert: true }
    );

    return res.status(200).json({
      message: "Personality traits updated successfully",
      personality: updated.personality,
      summary: updated.personalitySummary
    });
  } catch (error) {
    console.error("Error updating personality:", error);
    return res.status(500).json({ error: "Failed to update personality" });
  }
}



module.exports = {
  updateUserInterests,
  getUserInterests,
  checkProfileStatus,
  findUsersWithMatchingInterests,
    updatePersonality
};