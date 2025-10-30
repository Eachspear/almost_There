import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Store } from "react-notifications-component";
import Navbar from "./Navbar";
import { User, ArrowRight, Sparkles } from "lucide-react";
import "./styles/MatchingUsers.css";

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

  const fetchConnectedAndPendingUsers = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const [connectionsRes, sentRequestsRes] = await Promise.all([
        axios.get("https://backend-3ex6nbvuga-el.a.run.app/connections", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get("https://backend-3ex6nbvuga-el.a.run.app/connections/requests/sent", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const connectedIds =
        connectionsRes.data.connections?.map((conn) => conn.user?.id) || [];
      const pendingIds =
        sentRequestsRes.data.requests?.map(
          (req) => req.receiverId?._id || req.receiverId
        ) || [];

      setConnectedUserIds(connectedIds);
      setPendingUserIds(pendingIds);
    } catch (error) {
      console.error("Error fetching connected/pending users:", error);
    }
  };

  const fetchMatchingUsers = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      setLoading(true);
      const response = await axios.get(`https://backend-3ex6nbvuga-el.a.run.app/interests/matches`, {
        params: { limit: limitValue },
        headers: { Authorization: `Bearer ${token}` },
      });

      setUsers(response.data.users || []);
    } catch (error) {
      console.error("Error fetching matching users:", error);
      showNotification("Error", "Failed to load matching users", "danger");
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (userId) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return navigate("/login");
      if (!userId) return showNotification("Error", "Invalid user ID", "danger");

      await axios.post(
        `https://backend-3ex6nbvuga-el.a.run.app/connections/request`,
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

  const filteredUsers = users.filter(
    (u) => !connectedUserIds.includes(u.userId) && !pendingUserIds.includes(u.userId)
  );

  return (
    <div className="matching-bg min-h-screen">
      <Navbar />
      <div className="container mx-auto max-w-4xl px-4 mt-28 pb-10">
        <h1 className="matching-title text-center mb-10">
          Discover People Who Share Your Energy ✨
        </h1>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-teal-500"></div>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-12 bg-white/80 backdrop-blur-sm rounded-2xl shadow-md border border-teal-100">
            <User size={48} className="mx-auto mb-4 text-gray-400" />
            <h3 className="text-xl font-semibold text-gray-700">
              No new matches right now
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              You've already connected or sent requests 🌱
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredUsers.map((user, index) => {
              const userId = user.userId;
              return (
                <div
                  key={index}
                  className="match-card bg-white/80 backdrop-blur-md rounded-2xl p-6 border border-teal-100 shadow-sm hover:shadow-lg hover:scale-[1.01] transition-all duration-300"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <img
                        src={`https://api.dicebear.com/7.x/thumbs/svg?seed=${
                          user.user?.UserName || "user"
                        }`}
                        alt="User avatar"
                        className="w-16 h-16 rounded-full border-2 border-teal-300 shadow-sm"
                      />
                      <div>
                        <h3 className="text-xl font-semibold text-gray-800">
                          {user.user?.name || "User"}
                        </h3>
                        <p className="text-sm text-gray-500 mb-2">
                          @{user.user?.UserName || "username"}
                        </p>

                        <div className="flex items-center text-sm text-teal-700 mb-3">
                          <Sparkles size={16} className="mr-1" />
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
                                  className="tag-chip interest"
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
                                  className="tag-chip activity"
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
                      className="connect-btn"
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
              className={`limit-btn ${limitValue <= 10 ? "disabled" : ""}`}
            >
              Show Fewer
            </button>
            <button
              onClick={() => setLimitValue(limitValue + 10)}
              className="limit-btn primary"
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
