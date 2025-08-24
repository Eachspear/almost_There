import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { useState, useEffect } from "react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import React from "react";
import axios from "axios";
import Navbar from "./Navbar";
import "./MapStyle.css";

// Creating icons for different similarity levels
const createDivIcon = (hexColor) =>
  L.divIcon({
    className: 'custom-pastel-marker',
    html: `<div style="background-color: ${hexColor};" class="marker-dot"></div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -36],
  });

export const userIcon = createDivIcon("#6a4c93"); // Deep lavender

export const similarityMarkers = {
  "very-high": createDivIcon("#ff4d6d"),   // Strawberry pink
  "high": createDivIcon("#ff85a2"),        // Blush pink
  "medium": createDivIcon("#ffd6a5"),      // Peach
  "low": createDivIcon("#fdffb6"),         // Soft yellow
  "very-low": createDivIcon("#caffbf"),    // Mint green
};

// Map auto-centering component
function ChangeMapView({ coords }) {
  const map = useMap();
  useEffect(() => {
    if (coords) {
      map.setView(coords, 12);
    }
  }, [coords, map]);
  return null;
}

const ProfileCard = ({ user, isCurrentUser = false, navigate }) => {
  const handleViewProfile = () => {
    if (isCurrentUser) {
      navigate("/profile");
    } else if (user.userId) {
      navigate(`/profile/${user.userId}`);
    }
  };

  const handleSendMessage = () => {
    if (user.userId) {
      navigate(`/messages?userId=${user.userId}`);
    }
  };

  // Always show a match percentage, default to 0%
  const similarityPercentage =
    typeof user.similarityScore === "number"
      ? `${Math.round(user.similarityScore * 100)}%`
      : "0%";

  return (
    <div className="profile-popup">
      <h3 className="profile-name">
        {isCurrentUser ? "You" : user.userName || "Unknown User"}
      </h3>

      {user.profilePic && (
        <div className="profile-pic-container">
          <img
            src={user.profilePic}
            alt={`${isCurrentUser ? "Your" : user.userName + "'s"} profile`}
            className="profile-pic"
          />
        </div>
      )}

      <div className="profile-details">
        {!isCurrentUser && user.displayName && (
          <p><strong>Name:</strong> {user.displayName}</p>
        )}

        {isCurrentUser ? (
          <p><strong>Status:</strong> This is your current location</p>
        ) : (
          <>
            <p><strong>Distance:</strong> {user.distanceInKm?.toFixed(2) || "N/A"} km away</p>
            <p><strong>Match:</strong> {similarityPercentage} similarity</p>
          </>
        )}

        {user.bio && (
          <div className="profile-bio">
            <strong>Bio:</strong>
            <p>{user.bio}</p>
          </div>
        )}

        {user.interests && user.interests.length > 0 && (
          <div className="profile-interests">
            <strong>Interests:</strong>
            <ul>
              {user.interests.map((interest, i) => (
                <li key={i}>{interest}</li>
              ))}
            </ul>
          </div>
        )}

        {user.activities && user.activities.length > 0 && (
          <div className="profile-activities">
            <strong>Activities:</strong>
            <ul>
              {user.activities.map((activity, i) => (
                <li key={i}>{activity}</li>
              ))}
            </ul>
          </div>
        )}

        {!isCurrentUser && (
          <div className="profile-actions">
            <button
              className="profile-button view-profile"
              onClick={handleViewProfile}
            >
              View Full Profile
            </button>
            <button
              className="profile-button send-message"
              onClick={handleSendMessage}
            >
              Message
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default function Map() {
  const [currentLocation, setCurrentLocation] = useState(null);
  const [nearbyUsers, setNearbyUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentUser, setCurrentUser] = useState(null);

  // Function to update only the current user's location in the backend
  const updateUserLocation = async (latitude, longitude) => {
    try {
      await axios.post(
        "http://localhost:8500/location/update",
        { latitude, longitude },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      console.log("User location updated.");
    } catch (error) {
      console.error("Failed to update user location:", error);
    }
  };

  // Function to fetch current user profile
  const fetchCurrentUserProfile = async () => {
    try {
      const response = await axios.get("http://localhost:8500/interests/", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      
      setCurrentUser({
        userName: response.data.UserName || "You",
        displayName: response.data.name || "Your Profile",
        profilePic: response.data.profilePic || null,
        bio: response.data.interests?.bio || null,
        interests: response.data.interests?.interests || [],
        activities: response.data.interests?.activities || [],
      });
      
      console.log("Current user profile:", response.data);
    } catch (error) {
      console.error("Failed to fetch current user profile:", error);
      // Set default user info if profile fetch fails
      setCurrentUser({
        userName: "You",
        displayName: "Your Profile"
      });
    }
  };

  // Function to fetch nearby users with detailed profile info and similarity scores
  const fetchNearbyUsers = async () => {
    try {
      const response = await axios.get("http://localhost:8500/location/nearby", {
        params: { maxDistance: 1000 },
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });

      console.log("API Response:", response.data);

      // Extract user data with detailed profile information
      const validUsers =
        response.data?.users
          ?.filter((user) => user?.latitude && user?.longitude && user?.user?.UserName)
          .map((user) => ({
            userId: user.userId || user.user?.id,
            location: {
              lat: user.latitude,
              lng: user.longitude,
            },
            userName: user.user.UserName,
            displayName: user.user.name,
            distanceInKm: user.distanceInKm || 
                         (user.distance ? user.distance / 1000 : null), // Convert m to km if needed
            profilePic: user.user.profilePic || null,
            bio: user.interests?.bio || null,
            interests: user.interests?.interests || [],
            activities: user.interests?.activities || [],
            isProfileComplete: user.interests?.isProfileComplete || false,
            similarityScore: user.similarityScore || null,
            similarityCategory: user.similarityCategory || "very-low"
          })) || [];

      setNearbyUsers(validUsers);
      console.log("Processed Nearby Users:", validUsers);
    } catch (error) {
      console.error("Error fetching nearby users:", error.response?.data || error.message);
    }
  };

  // Fetch similarity-based matched users
  const fetchSimilarityMatchedUsers = async () => {
    try {
      const response = await axios.get("http://localhost:8500/interests/matches", {
        params: { limit: 50 },
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });

      console.log("Similarity Matches Response:", response.data);

      // Create a map of userId to similarity information
      const similarityMap = {};
      response.data.users.forEach(user => {
        similarityMap[user.userId] = {
          similarityScore: user.similarityScore,
          similarityCategory: user.similarityCategory,
          interestMatchCount: user.interestMatchCount,
          activityMatchCount: user.activityMatchCount
        };
      });

      // Update nearby users with similarity information
      setNearbyUsers(prevUsers => 
        prevUsers.map(user => {
          const similarityInfo = similarityMap[user.userId];
          if (similarityInfo) {
            return {
              ...user,
              ...similarityInfo
            };
          }
          return user;
        })
      );
      
    } catch (error) {
      console.error("Error fetching similarity matches:", error.response?.data || error.message);
    }
  };

  // Fetch user's location and profile data
  useEffect(() => {
    const getUserLocation = () => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          setCurrentLocation([latitude, longitude]);
          setLoading(false);

          console.log("Current coordinates:", latitude, longitude);

          // Fetch current user profile
          await fetchCurrentUserProfile();
          
          // Update backend with current location
          await updateUserLocation(latitude, longitude);

          // Fetch nearby users
          await fetchNearbyUsers();
          
          // Fetch similarity-based matched users to update the markers
          await fetchSimilarityMatchedUsers();
        },
        (error) => {
          console.error("Geolocation error:", error);
          setError("Location access denied. Please enable GPS.");
          setLoading(false);
        },
        { enableHighAccuracy: true }
      );
    };

    getUserLocation();
  }, []);

  // Get the appropriate marker icon based on similarity category
  const getMarkerIcon = (user) => {
    if (!user.similarityCategory) return similarityMarkers["very-low"];
    return similarityMarkers[user.similarityCategory] || similarityMarkers["very-low"];
  };

  return (
    <div className="map-wrapper">
      <Navbar />
      <div className="map-container">
        {loading ? (
          <p className="loading-text">Fetching your location...</p>
        ) : error ? (
          <p className="error-text">{error}</p>
        ) : (
          <>
            <div className="map-legend">
              <h4>Similarity Legend</h4>
              <div className="legend-item">
                <div className="legend-color very-high"></div>
                <span>Very High Match (80-100%)</span>
              </div>
              <div className="legend-item">
                <div className="legend-color high"></div>
                <span>High Match (60-79%)</span>
              </div>
              <div className="legend-item">
                <div className="legend-color medium"></div>
                <span>Medium Match (40-59%)</span>
              </div>
              <div className="legend-item">
                <div className="legend-color low"></div>
                <span>Low Match (20-39%)</span>
              </div>
              <div className="legend-item">
                <div className="legend-color very-low"></div>
                <span>Very Low Match (0-19%)</span>
              </div>
              <div className="legend-item">
                <div className="legend-color you"></div>
                <span>You</span>
              </div>
            </div>
            
            <MapContainer center={currentLocation} zoom={12} className="map-box">
              <ChangeMapView coords={currentLocation} />
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

              {/* User's Current Location Marker */}
              {currentLocation && currentUser && (
                <Marker position={currentLocation} icon={userIcon}>
                  <Popup className="profile-popup-container">
                    <ProfileCard user={currentUser} isCurrentUser={true} />
                  </Popup>
                </Marker>
              )}

              {/* Nearby Users Markers - Color-coded by similarity */}
              {nearbyUsers.map((user, index) => (
                <Marker
                  key={user.userId || index}
                  position={[user.location.lat, user.location.lng]}
                  icon={getMarkerIcon(user)}
                >
                  <Popup className="profile-popup-container">
                    <ProfileCard user={user} />
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </>
        )}
      </div>
    </div>
  );
}