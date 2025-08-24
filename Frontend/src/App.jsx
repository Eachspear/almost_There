import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Signup from "./Components/Signup";
import Login from "./Components/Login";
import Map from "./Components/Map";
import InterestsProfile from "./Components/InterestsProfile";
import MatchingUsers from "./Components/MatchingUsers";
import ConnectionRequests from './Components/ConnectionRequests';
import Connections from './Components/Connections';

import React from "react";
import { ReactNotifications } from "react-notifications-component";
import "react-notifications-component/dist/theme.css";
import './index.css';
const ProtectedRoute = ({ children }) => {
  const isAuthenticated = localStorage.getItem('token') !== null;
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};
function App() {
  return (
    <Router>
      <ReactNotifications />
      <div>
        <Routes>
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<Login />} />

          <Route path="/map" element={<ProtectedRoute><Map/></ProtectedRoute>} />
          <Route path="/matches" element={<ProtectedRoute><MatchingUsers /></ProtectedRoute>} /> 
          <Route path="/requests" element={<ProtectedRoute><ConnectionRequests /></ProtectedRoute>} />
{/* Updated Navbar with Connections Link */}
          <Route path="/connections" element={<ProtectedRoute><Connections /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><InterestsProfile /></ProtectedRoute>} />
          <Route path="*" element={<Signup />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;