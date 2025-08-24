import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import React from "react";
import axios from "axios";
import { Store } from "react-notifications-component";
import "react-notifications-component/dist/theme.css";

function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await axios.post("http://localhost:8500/user/login", {
        email: formData.email,
        password: formData.password,
      });

      if (response.status === 200) {
        localStorage.setItem("token", response.data.token);
        console.log("Token stored:", localStorage.getItem("token"));

        Store.addNotification({
          title: "Welcome back!",
          message: "You're logged in 🎉",
          type: "success",
          insert: "top",
          container: "top-right",
          animationIn: ["animate__animated", "animate__fadeIn"],
          animationOut: ["animate__animated", "animate__fadeOut"],
          dismiss: {
            duration: 1500,
            onScreen: true,
          },
        });

        setTimeout(() => {
          navigate("/map");
        }, 1500);
      }
    } catch (error) {
      console.error("Login error:", error.response?.data || error.message);

      Store.addNotification({
        title: "Oops!",
        message: error.response?.data?.error || "Invalid email or password",
        type: "danger",
        insert: "top",
        container: "top-right",
        animationIn: ["animate__animated", "animate__fadeIn"],
        animationOut: ["animate__animated", "animate__fadeOut"],
        dismiss: {
          duration: 3000,
          onScreen: true,
        },
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-pink-100 via-rose-100 to-indigo-100">
      <div className="bg-white/80 backdrop-blur-md p-8 rounded-3xl shadow-xl w-full max-w-md border border-rose-200">
        <h2 className="text-3xl font-bold text-center text-rose-500 font-[Poppins]">
          Log in to Continue
        </h2>
        <p className="text-center text-sm text-gray-600 mt-1">Connect with people near you</p>

        <form className="mt-6" onSubmit={handleSubmit}>
          <input
            type="email"
            name="email"
            placeholder="Email address"
            value={formData.email}
            onChange={handleChange}
            className="w-full p-3 mb-4 border border-pink-200 rounded-2xl focus:ring-2 focus:ring-pink-400"
            required
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            className="w-full p-3 mb-4 border border-pink-200 rounded-2xl focus:ring-2 focus:ring-pink-400"
            required
          />

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full bg-rose-500 text-white py-3 rounded-2xl font-semibold transition 
              ${isLoading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-rose-600'}`}
          >
            {isLoading ? (
              <span className="flex justify-center items-center">
                <svg className="w-5 h-5 mr-2 animate-spin" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8v8H4z"></path>
                </svg>
                Logging in...
              </span>
            ) : (
              'Log In'
            )}
          </button>
        </form>

        <p className="text-center text-sm text-gray-700 mt-6">
          New here? <Link to="/signup" className="text-rose-500 font-medium hover:underline">Sign up</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
