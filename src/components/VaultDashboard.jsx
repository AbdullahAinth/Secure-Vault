import React, { useState } from "react";
import Modal from "./Modal";

const VaultDashboard = ({
  notes,
  passwords,
  files,
  onAddNote,
  onEditNote,
  onDeleteNote,
  onAddPassword,
  onDeletePassword,
  onAddFile,
  onDeleteFile,
  showToast
}) => {
  const [newNote, setNewNote] = useState("");
  const [newPassword, setNewPassword] = useState({
    title: "",
    username: "",
    password: ""
  });
  const [visiblePasswords, setVisiblePasswords] = useState({});
  const [activeTab, setActiveTab] = useState("notes");
  const [modalOpen, setModalOpen] = useState(false);
  const [editNoteText, setEditNoteText] = useState("");
  const [editingNoteIndex, setEditingNoteIndex] = useState(null);
  const [passwordLength, setPasswordLength] = useState(12);
  const [generatedPasswords, setGeneratedPasswords] = useState([]);

  const handleAddNote = () => {
    if (newNote.trim() === "") {
      showToast("Note cannot be empty");
      return;
    }
    onAddNote(newNote);
    showToast("Note added");
    setNewNote("");
  };

  const handleAddPassword = () => {
    const { title, username, password } = newPassword;
    if (!title || !username || !password) {
      showToast("Please fill all password fields");
      return;
    }
    onAddPassword(newPassword);
    showToast("Password added");
    setNewPassword({ title: "", username: "", password: "" });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      onAddFile(file);
      showToast("File added");
    }
    e.target.value = null;
  };

  const handleFileDownload = (file) => {
    const url = URL.createObjectURL(file.blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = file.name;
    link.click();
    URL.revokeObjectURL(url);
    showToast("File download started");
  };

  const togglePasswordVisibility = (fieldKey) => {
    setVisiblePasswords((prev) => ({
      ...prev,
      [fieldKey]: !prev[fieldKey]
    }));
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    showToast("Copied to clipboard!");
  };

  const openEditModal = (idx) => {
    setEditingNoteIndex(idx);
    setEditNoteText(notes[idx].text);
    setModalOpen(true);
  };

  const handleModalSave = () => {
    if (editNoteText.trim() !== "") {
      onEditNote(editingNoteIndex, editNoteText);
      showToast("Note updated");
    } else {
      showToast("Note cannot be empty");
    }
    setModalOpen(false);
  };

  const generatePassword = () => {
    const charset =
      "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()-_=+[]{}";
    let result = "";
    for (let i = 0; i < passwordLength; i++) {
      result += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    const timestamp = new Date().toLocaleTimeString();
    setGeneratedPasswords((prev) => [
      { password: result, time: timestamp },
      ...prev
    ]);
    copyToClipboard(result);
  };

  return (
    <div className="vault-dashboard">
      <h2>🔐 Your Vault</h2>
      <div className="tabs">
        {["notes", "passwords", "files", "tools"].map((tab) => (
          <button
            key={tab}
            className={`tab-button ${activeTab === tab ? "active" : ""}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === "notes" && "📝 Notes"}
            {tab === "passwords" && "🔑 Passwords"}
            {tab === "files" && "📁 Files"}
            {tab === "tools" && "🛠️ Password Tools"}
          </button>
        ))}
      </div>

      {activeTab === "notes" && (
        <div className="vault-section">
          <div className="note-input">
            <h3>📓 Add a Secure Note</h3>
            <textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Type your secret note..."
            />
            <button className="add-note-button" onClick={handleAddNote}>Add Note</button>
          </div>

          <div className="vault-cards">
            {notes?.length > 0 ? (
              notes.map((note, idx) => (
                <div key={idx} className="card">
                  <div className="card-body">{note.text}</div>
                  <div className="card-buttons">
                    <button className="edit-button" onClick={() => openEditModal(idx)}>✏️</button>
                    <button onClick={() => {
                      onDeleteNote(idx);
                      showToast("Note deleted");
                    }}>🗑️</button>
                  </div>
                </div>
              ))
            ) : (
              <p>No notes saved yet.</p>
            )}
          </div>
        </div>
      )}

      {activeTab === "passwords" && (
        <div className="vault-section">
          <div className="note-input add-password-form">
            <h3>🔑 Add a Password</h3>
            <input
              type="text"
              placeholder="Website/App"
              value={newPassword.title}
              onChange={(e) =>
                setNewPassword({ ...newPassword, title: e.target.value })
              }
            />
            <input
              type="text"
              placeholder="Username/Email"
              value={newPassword.username}
              onChange={(e) =>
                setNewPassword({ ...newPassword, username: e.target.value })
              }
            />
            <input
              type="password"
              placeholder="Password"
              value={newPassword.password}
              onChange={(e) =>
                setNewPassword({ ...newPassword, password: e.target.value })
              }
            />
            <button onClick={handleAddPassword}>Add Password</button>
          </div>

          <div className="vault-cards">
            {passwords?.length > 0 ? (
              passwords.map((entry, idx) => (
                <div key={idx} className="card">
                  <div><strong>{entry.title}</strong></div>

                  <div className="field-row">
                    <span>
                      <strong>User:</strong> {visiblePasswords[`user-${idx}`] ? entry.username : "••••••••"}
                    </span>
                    <div className="card-buttons">
                      <button
                        className="eye-icon"
                        onClick={() => togglePasswordVisibility(`user-${idx}`)}
                        title="Toggle visibility"
                      >
                        {visiblePasswords[`user-${idx}`] ? "🙈" : "👁️"}
                      </button>
                      <button
                        className="copy-button"
                        onClick={() => copyToClipboard(entry.username)}
                        title="Copy username"
                      >
                        📋
                      </button>
                    </div>
                  </div>

                  <div className="field-row">
                    <span>
                      <strong>Password:</strong> {visiblePasswords[`pass-${idx}`] ? entry.password : "••••••••"}
                    </span>
                    <div className="card-buttons">
                      <button
                        className="eye-icon"
                        onClick={() => togglePasswordVisibility(`pass-${idx}`)}
                        title="Toggle visibility"
                      >
                        {visiblePasswords[`pass-${idx}`] ? "🙈" : "👁️"}
                      </button>
                      <button
                        className="copy-button"
                        onClick={() => copyToClipboard(entry.password)}
                        title="Copy password"
                      >
                        📋
                      </button>
                    </div>
                  </div>

                  <div className="card-buttons">
                    <button onClick={() => {
                      onDeletePassword(idx);
                      showToast("Password deleted");
                    }}>🗑️</button>
                  </div>
                </div>
              ))
            ) : (
              <p>No passwords saved yet.</p>
            )}
          </div>
        </div>
      )}

      {activeTab === "files" && (
        <div className="vault-section">
          <div className="note-input">
            <h3>📁 Add a File</h3>
            <input type="file" onChange={handleFileChange} />
          </div>

          <div className="vault-cards">
            {files?.length > 0 ? (
              files.map((file, idx) => (
                <div key={idx} className="card">
                  <div>{file.name}</div>
                  <div className="card-buttons">
                    <button onClick={() => handleFileDownload(file)}>
                      ⬇️
                    </button>
                    <button onClick={() => {
                      onDeleteFile(file.id);
                      showToast("File deleted");
                    }}>
                      🗑️
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p>No files uploaded yet.</p>
            )}
          </div>
        </div>
      )}

      {activeTab === "tools" && (
        <div className="tools-tab">
          <h3>🔧 Generate Secure Password</h3>
          <div className="tools-controls">
            <label>
              Length:
              <input
                type="number"
                min={6}
                max={32}
                value={passwordLength}
                onChange={(e) => setPasswordLength(Number(e.target.value))}
              />
            </label>
            <button onClick={generatePassword}>Generate & Copy</button>
          </div>
          <h4>🕘 Generated Password History</h4>
          <ul className="generated-list">
            {generatedPasswords.map((item, idx) => (
              <li key={idx}>
                <span className="mono">{item.password}</span>{" "}
                <small>({item.time})</small>
                <button onClick={() => copyToClipboard(item.password)}>
                  📋
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <Modal
        isOpen={modalOpen}
        title="Edit Note"
        content={
          <textarea
            value={editNoteText}
            onChange={(e) => setEditNoteText(e.target.value)}
            placeholder="Edit your note..."
            style={{ width: "100%", height: "100px", padding: "10px" }}
          />
        }
        onCancel={() => setModalOpen(false)}
        onSave={handleModalSave}
      />
    </div>
  );
};

export default VaultDashboard;
