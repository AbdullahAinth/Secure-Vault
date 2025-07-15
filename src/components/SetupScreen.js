// src/components/SetupScreen.jsx
import React, { useState } from "react";
import "../styles.css";

const SetupScreen = ({ onCreatePassword }) => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    onCreatePassword(password);
    setPassword("");
    setConfirmPassword("");
    setError("");
  };

  return (
    <div className="unlock-screen">
      <h2>🔐 First-Time Setup</h2>
      <form onSubmit={handleSubmit} className="unlock-form">
        <input
          type="password"
          placeholder="Create master password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="unlock-input"
        />
        <input
          type="password"
          placeholder="Confirm master password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="unlock-input"
        />
        {error && <p style={{ color: "salmon" }}>{error}</p>}
        <button type="submit" className="unlock-btn">
          Set Master Password
        </button>
      </form>
    </div>
  );
};

export default SetupScreen;
