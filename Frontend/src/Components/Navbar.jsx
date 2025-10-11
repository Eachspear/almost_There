import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  User,
  Settings,
  LogOut,
  Bell,
  Map,
  Users,
  Heart,
  UserCheck,
  MessageSquare,
} from "lucide-react";
import axios from "axios";
import React from "react";
import { Store } from "react-notifications-component";
import { useChat } from "./ChatContext"; // ✅ use global ChatContext

export default function Navbar() {
  const { openChat } = useChat(); // ✅ Access openChat globally
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const profileRef = useRef(null);
  const notificationRef = useRef(null);

  const token = localStorage.getItem("token");

  // 🔔 Toast notifications (optional)
  const showNotification = (title, message, type = "info", duration = 3000) => {
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

  // 🧠 Fetch connection requests
  const fetchConnectionRequests = async () => {
    try {
      const response = await axios.get("http://localhost:8500/connections/requests", {
        headers: { Authorization: `Bearer ${token}` },
      });

      return (
        response.data.requests?.map((req) => ({
          type: "connection",
          message: `${req.requesterId?.name || "Someone"} sent you a connection request`,
          isNew: true,
          link: "/requests",
        })) || []
      );
    } catch (error) {
      console.error("Error fetching connection requests:", error);
      return [];
    }
  };

  // 💬 Fetch unread messages
  const fetchUnreadMessages = async () => {
    try {
      const response = await axios.get("http://localhost:8500/chat/unread", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const unreadMsgs =
        response.data.messages?.map((msg) => ({
          type: "message",
          message: `New message from ${msg.senderName || "a user"}`,
          senderName: msg.senderName,
          senderId: msg.senderId,
          isNew: true,
        })) || [];

      return unreadMsgs;
    } catch (error) {
      console.error("Error fetching unread messages:", error);
      return [];
    }
  };

  // 🔁 Poll both endpoints every 10 seconds
  useEffect(() => {
    if (!token) return;

    const fetchNotifications = async () => {
      const [connReqs, unreadMsgs] = await Promise.all([
        fetchConnectionRequests(),
        fetchUnreadMessages(),
      ]);
      setNotifications([...connReqs, ...unreadMsgs]);
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, [token]);

  // 🔒 Logout
  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  // 👇 Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setNotificationOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 🧩 Handle notification click
  const handleNotificationClick = (notification) => {
    if (notification.type === "message") {
      console.log("📨 Opening chat for:", notification.senderName);
      openChat(notification.senderId, notification.senderName || "User");

      // Remove message notification immediately
      setNotifications((prev) =>
        prev.filter((n) => n.senderId !== notification.senderId)
      );
    } else {
      navigate(notification.link);
    }
    setNotificationOpen(false);
  };

  return (
    <nav className="bg-white shadow-md fixed w-full top-0 z-50 border-b border-pink-200 py-3">
      <div className="container mx-auto px-4 flex justify-between items-center">
        {/* Logo */}
        <Link
          to="/map"
          className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-rose-500 text-2xl font-extrabold cursor-pointer hover:opacity-80"
        >
          💖 InstaHang
        </Link>

        {/* Nav Links */}
        <div className="hidden md:flex space-x-6">
          <Link className="text-rose-600 hover:text-pink-500 font-medium flex items-center gap-1" to="/map">
            <Map size={18} /> Map
          </Link>
          <Link className="text-rose-600 hover:text-pink-500 font-medium flex items-center gap-1" to="/matches">
            <Heart size={18} /> Matches
          </Link>
          <Link className="text-rose-600 hover:text-pink-500 font-medium flex items-center gap-1" to="/connections">
            <UserCheck size={18} /> Connections
          </Link>
          <Link className="text-rose-600 hover:text-pink-500 font-medium flex items-center gap-1" to="/requests">
            <Users size={18} /> Requests
          </Link>
        </div>

        {/* Notifications + Profile */}
        <div className="flex items-center space-x-4">
          {/* 🔔 Notifications */}
          <div className="relative" ref={notificationRef}>
            <button
              className="p-2 rounded-full hover:bg-pink-50 transition-colors focus:outline-none cursor-pointer shadow-sm relative"
              onClick={() => setNotificationOpen((prev) => !prev)}
            >
              <Bell className="h-6 w-6 text-rose-500" />
              {notifications.some((n) => n.isNew) && (
                <span className="absolute top-0 right-0 w-2 h-2 bg-red-600 rounded-full" />
              )}
            </button>

            {notificationOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-white border border-pink-100 rounded-xl shadow-lg z-50 dropdown-menu">
                <div className="p-4 text-sm font-semibold text-rose-500 border-b border-pink-100">
                  Notifications
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {notifications.length > 0 ? (
                    notifications.map((n, i) => (
                      <div
                        key={i}
                        onClick={() => handleNotificationClick(n)}
                        className="flex items-center px-4 py-2 text-gray-700 hover:bg-pink-50 transition-colors cursor-pointer"
                      >
                        {n.type === "message" ? (
                          <MessageSquare className="h-4 w-4 mr-2 text-pink-500" />
                        ) : (
                          <Users className="h-4 w-4 mr-2 text-pink-500" />
                        )}
                        <span>{n.message}</span>
                      </div>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-sm text-gray-400 text-center">
                      No new notifications
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 👤 Profile */}
          <div className="relative" ref={profileRef}>
            <button
              className="p-2 rounded-full hover:bg-pink-50 transition-colors focus:outline-none cursor-pointer shadow-sm"
              onClick={() => setProfileOpen((prev) => !prev)}
            >
              <User className="h-6 w-6 text-rose-500" />
            </button>

            {profileOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-pink-100 rounded-xl shadow-lg z-50 dropdown-menu">
                <Link
                  className="flex items-center px-4 py-2 text-gray-700 hover:bg-pink-50 transition-colors"
                  to="/profile"
                  onClick={() => setProfileOpen(false)}
                >
                  <User className="h-5 w-5 mr-2 text-pink-500" />
                  Profile
                </Link>
                <Link
                  className="flex items-center px-4 py-2 text-gray-700 hover:bg-pink-50 transition-colors"
                  to="/settings"
                  onClick={() => setProfileOpen(false)}
                >
                  <Settings className="h-5 w-5 mr-2 text-pink-500" />
                  Settings
                </Link>
                <button
                  className="flex items-center px-4 py-2 text-rose-600 hover:bg-red-50 transition-colors w-full text-left"
                  onClick={handleLogout}
                >
                  <LogOut className="h-5 w-5 mr-2 text-rose-500" />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
