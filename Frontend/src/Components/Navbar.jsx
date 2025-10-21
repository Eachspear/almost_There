import { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
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
  Menu,
  X,
} from "lucide-react";
import axios from "axios";
import React from "react";
import { Store } from "react-notifications-component";
import { useChat } from "./ChatContext";
import "./styles/Navbar.css";

export default function Navbar() {
  const { openChat } = useChat();
  const navigate = useNavigate();
  const location = useLocation();
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [mobileOpen, setMobileOpen] = useState(false);
  const profileRef = useRef(null);
  const notificationRef = useRef(null);

  const token = localStorage.getItem("token");

  // Hide Navbar on Login/Signup screens
  if (location.pathname === "/login" || location.pathname === "/signup") {
    return null;
  }

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
    } catch {
      return [];
    }
  };

  const fetchUnreadMessages = async () => {
    try {
      const response = await axios.get("http://localhost:8500/chat/unread", {
        headers: { Authorization: `Bearer ${token}` },
      });
      return (
        response.data.messages?.map((msg) => ({
          type: "message",
          message: `New message from ${msg.senderName || "a user"}`,
          senderName: msg.senderName,
          senderId: msg.senderId,
          isNew: true,
        })) || []
      );
    } catch {
      return [];
    }
  };

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

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

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

  const handleNotificationClick = (notification) => {
    if (notification.type === "message") {
      openChat(notification.senderId, notification.senderName || "User");
      setNotifications((prev) => prev.filter((n) => n.senderId !== notification.senderId));
    } else {
      navigate(notification.link);
    }
    setNotificationOpen(false);
  };

  return (
    <nav className="navbar-glass">
      <div className="container mx-auto px-4 flex justify-between items-center">
        {/* 🌿 Logo */}
        <Link
          to="/map"
          className="logo-text"
        >
          InstaHang
        </Link>

        {/* 📱 Mobile Menu Toggle */}
        <button
          className="md:hidden p-2 text-emerald-600"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        {/* 🧭 Desktop Links */}
        <div className="hidden md:flex space-x-6">
          <Link to="/map" className="nav-link">
            <Map size={18} /> Map
          </Link>
          <Link to="/matches" className="nav-link">
            <Heart size={18} /> Discover
          </Link>
          <Link to="/connections" className="nav-link">
            <UserCheck size={18} /> Connections
          </Link>
          <Link to="/requests" className="nav-link">
            <Users size={18} /> Requests
          </Link>
        </div>

        {/* 🔔 Notifications + Profile */}
        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <div className="relative" ref={notificationRef}>
            <button
              className="notif-btn"
              onClick={() => setNotificationOpen((prev) => !prev)}
            >
              <Bell className="h-6 w-6 text-emerald-600" />
              {notifications.some((n) => n.isNew) && (
                <span className="notif-dot animate-pulse" />
              )}
            </button>

            {notificationOpen && (
              <div className="notif-dropdown animate-fadeIn">
                <div className="notif-header">Notifications</div>
                <div className="notif-body">
                  {notifications.length > 0 ? (
                    notifications.map((n, i) => (
                      <div
                        key={i}
                        onClick={() => handleNotificationClick(n)}
                        className="notif-item"
                      >
                        {n.type === "message" ? (
                          <MessageSquare className="h-4 w-4 mr-2 text-emerald-600" />
                        ) : (
                          <Users className="h-4 w-4 mr-2 text-emerald-600" />
                        )}
                        <span>{n.message}</span>
                      </div>
                    ))
                  ) : (
                    <div className="notif-empty">No new notifications</div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Profile */}
          {/* 👤 Profile */}
<div className="relative" ref={profileRef}>
  <button
    className="profile-btn"
    onClick={() => setProfileOpen((prev) => !prev)}
  >
    <User className="h-6 w-6 text-emerald-600" />
  </button>

  {profileOpen && (
    <div className="profile-dropdown animate-fadeIn">
      <Link
        to="/profile"
        onClick={() => setProfileOpen(false)}
        className="profile-item"
      >
        <User className="h-5 w-5 mr-2 text-emerald-600" /> Profile
      </Link>

      <Link
        to="/settings"
        onClick={() => setProfileOpen(false)}
        className="profile-item"
      >
        <Settings className="h-5 w-5 mr-2 text-emerald-600" /> Settings
      </Link>

      {/* 🔴 Distinct Logout */}
      <button
        onClick={handleLogout}
        className="profile-item logout"
      >
        <LogOut className="h-5 w-5 mr-2 text-red-500" /> Logout
      </button>
    </div>
  )}
</div>

        </div>
      </div>

      {/* 📱 Mobile Menu */}
      {mobileOpen && (
        <div className="mobile-menu animate-slideDown">
          <Link to="/map" className="mobile-item" onClick={() => setMobileOpen(false)}>
            <Map size={18} /> Map
          </Link>
          <Link to="/matches" className="mobile-item" onClick={() => setMobileOpen(false)}>
            <Heart size={18} /> Discover
          </Link>
          <Link to="/connections" className="mobile-item" onClick={() => setMobileOpen(false)}>
            <UserCheck size={18} /> Connections
          </Link>
          <Link to="/requests" className="mobile-item" onClick={() => setMobileOpen(false)}>
            <Users size={18} /> Requests
          </Link>
        </div>
      )}
    </nav>
  );
}
