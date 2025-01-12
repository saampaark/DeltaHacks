import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./AuthPage.css";

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    vehicleModel: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [id]: value
    }));
  };

  const validateForm = () => {
    if (isLogin) {
      if (!formData.email || !formData.password) {
        setError("Please fill out all fields.");
        return false;
      }
    } else {
      if (!formData.name || !formData.vehicleModel || !formData.email || 
          !formData.password || !formData.confirmPassword) {
        setError("Please fill out all fields.");
        return false;
      }
      if (formData.password !== formData.confirmPassword) {
        setError("Passwords do not match.");
        return false;
      }
    }

    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      setError("Please enter a valid email.");
      return false;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return false;
    }

    return true;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    if (!validateForm()) return;

    if (isLogin) {
      // Simulate login success (Replace with actual authentication logic)
      console.log("Logged in with:", { 
        email: formData.email, 
        password: formData.password 
      });
      alert("Login successful!");
    } else {
      // Simulate registration success (Replace with actual registration logic)
      console.log("Registered new account:", formData);
      alert("Registration successful! Please log in.");
      setIsLogin(true);
      setFormData({
        name: "",
        vehicleModel: "",
        email: "",
        password: "",
        confirmPassword: ""
      });
      return;
    }

    navigate("/home");
  };

  return (
    <div className="auth-container">
      <h2>{isLogin ? "Login" : "Create Account"}</h2>
      {error && <p className="error">{error}</p>}
      
      <form onSubmit={handleSubmit}>
        {!isLogin && (
          <>
            <div className="form-group">
              <label htmlFor="name">Full Name:</label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter your full name"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="vehicleModel">Vehicle Model:</label>
              <input
                type="text"
                id="vehicleModel"
                value={formData.vehicleModel}
                onChange={handleInputChange}
                placeholder="Enter your vehicle model"
              />
            </div>
          </>
        )}

        <div className="form-group">
          <label htmlFor="email">Email:</label>
          <input
            type="email"
            id="email"
            value={formData.email}
            onChange={handleInputChange}
            placeholder="Enter your email"
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">Password:</label>
          <input
            type="password"
            id="password"
            value={formData.password}
            onChange={handleInputChange}
            placeholder="Enter your password"
          />
        </div>

        {!isLogin && (
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password:</label>
            <input
              type="password"
              id="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              placeholder="Confirm your password"
            />
          </div>
        )}

        <button type="submit" className="auth-button">
          {isLogin ? "Login" : "Create Account"}
        </button>
      </form>

      <p className="toggle-form">
        {isLogin ? "Don't have an account? " : "Already have an account? "}
        <button
          className="toggle-button"
          onClick={() => {
            setIsLogin(!isLogin);
            setError("");
            setFormData({
              name: "",
              vehicleModel: "",
              email: "",
              password: "",
              confirmPassword: ""
            });
          }}
        >
          {isLogin ? "Create one" : "Login"}
        </button>
      </p>
    </div>
  );
};

export default AuthPage;
