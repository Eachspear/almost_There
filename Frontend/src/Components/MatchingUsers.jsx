import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Store } from "react-notifications-component";
import Navbar from "./Navbar";
import { User, ArrowRight, Heart } from "lucide-react";

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

function MatchingUsers() {
  const [users, setUsers] = useState([]);
  const [connectedUserIds, setConnectedUserIds] = useState([]);
  const [pendingUserIds, setPendingUserIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [limitValue, setLimitValue] = useState(20);
  const navigate = useNavigate();

  useEffect(() => {
    fetchMatchingUsers();
  }, [limitValue]);

  useEffect(() => {
    fetchConnectedAndPendingUsers();
  }, []);

  // ✅ Fetch all connected and pending connection users
  const fetchConnectedAndPendingUsers = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      // Fetch accepted connections
      const [connectionsRes, sentRequestsRes] = await Promise.all([
        axios.get("http://localhost:8500/connections", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get("http://localhost:8500/connections/requests/sent", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      // ✅ Extract connected user IDs
      const connectedIds =
        connectionsRes.data.connections?.map((conn) => conn.user?.id) || [];

      // ✅ Extract pending (sent) user IDs
      const pendingIds =
        sentRequestsRes.data.requests?.map(
          (req) => req.receiverId?._id || req.receiverId
        ) || [];

      setConnectedUserIds(connectedIds);
      setPendingUserIds(pendingIds);

      console.log("Connected user IDs:", connectedIds);
      console.log("Pending user IDs:", pendingIds);
    } catch (error) {
      console.error("Error fetching connected/pending users:", error);
    }
  };

  // ✅ Fetch matching users
  const fetchMatchingUsers = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      setLoading(true);
      const response = await axios.get(`http://localhost:8500/interests/matches`, {
        params: { limit: limitValue },
        headers: { Authorization: `Bearer ${token}` },
      });

      setUsers(response.data.users || []);
      console.log("Fetched matching users:", response.data.users);
    } catch (error) {
      console.error("Error fetching matching users:", error);
      showNotification("Error", "Failed to load matching users", "danger");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Handle connect request
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

      console.log("Sending connection request to user ID:", userId);

      await axios.post(
        `http://localhost:8500/connections/request`,
        { receiverId: userId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      showNotification("Connection Requested", "Request sent successfully!");
      setPendingUserIds((prev) => [...prev, userId]);
    } catch (error) {
      console.error("Error sending connection request:", error);
      showNotification(
        "Request Failed",
        error.response?.data?.message || "Failed to send connection request",
        "danger"
      );
    }
  };

  // ✅ Filter out connected and pending users
  const filteredUsers = users.filter(
    (u) => !connectedUserIds.includes(u.userId) && !pendingUserIds.includes(u.userId)
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-pink-100">
      <Navbar />
      <div className="container mx-auto max-w-4xl px-4 mt-28 pb-10">
        <h1 className="text-3xl font-bold text-center text-pink-600 mb-8">
          Find People Who Match Your Vibe 💫
        </h1>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-12 text-gray-600">
            <User size={48} className="mx-auto mb-4 text-gray-400" />
            <h3 className="text-xl font-medium">No new matches</h3>
            <p className="text-sm">You've already connected or sent requests 💕</p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredUsers.map((user, index) => {
              const userId = user.userId;
              return (
                <div
                  key={index}
                  className="bg-white border border-pink-100 rounded-2xl p-5 shadow-md hover:shadow-lg transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <img
                        src={`https://api.dicebear.com/7.x/thumbs/svg?seed=${
                          user.user?.UserName || "user"
                        }`}
                        alt="User avatar"
                        className="w-16 h-16 rounded-full border border-pink-300 shadow-sm"
                      />
                      <div>
                        <h3 className="text-xl font-semibold text-gray-800">
                          {user.user?.name || "User"}
                        </h3>
                        <p className="text-sm text-gray-500 mb-2">
                          @{user.user?.UserName || "username"}
                        </p>

                        <div className="flex items-center text-sm text-pink-600 mb-3">
                          <Heart size={16} className="mr-1" />
                          <span>
                            {user.matchCount || user.similarityScore || "N/A"} shared interests
                          </span>
                        </div>

                        {user.interests?.length > 0 && (
                          <div className="mb-3">
                            <p className="text-sm text-gray-500 mb-1">Interests</p>
                            <div className="flex flex-wrap gap-2">
                              {user.interests.slice(0, 5).map((interest, idx) => (
                                <span
                                  key={idx}
                                  className="bg-pink-100 text-pink-800 text-xs px-3 py-1 rounded-full font-medium"
                                >
                                  {interest}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {user.activities?.length > 0 && (
                          <div>
                            <p className="text-sm text-gray-500 mb-1">Activities</p>
                            <div className="flex flex-wrap gap-2">
                              {user.activities.slice(0, 3).map((activity, idx) => (
                                <span
                                  key={idx}
                                  className="bg-purple-100 text-purple-800 text-xs px-3 py-1 rounded-full font-medium"
                                >
                                  {activity}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => handleConnect(userId)}
                      className="bg-pink-500 hover:bg-pink-600 text-white px-5 py-2 rounded-full font-semibold shadow-md transition flex items-center gap-1"
                    >
                      Connect <ArrowRight size={16} />
                    </button>
                  </div>

                  {user.bio && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <p className="text-sm text-gray-600 line-clamp-2">{user.bio}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {!loading && filteredUsers.length > 0 && (
          <div className="mt-10 flex justify-center space-x-4">
            <button
              onClick={() => setLimitValue(Math.max(10, limitValue - 10))}
              disabled={limitValue <= 10}
              className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                limitValue <= 10
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : "bg-white text-pink-600 border border-pink-300 hover:bg-pink-50"
              }`}
            >
              Show Fewer
            </button>
            <button
              onClick={() => setLimitValue(limitValue + 10)}
              className="px-4 py-2 bg-pink-500 hover:bg-pink-600 text-white rounded-full text-sm font-medium transition"
            >
              Show More
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default MatchingUsers;
