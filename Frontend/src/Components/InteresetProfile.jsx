import React, { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import Navbar from "./Navbar";
import { Store } from "react-notifications-component";
import "./ProfilePage.css";

const showNotification = (title, message, type = "success", duration = 3000) => {
  Store.addNotification({
    title,
    message,
    type,
    insert: "top",
    container: "top-right",
    animationIn: ["animate__animated", "animate__fadeIn"],
    animationOut: ["animate__animated", "animate__fadeOut"],
    dismiss: { duration },
  });
};

export default function InterestsProfile() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [userData, setUserData] = useState(location.state?.user || null);
  const [loading, setLoading] = useState(!location.state?.user);
  const [error, setError] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [connected, setConnected] = useState(false);

  // ✅ Fetch user profile if page is reloaded or opened directly
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await axios.get(`http://localhost:8500/interests/${id}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        setUserData(response.data);
      } catch (error) {
        console.error("Error fetching user profile:", error);
        setError("Failed to load user profile.");
      } finally {
        setLoading(false);
      }
    };

    if (!userData && id) fetchUserProfile();
  }, [id, userData]);

  // ✅ Correct connection handler (matches your backend /connections/request)
  const handleConnect = async (userId) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      if (!userId) {
        showNotification("Error", "Invalid user ID", "danger");
        return;
      }

      setConnecting(true);
      console.log("Sending connection request to user ID:", userId);

      const response = await axios.post(
        `http://localhost:8500/connections/request`,
        { receiverId: userId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log("Connection response:", response.data);
      setConnected(true);
      showNotification(
        "Connection Requested",
        "Connection request sent successfully!"
      );
    } catch (error) {
      console.error("Error sending connection request:", error);
      if (error.response) {
        console.error("Error response data:", error.response.data);
      }
      showNotification(
        "Request Failed",
        error.response?.data?.message || "Failed to send connection request",
        "danger"
      );
    } finally {
      setConnecting(false);
    }
  };

  if (loading) {
    return (
      <div className="profile-loading-screen">
        <Navbar />
        <p>Loading user profile...</p>
      </div>
    );
  }

  if (error || !userData) {
    return (
      <div className="profile-error-screen">
        <Navbar />
        <p>{error || "User not found."}</p>
        <button className="back-btn" onClick={() => navigate("/map")}>
          ⬅ Back to Map
        </button>
      </div>
    );
  }

  return (
    <div className="profile-page-container">
      <Navbar />

      <div className="profile-content">
        <div className="profile-header">
          <img
            src={userData.profilePic || "/default-avatar.png"}
            alt={userData.userName || "User"}
            className="profile-avatar"
          />
          <div className="profile-header-text">
            <h2>{userData.displayName || userData.userName}</h2>
            <p className="profile-username">@{userData.userName?.toLowerCase()}</p>
          </div>
        </div>

        <div className="profile-section">
          <h3>Bio</h3>
          <p>{userData.bio || "No bio available."}</p>
        </div>

        {userData.interests && userData.interests.length > 0 && (
          <div className="profile-section">
            <h3>Interests</h3>
            <ul className="profile-list">
              {userData.interests.map((interest, i) => (
                <li key={i}>{interest}</li>
              ))}
            </ul>
          </div>
        )}

        {userData.activities && userData.activities.length > 0 && (
          <div className="profile-section">
            <h3>Activities</h3>
            <ul className="profile-list">
              {userData.activities.map((activity, i) => (
                <li key={i}>{activity}</li>
              ))}
            </ul>
          </div>
        )}

        {/* ✅ Buttons */}
        <div className="profile-actions">
          <button className="back-btn" onClick={() => navigate("/map")}>
            ⬅ Back to Map
          </button>

          <button
            className="connect-btn"
            onClick={() => handleConnect(id)}
            disabled={connecting || connected}
          >
            {connected
              ? "Connected"
              : connecting
              ? "Sending..."
              : "Connect"}
          </button>
        </div>
      </div>
    </div>
  );
}
