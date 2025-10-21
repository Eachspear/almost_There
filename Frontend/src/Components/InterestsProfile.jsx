import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Store } from "react-notifications-component";
import Navbar from "./Navbar";
import { Plus, X, Save } from "lucide-react";
import "./styles/InterestsProfile.css";

function InterestsProfile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState({ interests: [], activities: [], bio: "" });
  const [newInterest, setNewInterest] = useState("");
  const [newActivity, setNewActivity] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const interestSuggestions = [
    "Technology", "Music", "Reading", "Travel", "Sports", "Coding", "Gaming",
    "Photography", "Art", "Fitness", "Movies", "Cooking", "Volunteering", "Design", "Innovation"
  ];

  const activitySuggestions = [
    "Coffee", "Lunch", "Hackathon", "Workshop", "Study Session", "Gym",
    "Seminar", "Team Project", "Networking", "Open Mic", "Walk", "Conference"
  ];

  useEffect(() => { fetchUserProfile(); }, []);

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return navigate("/login");

      const { data } = await axios.get("http://localhost:8500/interests/", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (data.profile) {
        setProfile({
          interests: data.profile.interests || [],
          activities: data.profile.activities || [],
          bio: data.profile.bio || "",
        });
      }
    } catch (err) {
      console.error(err);
      Store.addNotification({
        title: "Error",
        message: "Failed to load your profile.",
        type: "danger",
        insert: "top",
        container: "top-right",
        dismiss: { duration: 3000 },
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      const token = localStorage.getItem("token");

      await axios.post("http://localhost:8500/interests/update", profile, {
        headers: { Authorization: `Bearer ${token}` },
      });

      Store.addNotification({
        title: "Success",
        message: "Profile updated successfully!",
        type: "success",
        insert: "top",
        container: "top-right",
        dismiss: { duration: 2000 },
      });
    } catch (err) {
      console.error(err);
      Store.addNotification({
        title: "Error",
        message: "Failed to save your profile.",
        type: "danger",
        insert: "top",
        container: "top-right",
        dismiss: { duration: 3000 },
      });
    } finally {
      setSaving(false);
    }
  };

  const addItem = (type, value) => {
    if (!value.trim()) return;
    setProfile((prev) => ({
      ...prev,
      [type]: [...new Set([...prev[type], value])],
    }));
    type === "interests" ? setNewInterest("") : setNewActivity("");
  };

  const removeItem = (type, value) => {
    setProfile((prev) => ({
      ...prev,
      [type]: prev[type].filter((i) => i !== value),
    }));
  };

  if (loading)
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50 flex flex-col">
        <Navbar />
        <div className="flex justify-center items-center flex-grow">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-orange-500 border-opacity-70"></div>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50 flex flex-col font-sans">
      <Navbar />
      <div className="container mx-auto max-w-3xl px-6 py-10 mt-16">
        <div className="profile-card bg-white/80 backdrop-blur-lg rounded-3xl shadow-[0_8px_30px_rgba(249,115,22,0.1)] border border-orange-100 p-10 transition-all duration-500 hover:shadow-[0_8px_40px_rgba(249,115,22,0.2)]">
          
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-extrabold text-orange-600 tracking-tight">My Profile</h1>
            <button
              onClick={handleSaveProfile}
              disabled={saving}
              className={`save-button flex items-center gap-2 px-6 py-2 text-white font-semibold rounded-full transition-all duration-300 ${
                saving ? "opacity-60 cursor-not-allowed" : "hover:scale-[1.03]"
              }`}
            >
              {saving ? (
                <div className="flex items-center">
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                  Saving...
                </div>
              ) : (
                <>
                  <Save size={18} />
                  Save
                </>
              )}
            </button>
          </div>

          {/* Bio */}
          <div className="mb-10">
            <label className="section-title block mb-2">About Me</label>
            <textarea
              value={profile.bio}
              onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
              placeholder="Share a little about yourself..."
              rows={4}
              className="w-full p-4 border border-orange-100 rounded-xl focus:ring-2 focus:ring-orange-300 focus:border-orange-400 bg-orange-50/40 placeholder:text-gray-400 text-gray-800 transition-all duration-300"
            />
          </div>

          {/* Interests */}
          <div className="mb-10">
            <label className="section-title block mb-2">My Interests</label>
            <div className="flex flex-wrap gap-2 mb-3">
              {profile.interests.map((interest) => (
                <span
                  key={interest}
                  className="interest-chip bg-gradient-to-r from-amber-100 to-orange-100 text-orange-800 px-3 py-1 rounded-full flex items-center shadow-sm"
                >
                  {interest}
                  <button
                    onClick={() => removeItem("interests", interest)}
                    className="remove-icon ml-2 hover:text-orange-600"
                  >
                    <X size={14} />
                  </button>
                </span>
              ))}
            </div>

            <div className="flex mb-3">
              <input
                type="text"
                value={newInterest}
                onChange={(e) => setNewInterest(e.target.value)}
                placeholder="Add an interest..."
                className="flex-grow p-3 border border-orange-100 rounded-l-xl focus:ring-2 focus:ring-orange-200 focus:border-orange-400 bg-white text-gray-700"
              />
              <button
                onClick={() => addItem("interests", newInterest)}
                className="add-button bg-gradient-to-r from-orange-500 to-amber-400 text-white px-4 rounded-r-xl hover:from-orange-600 hover:to-amber-500 flex items-center transition-all duration-300"
              >
                <Plus size={18} />
              </button>
            </div>

            <p className="text-sm text-gray-500 mb-2">Suggestions:</p>
            <div className="flex flex-wrap gap-2">
              {interestSuggestions
                .filter((s) => !profile.interests.includes(s))
                .slice(0, 8)
                .map((s) => (
                  <button
                    key={s}
                    onClick={() => addItem("interests", s)}
                    className="suggestion-button bg-white border border-amber-200 hover:bg-amber-50 text-amber-700 px-3 py-1 rounded-full text-sm transition-all duration-300"
                  >
                    {s}
                  </button>
                ))}
            </div>
          </div>

          {/* Activities */}
          <div>
            <label className="section-title block mb-2">Activities I’d Enjoy</label>
            <div className="flex flex-wrap gap-2 mb-3">
              {profile.activities.map((activity) => (
                <span
                  key={activity}
                  className="interest-chip bg-gradient-to-r from-orange-100 to-amber-100 text-amber-800 px-3 py-1 rounded-full flex items-center shadow-sm"
                >
                  {activity}
                  <button
                    onClick={() => removeItem("activities", activity)}
                    className="remove-icon ml-2 hover:text-amber-600"
                  >
                    <X size={14} />
                  </button>
                </span>
              ))}
            </div>

            <div className="flex mb-3">
              <input
                type="text"
                value={newActivity}
                onChange={(e) => setNewActivity(e.target.value)}
                placeholder="Add an activity..."
                className="flex-grow p-3 border border-amber-100 rounded-l-xl focus:ring-2 focus:ring-amber-200 focus:border-amber-400 bg-white text-gray-700"
              />
              <button
                onClick={() => addItem("activities", newActivity)}
                className="add-button bg-gradient-to-r from-amber-400 to-orange-500 text-white px-4 rounded-r-xl hover:from-amber-500 hover:to-orange-600 flex items-center transition-all duration-300"
              >
                <Plus size={18} />
              </button>
            </div>

            <p className="text-sm text-gray-500 mb-2">Suggestions:</p>
            <div className="flex flex-wrap gap-2">
              {activitySuggestions
                .filter((s) => !profile.activities.includes(s))
                .slice(0, 8)
                .map((s) => (
                  <button
                    key={s}
                    onClick={() => addItem("activities", s)}
                    className="suggestion-button bg-white border border-orange-200 hover:bg-orange-50 text-orange-700 px-3 py-1 rounded-full text-sm transition-all duration-300"
                  >
                    {s}
                  </button>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default InterestsProfile;
