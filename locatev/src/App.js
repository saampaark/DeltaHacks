import React from "react";
import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import LoginPage from "./LoginPage";
import HomePage from "./HomePage";

function App() {
  return (
    <Router>
      <Routes>
        {/* Login page route */}
        <Route path="/login" element={<LoginPage />} />

        {/* Home page route */}
        <Route path="/home" element={<HomePage />} />

        {/* Default route: Redirect to login */}
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;