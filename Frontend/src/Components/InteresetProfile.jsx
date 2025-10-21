import React, { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import Navbar from "./Navbar";
import { Store } from "react-notifications-component";
import "./styles/ProfilePage.css";

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

export default function ProfilePage() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [userData, setUserData] = useState(location.state?.user || null);
  const [loading, setLoading] = useState(!location.state?.user);
  const [error, setError] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await axios.get(`http://localhost:8500/interests/${id}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
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

  const handleConnect = async (userId) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return navigate("/login");

      if (!userId) {
        showNotification("Error", "Invalid user ID", "danger");
        return;
      }

      setConnecting(true);
      await axios.post(
        `http://localhost:8500/connections/request`,
        { receiverId: userId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setConnected(true);
      showNotification("Success", "Connection request sent successfully!");
    } catch (error) {
      console.error("Error sending connection request:", error);
      showNotification(
        "Request Failed",
        error.response?.data?.message || "Failed to send connection request",
        "danger"
      );
    } finally {
      setConnecting(false);
    }
  };

  if (loading)
    return (
      <div className="profile-bg flex flex-col min-h-screen justify-center items-center">
        <Navbar />
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-teal-500 mt-10"></div>
      </div>
    );

  if (error || !userData)
    return (
      <div className="profile-bg min-h-screen flex flex-col items-center justify-center text-center">
        <Navbar />
        <p className="text-gray-700 mb-4">{error || "User not found."}</p>
        <button className="back-btn" onClick={() => navigate("/map")}>
          ⬅ Back to Map
        </button>
      </div>
    );

  return (
    <div className="profile-bg min-h-screen flex flex-col font-sans">
      <Navbar />

      <div className="container mx-auto max-w-3xl px-6 py-10 mt-20">
        <div className="profile-card rounded-3xl p-10 border border-teal-100 shadow-xl backdrop-blur-lg">
          {/* Header */}
          <div className="profile-header flex items-center gap-6 mb-8">
            <img
              src={userData.profilePic || "/default-avatar.png"}
              alt={userData.userName || "User"}
              className="profile-avatar"
            />
            <div>
              <h2 className="text-3xl font-semibold text-gray-800 mb-1">
                {userData.displayName || userData.userName}
              </h2>
              <p className="text-teal-600 font-medium">
                @{userData.userName?.toLowerCase()}
              </p>
            </div>
          </div>

          {/* Bio */}
          <div className="profile-section mb-6">
            <h3>Bio</h3>
            <p className="text-gray-700 italic">
              {userData.bio || "No bio available."}
            </p>
          </div>

          {/* Interests */}
          {userData.interests?.length > 0 && (
            <div className="profile-section mb-6">
              <h3>Interests</h3>
              <ul className="profile-list">
                {userData.interests.map((interest, i) => (
                  <li key={i}>{interest}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Activities */}
          {userData.activities?.length > 0 && (
            <div className="profile-section mb-6">
              <h3>Activities</h3>
              <ul className="profile-list">
                {userData.activities.map((activity, i) => (
                  <li key={i}>{activity}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Buttons */}
          <div className="profile-actions">
            <button className="back-btn" onClick={() => navigate("/map")}>
              ⬅ Back
            </button>

            <button
              className={`connect-btn ${connected ? "connected" : ""}`}
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
    </div>
  );
}
