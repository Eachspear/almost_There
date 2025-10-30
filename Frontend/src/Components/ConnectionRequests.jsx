import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Store } from "react-notifications-component";
import Navbar from "./Navbar";
import { UserPlus, UserCheck, UserX, RefreshCw, Clock } from "lucide-react";
import "./styles/Requests.css"; // ✨ new CSS file

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

function ConnectionRequests() {
  const [receivedRequests, setReceivedRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("received");
  const navigate = useNavigate();

  useEffect(() => {
    fetchConnectionRequests();
  }, [navigate]);

  const fetchConnectionRequests = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      setLoading(true);

      const [receivedResponse, sentResponse] = await Promise.all([
        axios.get(`https://backend-3ex6nbvuga-el.a.run.app/connections/requests`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`https://backend-3ex6nbvuga-el.a.run.app/connections/requests/sent`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      setReceivedRequests(receivedResponse.data.requests || []);
      setSentRequests(sentResponse.data.requests || []);
    } catch (error) {
      console.error("Error fetching connection requests:", error);
      showNotification("Error", "Failed to load connection requests", "danger");
    } finally {
      setLoading(false);
    }
  };

  const handleRespondToRequest = async (connectionId, action) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      await axios.post(
        `https://backend-3ex6nbvuga-el.a.run.app/connections/respond`,
        { connectionId, action },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      showNotification(
        "Success",
        `Connection request ${action === "accept" ? "accepted" : "declined"} successfully!`
      );
      fetchConnectionRequests();
    } catch (error) {
      console.error(`Error ${action}ing connection request:`, error);
      showNotification(
        "Request Failed",
        error.response?.data?.message || `Failed to ${action} connection request`,
        "danger"
      );
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
    <div className="requests-bg min-h-screen flex flex-col">
      <Navbar />
      <div className="container mx-auto max-w-4xl px-6 py-10 mt-20">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">
            Connection Requests
          </h1>
          <button
            onClick={fetchConnectionRequests}
            className="refresh-btn flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>

        {/* Tabs */}
        <div className="tab-container mb-6">
          <button
            className={`tab-btn ${activeTab === "received" ? "active-tab" : ""}`}
            onClick={() => setActiveTab("received")}
          >
            Received Requests
          </button>
          <button
            className={`tab-btn ${activeTab === "sent" ? "active-tab" : ""}`}
            onClick={() => setActiveTab("sent")}
          >
            Sent Requests
          </button>
        </div>

        {/* Loading */}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-indigo-500"></div>
          </div>
        ) : activeTab === "received" ? (
          <>
            {receivedRequests.length === 0 ? (
              <div className="empty-state">
                <UserPlus size={48} className="mx-auto mb-4 text-gray-400" />
                <h3 className="text-xl font-semibold text-gray-700">No pending requests</h3>
                <p className="text-sm text-gray-500 mt-1">
                  You don’t have any connection requests right now.
                </p>
              </div>
            ) : (
              <div className="space-y-5">
                {receivedRequests.map((request) => (
                  <div key={request._id} className="request-card">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <img
                          src={`https://api.dicebear.com/7.x/thumbs/svg?seed=${
                            request.requesterId?.UserName || "user"
                          }`}
                          alt="User avatar"
                          className="avatar"
                        />
                        <div>
                          <h3 className="font-semibold text-gray-800">
                            {request.requesterId?.name || "User"}
                          </h3>
                          <p className="text-sm text-gray-500">
                            @{request.requesterId?.UserName || "username"}
                          </p>
                          <div className="flex items-center mt-1 text-xs text-gray-500">
                            <Clock size={12} className="mr-1 text-indigo-500" />
                            <span>Sent {formatDate(request.createdAt)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleRespondToRequest(request._id, "reject")}
                          className="decline-btn flex items-center gap-1"
                        >
                          <UserX size={15} />
                          Decline
                        </button>
                        <button
                          onClick={() => handleRespondToRequest(request._id, "accept")}
                          className="accept-btn flex items-center gap-1"
                        >
                          <UserCheck size={15} />
                          Accept
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            {sentRequests.length === 0 ? (
              <div className="empty-state">
                <UserPlus size={48} className="mx-auto mb-4 text-gray-400" />
                <h3 className="text-xl font-semibold text-gray-700">No sent requests</h3>
                <p className="text-sm text-gray-500 mt-1">
                  You haven’t sent any connection requests yet.
                </p>
              </div>
            ) : (
              <div className="space-y-5">
                {sentRequests.map((request) => (
                  <div key={request._id} className="request-card">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <img
                          src={`https://api.dicebear.com/7.x/thumbs/svg?seed=${
                            request.receiverId?.UserName || "user"
                          }`}
                          alt="User avatar"
                          className="avatar"
                        />
                        <div>
                          <h3 className="font-semibold text-gray-800">
                            {request.receiverId?.name || "User"}
                          </h3>
                          <p className="text-sm text-gray-500">
                            @{request.receiverId?.UserName || "username"}
                          </p>
                          <div className="flex items-center mt-1 text-xs text-gray-500">
                            <Clock size={12} className="mr-1 text-indigo-500" />
                            <span>Sent {formatDate(request.createdAt)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="pending-tag">Pending</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default ConnectionRequests;
