import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Store } from "react-notifications-component";
import Navbar from "./Navbar";
import { Plus, X, Save } from "lucide-react";

function InterestsProfile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState({
    interests: [],
    activities: [],
    bio: "",
  });
  const [newInterest, setNewInterest] = useState("");
  const [newActivity, setNewActivity] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [interestSuggestions] = useState([
    "Music", "Movies", "Reading", "Travel", "Sports",
    "Cooking", "Gaming", "Photography", "Art", "Hiking",
    "Fitness", "Dance", "Technology", "Fashion", "Pets",
  ]);
  const [activitySuggestions] = useState([
    "Coffee", "Lunch", "Dinner", "Walk", "Hiking",
    "Movie Night", "Concert", "Study", "Gym", "Shopping",
    "Beach Day", "Game Night", "Museum Visit", "Sports Event", "Happy Hour",
  ]);

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      const response = await axios.get("http://localhost:8500/interests/", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.profile) {
        setProfile({
          interests: response.data.profile.interests || [],
          activities: response.data.profile.activities || [],
          bio: response.data.profile.bio || "",
        });
      }
      setLoading(false);
    } catch (error) {
      console.error("Error fetching profile:", error);
      setLoading(false);
      Store.addNotification({
        title: "Error",
        message: "Failed to load profile data",
        type: "danger",
        insert: "top",
        container: "top-right",
        animationIn: ["animate__animated", "animate__fadeIn"],
        animationOut: ["animate__animated", "animate__fadeOut"],
        dismiss: { duration: 3000 },
      });
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
        message: "Your profile has been updated",
        type: "success",
        insert: "top",
        container: "top-right",
        animationIn: ["animate__animated", "animate__fadeIn"],
        animationOut: ["animate__animated", "animate__fadeOut"],
        dismiss: { duration: 2000 },
      });
    } catch (error) {
      console.error("Error saving profile:", error);
      Store.addNotification({
        title: "Error",
        message: "Failed to save profile",
        type: "danger",
        insert: "top",
        container: "top-right",
        animationIn: ["animate__animated", "animate__fadeIn"],
        animationOut: ["animate__animated", "animate__fadeOut"],
        dismiss: { duration: 3000 },
      });
    } finally {
      setSaving(false);
    }
  };

  const addInterest = () => {
    if (newInterest && !profile.interests.includes(newInterest)) {
      setProfile({ ...profile, interests: [...profile.interests, newInterest] });
      setNewInterest("");
    }
  };

  const removeInterest = (interest) => {
    setProfile({
      ...profile,
      interests: profile.interests.filter((item) => item !== interest),
    });
  };

  const addActivity = () => {
    if (newActivity && !profile.activities.includes(newActivity)) {
      setProfile({ ...profile, activities: [...profile.activities, newActivity] });
      setNewActivity("");
    }
  };

  const removeActivity = (activity) => {
    setProfile({
      ...profile,
      activities: profile.activities.filter((item) => item !== activity),
    });
  };

  const handleBioChange = (e) => {
    setProfile({ ...profile, bio: e.target.value });
  };

  const addSuggestion = (suggestion, type) => {
    if (type === "interest") {
      if (!profile.interests.includes(suggestion)) {
        setProfile({ ...profile, interests: [...profile.interests, suggestion] });
      }
    } else {
      if (!profile.activities.includes(suggestion)) {
        setProfile({ ...profile, activities: [...profile.activities, suggestion] });
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white flex flex-col">
        <Navbar />
        <div className="flex justify-center items-center flex-grow">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-pink-500 border-opacity-70"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white flex flex-col font-sans">
      <Navbar />
      <div className="container mx-auto max-w-3xl px-6 py-8 mt-16">
        <div className="bg-white rounded-3xl shadow-xl p-10 mb-10 border border-pink-100">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-extrabold text-pink-600">My Profile</h1>
            <button
              onClick={handleSaveProfile}
              disabled={saving}
              className={`flex items-center gap-2 px-6 py-2 bg-pink-500 text-white font-semibold rounded-full hover:bg-pink-600 transition shadow-lg ${
                saving ? "opacity-60 cursor-not-allowed" : ""
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
                  Save Profile
                </>
              )}
            </button>
          </div>

          {/* Bio Section */}
          <div className="mb-8">
            <label className="block text-pink-600 font-medium mb-2">About Me</label>
            <textarea
              value={profile.bio}
              onChange={handleBioChange}
              placeholder="Tell others about yourself..."
              className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-300 focus:border-pink-500 bg-pink-50 placeholder:text-pink-400 text-pink-800"
              rows={4}
            />
          </div>

          {/* Interests */}
          <div className="mb-8">
            <label className="block text-pink-600 font-medium mb-2">My Interests</label>
            <div className="flex flex-wrap gap-2 mb-3">
              {profile.interests.map((interest, index) => (
                <div key={index} className="bg-pink-100 text-pink-800 px-3 py-1 rounded-full flex items-center shadow-sm">
                  {interest}
                  <button onClick={() => removeInterest(interest)} className="ml-2 text-pink-500 hover:text-pink-700">
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex mb-3">
              <input
                type="text"
                value={newInterest}
                onChange={(e) => setNewInterest(e.target.value)}
                placeholder="Add an interest..."
                className="flex-grow p-3 border border-gray-200 rounded-l-xl focus:ring-2 focus:ring-pink-200 focus:border-pink-400 bg-white text-pink-800"
              />
              <button
                onClick={addInterest}
                className="bg-pink-500 text-white px-4 rounded-r-xl hover:bg-pink-600 flex items-center"
              >
                <Plus size={18} />
              </button>
            </div>
            <p className="text-sm text-pink-400 mb-2">Suggestions:</p>
            <div className="flex flex-wrap gap-2">
              {interestSuggestions
                .filter((s) => !profile.interests.includes(s))
                .slice(0, 8)
                .map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => addSuggestion(suggestion, "interest")}
                    className="bg-pink-50 hover:bg-pink-100 text-pink-600 px-3 py-1 rounded-full text-sm border border-pink-200 transition"
                  >
                    {suggestion}
                  </button>
                ))}
            </div>
          </div>

          {/* Activities */}
          <div>
            <label className="block text-purple-600 font-medium mb-2">Activities I'd Enjoy</label>
            <div className="flex flex-wrap gap-2 mb-3">
              {profile.activities.map((activity, index) => (
                <div key={index} className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full flex items-center shadow-sm">
                  {activity}
                  <button onClick={() => removeActivity(activity)} className="ml-2 text-purple-500 hover:text-purple-700">
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex mb-3">
              <input
                type="text"
                value={newActivity}
                onChange={(e) => setNewActivity(e.target.value)}
                placeholder="Add an activity..."
                className="flex-grow p-3 border border-gray-200 rounded-l-xl focus:ring-2 focus:ring-purple-200 focus:border-purple-400 bg-white text-purple-800"
              />
              <button
                onClick={addActivity}
                className="bg-purple-500 text-white px-4 rounded-r-xl hover:bg-purple-600 flex items-center"
              >
                <Plus size={18} />
              </button>
            </div>
            <p className="text-sm text-purple-400 mb-2">Suggestions:</p>
            <div className="flex flex-wrap gap-2">
              {activitySuggestions
                .filter((s) => !profile.activities.includes(s))
                .slice(0, 8)
                .map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => addSuggestion(suggestion, "activity")}
                    className="bg-purple-50 hover:bg-purple-100 text-purple-600 px-3 py-1 rounded-full text-sm border border-purple-200 transition"
                  >
                    {suggestion}
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
