import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import React from "react";
import { Store } from "react-notifications-component";
import "react-notifications-component/dist/theme.css";
import "./styles/Signup.css";

function Signup() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    UserName: "",
    email: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await axios.post("https://backend-3ex6nbvuga-el.a.run.app/user/signup", formData);

      if (response.status === 201) {
        Store.addNotification({
          title: "Welcome aboard!",
          message: "Your account has been created 🌿",
          type: "success",
          insert: "top",
          container: "top-right",
          animationIn: ["animate__animated", "animate__fadeIn"],
          animationOut: ["animate__animated", "animate__fadeOut"],
          dismiss: { duration: 2000, onScreen: true },
        });

        setTimeout(() => navigate("/login"), 2000);
      }
    } catch (error) {
      console.error("Signup error:", error.response?.data || error.message);
      Store.addNotification({
        title: "Signup Failed",
        message: error.response?.data?.error || "Please try again",
        type: "danger",
        insert: "top",
        container: "top-right",
        animationIn: ["animate__animated", "animate__fadeIn"],
        animationOut: ["animate__animated", "animate__fadeOut"],
        dismiss: { duration: 3000, onScreen: true },
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="signup-bg min-h-screen flex items-center justify-center">
      <div className="signup-card">
        <h2 className="signup-title">Create Your Account 🌿</h2>
        <p className="signup-subtitle">Join and start connecting with others</p>

        <form className="mt-6" onSubmit={handleSubmit}>
          <input
            type="text"
            name="name"
            placeholder="Full Name"
            value={formData.name}
            onChange={handleChange}
            className="signup-input"
            required
          />
          <input
            type="text"
            name="UserName"
            placeholder="Username"
            value={formData.UserName}
            onChange={handleChange}
            className="signup-input"
            required
          />
          <input
            type="email"
            name="email"
            placeholder="Email Address"
            value={formData.email}
            onChange={handleChange}
            className="signup-input"
            required
          />
          <input
            type="password"
            name="password"
            placeholder="Create Password"
            value={formData.password}
            onChange={handleChange}
            className="signup-input"
            required
          />

          <button
            type="submit"
            disabled={isLoading}
            className={`signup-btn ${isLoading ? "disabled" : ""}`}
          >
            {isLoading ? (
              <span className="flex justify-center items-center">
                <svg
                  className="w-5 h-5 mr-2 animate-spin"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="white"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="white"
                    d="M4 12a8 8 0 018-8v8H4z"
                  ></path>
                </svg>
                Creating account...
              </span>
            ) : (
              "Sign Up"
            )}
          </button>
        </form>

        <p className="signup-footer">
          Already have an account?{" "}
          <Link to="/login" className="signup-link">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Signup;
