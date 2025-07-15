// src/components/UnlockScreen.jsx
import React, { useState } from "react";
import "../styles.css";

const UnlockScreen = ({ onUnlock }) => {
  const [password, setPassword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (password.trim()) {
      onUnlock(password);
      setPassword("");
    }
  };

  return (
    <div className="unlock-screen">
      <h2>🔐 Unlock Your Vault</h2>
      <form onSubmit={handleSubmit} className="unlock-form">
        <input
          type="password"
          placeholder="Enter master password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="unlock-input"
        />
        <button type="submit" className="unlock-btn">
          Unlock
        </button>
      </form>
    </div>
  );
};

export default UnlockScreen;
