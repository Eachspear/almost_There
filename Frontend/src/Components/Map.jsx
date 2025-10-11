import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { useState, useEffect } from "react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import React from "react";
import axios from "axios";
import Navbar from "./Navbar";
import "./MapStyle.css";
import { useNavigate } from "react-router-dom";

// 🎨 Create map marker icons for similarity levels
const createDivIcon = (hexColor) =>
  L.divIcon({
    className: "custom-pastel-marker",
    html: `<div style="background-color: ${hexColor};" class="marker-dot"></div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -36],
  });

export const userIcon = createDivIcon("#6a4c93"); // Deep lavender

export const similarityMarkers = {
  "very-high": createDivIcon("#ff4d6d"), // Strawberry pink
  high: createDivIcon("#ff85a2"), // Blush pink
  medium: createDivIcon("#ffd6a5"), // Peach
  low: createDivIcon("#fdffb6"), // Soft yellow
  "very-low": createDivIcon("#caffbf"), // Mint green
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

// 🧍 Profile Card Component
const ProfileCard = ({ user, isCurrentUser = false }) => {
  const navigate = useNavigate();

  // ✅ Navigate to a new profile page with user info
 const handleViewProfile = () => {
  const targetId = user.userId || user.id;
  if (!targetId) {
    console.error("User ID missing for profile view");
    return;
  }

  // Always navigate to other user's detailed profile page
  navigate(`/profile/${targetId}`, { state: { user } });
};

  // ✅ Send connection request
  const handleConnect = async () => {
    try {
      const targetId = user.userId || user.id;
      if (!targetId) {
        alert("User ID is missing. Cannot send connection request.");
        return;
      }

      const response = await axios.post(
        `http://localhost:8500/connect/${targetId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      alert(`Connection request sent to ${user.displayName || user.userName}`);
      console.log("Connection response:", response.data);
    } catch (error) {
      console.error("Failed to send connection request:", error);
      alert("Failed to send connection request. Check console.");
    }
  };

  // ✅ Calculate similarity percentage
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
          <p>
            <strong>Name:</strong> {user.displayName}
          </p>
        )}

        {isCurrentUser ? (
          <p>
            <strong>Status:</strong> This is your current location
          </p>
        ) : (
          <>
            <p>
              <strong>Distance:</strong>{" "}
              {user.distanceInKm?.toFixed(2) || "N/A"} km away
            </p>
            <p>
              <strong>Match:</strong> {similarityPercentage} similarity
            </p>
          </>
        )}

        {!isCurrentUser && (
          <div className="profile-actions">
            <button
              className="profile-button view-profile"
              onClick={handleViewProfile}
            >
              View Full Profile
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// 🗺 Main Map Component
export default function Map() {
  const [currentLocation, setCurrentLocation] = useState(null);
  const [nearbyUsers, setNearbyUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentUser, setCurrentUser] = useState(null);

  // Update current user's location
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

  // Fetch current user profile
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
    } catch (error) {
      console.error("Failed to fetch current user profile:", error);
      setCurrentUser({
        userName: "You",
        displayName: "Your Profile",
      });
    }
  };

  // Fetch nearby users
  const fetchNearbyUsers = async () => {
    try {
      const response = await axios.get("http://localhost:8500/location/nearby", {
        params: { maxDistance: 1000 },
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });

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
            distanceInKm:
              user.distanceInKm ||
              (user.distance ? user.distance / 1000 : null),
            profilePic: user.user.profilePic || null,
            bio: user.interests?.bio || null,
            interests: user.interests?.interests || [],
            activities: user.interests?.activities || [],
            similarityScore: user.similarityScore || null,
            similarityCategory: user.similarityCategory || "very-low",
          })) || [];

      setNearbyUsers(validUsers);
    } catch (error) {
      console.error("Error fetching nearby users:", error);
    }
  };

  // Fetch similarity matches
  const fetchSimilarityMatchedUsers = async () => {
    try {
      const response = await axios.get("http://localhost:8500/interests/matches", {
        params: { limit: 50 },
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });

      const similarityMap = {};
      response.data.users.forEach((user) => {
        similarityMap[user.userId] = {
          similarityScore: user.similarityScore,
          similarityCategory: user.similarityCategory,
        };
      });

      setNearbyUsers((prevUsers) =>
        prevUsers.map((user) => {
          const match = similarityMap[user.userId];
          return match ? { ...user, ...match } : user;
        })
      );
    } catch (error) {
      console.error("Error fetching similarity matches:", error);
    }
  };

  useEffect(() => {
    const getUserLocation = () => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          setCurrentLocation([latitude, longitude]);
          setLoading(false);

          await fetchCurrentUserProfile();
          await updateUserLocation(latitude, longitude);
          await fetchNearbyUsers();
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

  const getMarkerIcon = (user) =>
    similarityMarkers[user.similarityCategory] || similarityMarkers["very-low"];

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
            {/* Map Legend */}
            <div className="map-legend">
              <h4>Similarity Legend</h4>
              {["very-high", "high", "medium", "low", "very-low"].map((level) => (
                <div className="legend-item" key={level}>
                  <div className={`legend-color ${level}`}></div>
                  <span>{level.replace("-", " ").toUpperCase()} Match</span>
                </div>
              ))}
              <div className="legend-item">
                <div className="legend-color you"></div>
                <span>You</span>
              </div>
            </div>

            {/* Map with markers */}
            <MapContainer center={currentLocation} zoom={12} className="map-box">
              <ChangeMapView coords={currentLocation} />
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

              {/* Current User */}
              {currentLocation && currentUser && (
                <Marker position={currentLocation} icon={userIcon}>
                  <Popup className="profile-popup-container">
                    <ProfileCard user={currentUser} isCurrentUser={true} />
                  </Popup>
                </Marker>
              )}

              {/* Nearby Users */}
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
