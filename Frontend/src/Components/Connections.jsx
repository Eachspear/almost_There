import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Store } from "react-notifications-component";
import Navbar from "./Navbar";
import ChatWindow from "./ChatWindow";
import { UserCheck, UsersRound, Shield, Trash2 } from "lucide-react";

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
      const response = await axios.get("http://localhost:8500/connections", {
        headers: { Authorization: `Bearer ${token}` },
      });

      setConnections(response.data.connections || []);
      console.log("Fetched connections:", response.data);
    } catch (error) {
      console.error("Error fetching connections:", error);
      showNotification("Error", "Failed to load connections", "danger");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Remove connection and chat history
  const handleRemoveFriend = async (connectionId, friendId, friendName) => {
    if (!window.confirm(`Remove ${friendName} from your connections? This will delete your chat history too.`)) {
      return;
    }

    try {
      const token = localStorage.getItem("token");

      // Step 1: Remove connection
      await axios.delete(`http://localhost:8500/connections/${connectionId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Step 2: Delete chat history
      await axios.delete(`http://localhost:8500/chat/history/${friendId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Step 3: Update UI
      setConnections((prev) => prev.filter((c) => c.connectionId !== connectionId));

      showNotification("Removed", `${friendName} has been removed and chat history deleted.`);
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
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-pink-100">
      <Navbar />
      <div className="container mx-auto max-w-4xl px-4 py-10 pt-24">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-pink-600">My Connections</h1>
          <button
            onClick={() => navigate("/requests")}
            className="flex items-center gap-1 bg-white hover:bg-gray-50 text-pink-600 px-4 py-2 rounded-full shadow-sm transition"
          >
            <Shield size={16} />
            View Requests
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
          </div>
        ) : connections.length === 0 ? (
          <div className="text-center py-12 text-gray-600 bg-white rounded-xl shadow-sm border border-pink-100">
            <UsersRound size={48} className="mx-auto mb-4 text-gray-400" />
            <h3 className="text-xl font-medium">No connections yet</h3>
            <p className="text-sm">Start connecting with people who match your interests</p>
            <button
              onClick={() => navigate("/matches")}
              className="mt-4 bg-pink-500 hover:bg-pink-600 text-white px-6 py-2 rounded-full text-sm font-medium transition"
            >
              Find Matches
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {connections.map((connection) => (
              <div
                key={connection.connectionId}
                className="bg-white rounded-xl p-5 shadow-sm border border-pink-100 hover:shadow-md transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <img
                      src={`https://api.dicebear.com/7.x/thumbs/svg?seed=${connection.user?.UserName || "user"}`}
                      alt="User avatar"
                      className="w-16 h-16 rounded-full border border-pink-300"
                    />
                    <div>
                      <h3 className="font-semibold text-lg text-gray-800">
                        {connection.user?.name || "User"}
                      </h3>
                      <p className="text-sm text-gray-500">
                        @{connection.user?.UserName || "username"}
                      </p>
                      <div className="flex items-center mt-2 text-xs text-gray-500">
                        <UserCheck size={14} className="mr-1 text-green-500" />
                        <span>Connected since {formatDate(connection.since)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() =>
                        setChatPeer({
                          id: connection.user?.id,
                          name: connection.user?.name || "User",
                        })
                      }
                      className="bg-pink-500 hover:bg-pink-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
                    >
                      Message
                    </button>

                    <button
                      onClick={() =>
                        handleRemoveFriend(
                          connection.connectionId,
                          connection.user?.id,
                          connection.user?.name
                        )
                      }
                      className="flex items-center justify-center gap-1 bg-red-100 hover:bg-red-200 text-red-600 px-4 py-2 rounded-lg text-sm font-medium transition"
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
