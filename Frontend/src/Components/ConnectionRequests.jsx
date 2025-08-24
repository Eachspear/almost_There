import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Store } from "react-notifications-component";
import Navbar from "./Navbar";
import { UserPlus, UserCheck, UserX, RefreshCw, Clock } from "lucide-react";

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
      
      // Fetch received requests
      const receivedResponse = await axios.get(
        `http://localhost:8500/connections/requests`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Fetch sent requests
      const sentResponse = await axios.get(
        `http://localhost:8500/connections/requests/sent`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setReceivedRequests(receivedResponse.data.requests || []);
      setSentRequests(sentResponse.data.requests || []);
      
      console.log("Received requests:", receivedResponse.data);
      console.log("Sent requests:", sentResponse.data);
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
      
      // Send response to connection request
      const response = await axios.post(
        `http://localhost:8500/connections/respond`,
        { connectionId, action },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      showNotification(
        "Success", 
        `Connection request ${action === 'accept' ? 'accepted' : 'rejected'} successfully!`
      );
      
      // Refresh the requests list
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
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-pink-100">
      <Navbar />
      <div className="container mx-auto max-w-4xl px-4 py-10 pt-24">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-pink-600">Connection Requests</h1>
          <button 
            onClick={fetchConnectionRequests}
            className="flex items-center gap-1 bg-white hover:bg-gray-50 text-pink-600 px-4 py-2 rounded-full shadow-sm transition"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>

        {/* Tabs */}
        <div className="flex bg-white rounded-xl p-1 shadow-sm mb-6 border border-pink-100">
          <button
            className={`flex-1 py-2 rounded-lg text-center text-sm font-medium transition ${
              activeTab === "received"
                ? "bg-pink-100 text-pink-700"
                : "text-gray-600 hover:text-pink-600"
            }`}
            onClick={() => setActiveTab("received")}
          >
            Received Requests
          </button>
          <button
            className={`flex-1 py-2 rounded-lg text-center text-sm font-medium transition ${
              activeTab === "sent"
                ? "bg-pink-100 text-pink-700"
                : "text-gray-600 hover:text-pink-600"
            }`}
            onClick={() => setActiveTab("sent")}
          >
            Sent Requests
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
          </div>
        ) : activeTab === "received" ? (
          <>
            {receivedRequests.length === 0 ? (
              <div className="text-center py-12 text-gray-600 bg-white rounded-xl shadow-sm border border-pink-100">
                <UserPlus size={48} className="mx-auto mb-4 text-gray-400" />
                <h3 className="text-xl font-medium">No pending requests</h3>
                <p className="text-sm">You don't have any connection requests at the moment</p>
              </div>
            ) : (
              <div className="space-y-4">
                {receivedRequests.map((request) => (
                  <div 
                    key={request._id} 
                    className="bg-white rounded-xl p-5 shadow-sm border border-pink-100 hover:shadow-md transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <img
                          src={`https://api.dicebear.com/7.x/thumbs/svg?seed=${request.requesterId?.UserName || 'user'}`}
                          alt="User avatar"
                          className="w-12 h-12 rounded-full border border-pink-300"
                        />
                        <div>
                          <h3 className="font-semibold text-gray-800">
                            {request.requesterId?.name || "User"}
                          </h3>
                          <p className="text-sm text-gray-500">
                            @{request.requesterId?.UserName || "username"}
                          </p>
                          <div className="flex items-center mt-1 text-xs text-gray-500">
                            <Clock size={12} className="mr-1" />
                            <span>Sent {formatDate(request.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleRespondToRequest(request._id, "reject")}
                          className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded-lg text-sm font-medium transition flex items-center gap-1"
                        >
                          <UserX size={16} />
                          Decline
                        </button>
                        <button
                          onClick={() => handleRespondToRequest(request._id, "accept")}
                          className="bg-pink-500 hover:bg-pink-600 text-white px-3 py-1 rounded-lg text-sm font-medium transition flex items-center gap-1"
                        >
                          <UserCheck size={16} />
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
              <div className="text-center py-12 text-gray-600 bg-white rounded-xl shadow-sm border border-pink-100">
                <UserPlus size={48} className="mx-auto mb-4 text-gray-400" />
                <h3 className="text-xl font-medium">No pending sent requests</h3>
                <p className="text-sm">You haven't sent any connection requests</p>
              </div>
            ) : (
              <div className="space-y-4">
                {sentRequests.map((request) => (
                  <div 
                    key={request._id} 
                    className="bg-white rounded-xl p-5 shadow-sm border border-pink-100"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <img
                          src={`https://api.dicebear.com/7.x/thumbs/svg?seed=${request.receiverId?.UserName || 'user'}`}
                          alt="User avatar"
                          className="w-12 h-12 rounded-full border border-pink-300"
                        />
                        <div>
                          <h3 className="font-semibold text-gray-800">
                            {request.receiverId?.name || "User"}
                          </h3>
                          <p className="text-sm text-gray-500">
                            @{request.receiverId?.UserName || "username"}
                          </p>
                          <div className="flex items-center mt-1 text-xs text-gray-500">
                            <Clock size={12} className="mr-1" />
                            <span>Sent {formatDate(request.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="px-4 py-2 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
                        Pending
                      </div>
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