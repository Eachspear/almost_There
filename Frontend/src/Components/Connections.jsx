import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Store } from "react-notifications-component";
import Navbar from "./Navbar";
import ChatWindow from "./ChatWindow";
import { UserCheck, UsersRound, Shield, Trash2, MessageSquare } from "lucide-react";
import "./styles/Connections.css"; // 👈 new CSS file

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

function Connections() {
  const [connections, setConnections] = useState([]);
  const [chatPeer, setChatPeer] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchConnections();
  }, [navigate]);

  const fetchConnections = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      setLoading(true);
      const response = await axios.get("https://backend-3ex6nbvuga-el.a.run.app/connections", {
        headers: { Authorization: `Bearer ${token}` },
      });

      setConnections(response.data.connections || []);
    } catch (error) {
      console.error("Error fetching connections:", error);
      showNotification("Error", "Failed to load connections", "danger");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFriend = async (connectionId, friendId, friendName) => {
    if (!window.confirm(`Remove ${friendName}? This will also delete your chat history.`)) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      await axios.delete(`https://backend-3ex6nbvuga-el.a.run.app/connections/${connectionId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await axios.delete(`https://backend-3ex6nbvuga-el.a.run.app/chat/history/${friendId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setConnections((prev) => prev.filter((c) => c.connectionId !== connectionId));

      showNotification("Removed", `${friendName} removed and chat history deleted.`);
    } catch (error) {
      console.error("Error removing connection:", error);
      showNotification("Error", "Failed to remove connection", "danger");
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="connections-bg min-h-screen flex flex-col">
      <Navbar />
      <div className="container mx-auto max-w-6xl px-6 py-10 mt-20">
        {/* Header */}
        <div className="flex justify-between items-center mb-10">
          <h1 className="text-4xl font-extrabold text-slate-800 tracking-tight">
            My Connections
          </h1>
          <button
            onClick={() => navigate("/requests")}
            className="requests-btn flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all"
          >
            <Shield size={16} />
            View Requests
          </button>
        </div>

        {/* Loading */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-sky-500"></div>
          </div>
        ) : connections.length === 0 ? (
          <div className="empty-state text-center py-16">
            <UsersRound size={50} className="mx-auto mb-4 text-gray-400" />
            <h3 className="text-2xl font-semibold text-gray-700 mb-2">No connections yet</h3>
            <p className="text-gray-500 mb-4">
              Start connecting with people who share your interests.
            </p>
            <button
              onClick={() => navigate("/matches")}
              className="discover-btn px-6 py-2 rounded-xl text-white font-medium transition-all"
            >
              Discover People
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {connections.map((connection) => (
              <div key={connection.connectionId} className="connection-card transition-all">
                <div className="flex items-center justify-between">
                  {/* User Info */}
                  <div className="flex items-center gap-4">
                    <img
                      src={`https://api.dicebear.com/7.x/thumbs/svg?seed=${connection.user?.UserName || "user"}`}
                      alt="User avatar"
                      className="avatar"
                    />
                    <div>
                      <h3 className="font-semibold text-lg text-gray-800">
                        {connection.user?.name || "User"}
                      </h3>
                      <p className="text-sm text-gray-500">@{connection.user?.UserName || "username"}</p>
                      <div className="flex items-center mt-2 text-xs text-gray-500">
                        <UserCheck size={14} className="mr-1 text-sky-600" />
                        <span>Since {formatDate(connection.since)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() =>
                        setChatPeer({
                          id: connection.user?.id,
                          name: connection.user?.name || "User",
                        })
                      }
                      className="message-btn flex items-center gap-1 justify-center px-4 py-2 rounded-lg text-sm font-medium"
                    >
                      <MessageSquare size={15} /> Message
                    </button>

                    <button
                      onClick={() =>
                        handleRemoveFriend(
                          connection.connectionId,
                          connection.user?.id,
                          connection.user?.name
                        )
                      }
                      className="remove-btn flex items-center gap-1 justify-center px-4 py-2 rounded-lg text-sm font-medium"
                    >
                      <Trash2 size={14} /> Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Chat Window */}
      {chatPeer && (
        <ChatWindow
          peerId={chatPeer.id}
          peerName={chatPeer.name}
          onClose={() => setChatPeer(null)}
        />
      )}
    </div>
  );
}

export default Connections;
