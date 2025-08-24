import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import React from "react";
import { Store } from "react-notifications-component";
import "react-notifications-component/dist/theme.css";

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
      const response = await axios.post("http://localhost:8500/user/signup", formData);

      if (response.status === 201) {
        Store.addNotification({
          title: "Account Created!",
          message: "You're all set 🎉",
          type: "success",
          insert: "top",
          container: "top-right",
          animationIn: ["animate__animated", "animate__fadeIn"],
          animationOut: ["animate__animated", "animate__fadeOut"],
          dismiss: {
            duration: 2000,
            onScreen: true,
          },
        });

        setTimeout(() => {
          navigate("/login");
        }, 2000);
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
          Create an Account
        </h2>
        <p className="text-center text-sm text-gray-600 mt-1">
          Join and start exploring
        </p>

        <form className="mt-6" onSubmit={handleSubmit}>
          <input
            type="text"
            name="name"
            placeholder="Your name"
            value={formData.name}
            onChange={handleChange}
            className="w-full p-3 mb-4 border border-pink-200 rounded-2xl focus:ring-2 focus:ring-pink-400"
            required
          />
          <input
            type="text"
            name="UserName"
            placeholder="Username"
            value={formData.UserName}
            onChange={handleChange}
            className="w-full p-3 mb-4 border border-pink-200 rounded-2xl focus:ring-2 focus:ring-pink-400"
            required
          />
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
            placeholder="Create password"
            value={formData.password}
            onChange={handleChange}
            className="w-full p-3 mb-4 border border-pink-200 rounded-2xl focus:ring-2 focus:ring-pink-400"
            required
          />

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full bg-rose-500 text-white py-3 rounded-2xl font-semibold transition 
              ${isLoading ? "opacity-70 cursor-not-allowed" : "hover:bg-rose-600"}`}
          >
            {isLoading ? (
              <span className="flex justify-center items-center">
                <svg className="w-5 h-5 mr-2 animate-spin" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4" />
                  <path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Creating account...
              </span>
            ) : (
              "Sign Up"
            )}
          </button>
        </form>

        <p className="text-center text-sm text-gray-700 mt-6">
          Already have an account?{" "}
          <Link to="/login" className="text-rose-500 font-medium hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Signup;
