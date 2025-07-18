import React, { useState } from "react";
import "../styles.css";

const UnlockScreen = ({ onUnlock, onReset }) => {
  const [password, setPassword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    onUnlock(password);
  };

  return (
    <div className="unlock-screen">
      <div className="unlock-container">
        <h2 className="vault-heading">🔐 Unlock Your Vault</h2>
        <form onSubmit={handleSubmit} className="unlock-form">
          <input
            type="password"
            placeholder="Enter master password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="unlock-input"
          />
          <button type="submit" className="neon-unlock-button">
            Unlock
          </button>
        </form>
        <button className="reset-button" onClick={onReset}>
          Reset Master Password
        </button>
      </div>
    </div>
  );
};

export default UnlockScreen;
