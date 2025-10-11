import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import React from "react";
import Signup from "./Components/Signup";
import Login from "./Components/Login";
import Map from "./Components/Map";
import InterestsProfile from "./Components/InterestsProfile";
import InterestProfile from "./Components/InteresetProfile";
import MatchingUsers from "./Components/MatchingUsers";
import ConnectionRequests from "./Components/ConnectionRequests";
import Connections from "./Components/Connections";
import Navbar from "./Components/Navbar";
import { ReactNotifications } from "react-notifications-component";
import { ChatProvider } from "./Components/ChatContext";
import "react-notifications-component/dist/theme.css";
import "./index.css";

const ProtectedRoute = ({ children }) => {
  const isAuthenticated = localStorage.getItem("token") !== null;
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

function AppContent() {
  const location = useLocation();
  const hideNavbar = ["/login", "/signup"].includes(location.pathname);

  return (
    <>
      {!hideNavbar && <Navbar />} {/* ✅ No more props needed */}

      <Routes>
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />

        <Route path="/map" element={<ProtectedRoute><Map /></ProtectedRoute>} />
        <Route path="/matches" element={<ProtectedRoute><MatchingUsers /></ProtectedRoute>} />
        <Route path="/requests" element={<ProtectedRoute><ConnectionRequests /></ProtectedRoute>} />
        <Route path="/connections" element={<ProtectedRoute><Connections /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><InterestsProfile /></ProtectedRoute>} />
        <Route path="/profile/:id" element={<ProtectedRoute><InterestProfile /></ProtectedRoute>} />

        <Route path="*" element={<Signup />} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <Router>
      <ReactNotifications />
      <ChatProvider>
        <AppContent />
      </ChatProvider>
    </Router>
  );
}

export default App;
