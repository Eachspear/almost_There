import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { User, Settings, LogOut, Bell, Map, Users, Heart,UserCheck } from "lucide-react";
import React from "react";

export default function Navbar({ notifications = [] }) {
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const profileRef = useRef(null);
  const notificationRef = useRef(null);

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
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
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

        {/* Navigation Links */}
        <div className="hidden md:flex space-x-6">
          <Link
            className="text-rose-600 hover:text-pink-500 font-medium transition-colors flex items-center gap-1"
            to="/map"
          >
            <Map size={18} />
            Map
          </Link>
          <Link
            className="text-rose-600 hover:text-pink-500 font-medium transition-colors flex items-center gap-1"
            to="/matches"
          >
            <Heart size={18} />
            Matches
          </Link>
          <Link
            className="text-rose-600 hover:text-pink-500 font-medium transition-colors flex items-center gap-1"
            to="/connections"
          >
            <UserCheck size={18} />
            Connections
          </Link>
          <Link
            className="text-rose-600 hover:text-pink-500 font-medium transition-colors flex items-center gap-1"
            to="/requests"
          >
            <Users size={18} />
            Requests
          </Link>
        </div>

        {/* Notification and Profile Icons */}
        <div className="flex items-center space-x-4">
          {/* Notification Icon */}
          <div className="relative" ref={notificationRef}>
            <button
              className="p-2 rounded-full hover:bg-pink-50 transition-colors focus:outline-none cursor-pointer shadow-sm"
              onClick={() => setNotificationOpen((prev) => !prev)}
            >
              <Bell className="h-6 w-6 text-rose-500" />
              {notifications?.length > 0 && notifications.some((n) => n.isNew) && (
                <span className="absolute top-0 right-0 w-2 h-2 bg-red-600 rounded-full" />
              )}
            </button>

            {/* Notification Dropdown */}
            {notificationOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white border border-pink-100 rounded-xl shadow-lg z-50 dropdown-menu">
                <div className="p-4 text-sm font-semibold text-rose-500">Notifications</div>
                <div className="max-h-60 overflow-y-auto">
                  {notifications.map((notification, index) => (
                    <div
                      key={index}
                      className="flex items-center px-4 py-2 text-gray-700 hover:bg-pink-50 transition-colors"
                    >
                      <span className="flex-1">{notification.message}</span>
                      {notification.isNew && (
                        <span className="w-2 h-2 bg-red-600 rounded-full ml-2" />
                      )}
                    </div>
                  ))}
                </div>
                {notifications.length === 0 && (
                  <div className="px-4 py-2 text-sm text-gray-400">No new notifications</div>
                )}
              </div>
            )}
          </div>

          {/* Profile Icon */}
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
