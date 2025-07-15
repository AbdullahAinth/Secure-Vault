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
  showToast // ✅ Accept showToast as a prop
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

  const handleAddNote = () => {
    if (newNote.trim() === "") return;
    onAddNote(newNote);
    setNewNote("");
  };

  const handleAddPassword = () => {
    const { title, username, password } = newPassword;
    if (!title || !username || !password) return;
    onAddPassword(newPassword);
    setNewPassword({ title: "", username: "", password: "" });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) onAddFile(file);
    e.target.value = null;
  };

  const handleFileDownload = (file) => {
    const url = URL.createObjectURL(file.blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = file.name;
    link.click();
    URL.revokeObjectURL(url);
  };

  const togglePasswordVisibility = (idx) => {
    setVisiblePasswords((prev) => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    if (showToast) showToast("Password copied to clipboard!"); // ✅ replaced alert
  };

  const openEditModal = (idx) => {
    setEditingNoteIndex(idx);
    setEditNoteText(notes[idx].text);
    setModalOpen(true);
  };

  const handleModalSave = () => {
    if (editNoteText.trim() !== "") {
      onEditNote(editingNoteIndex, editNoteText);
    }
    setModalOpen(false);
  };

  return (
    <div className="vault-dashboard">
      <h2>🔐 Your Vault</h2>

      <div className="tabs">
        <button
          className={activeTab === "notes" ? "active" : ""}
          onClick={() => setActiveTab("notes")}
        >
          📝 Notes
        </button>
        <button
          className={activeTab === "passwords" ? "active" : ""}
          onClick={() => setActiveTab("passwords")}
        >
          🔑 Passwords
        </button>
        <button
          className={activeTab === "files" ? "active" : ""}
          onClick={() => setActiveTab("files")}
        >
          📁 Files
        </button>
      </div>

      {activeTab === "notes" && (
        <>
          <div className="note-input">
            <h3>📓 Add a Secure Note</h3>
            <textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Type your secret note..."
            />
            <button onClick={handleAddNote}>Add Note</button>
          </div>

          <ul className="note-list">
            {notes?.length > 0 ? (
              notes.map((note, idx) => (
                <li key={idx}>
                  <div className="note-text">{note.text}</div>
                  <div className="note-actions">
                    <button onClick={() => openEditModal(idx)}>Edit</button>
                    <button onClick={() => onDeleteNote(idx)}>Delete</button>
                  </div>
                </li>
              ))
            ) : (
              <li>No notes saved yet.</li>
            )}
          </ul>
        </>
      )}

      {activeTab === "passwords" && (
        <>
          <div className="note-input">
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

          <ul className="note-list">
            {passwords?.length > 0 ? (
              passwords.map((entry, idx) => (
                <li key={idx}>
                  <strong>{entry.title}</strong>
                  <div>User: {entry.username}</div>
                  <div>
                    Password: {visiblePasswords[idx] ? entry.password : "••••••••"}
                    <div className="note-actions">
                      <button onClick={() => togglePasswordVisibility(idx)}>
                        {visiblePasswords[idx] ? "🙈" : "👁️"}
                      </button>
                      <button onClick={() => copyToClipboard(entry.password)}>Copy</button>
                      <button onClick={() => onDeletePassword(idx)}>Delete</button>
                    </div>
                  </div>
                </li>
              ))
            ) : (
              <li>No passwords saved yet.</li>
            )}
          </ul>
        </>
      )}

      {activeTab === "files" && (
        <>
          <div className="note-input">
            <h3>📁 Add a File</h3>
            <input type="file" onChange={handleFileChange} />
          </div>

          <ul className="note-list">
            {files?.length > 0 ? (
              files.map((file, idx) => (
                <li key={idx}>
                  <div>{file.name}</div>
                  <div className="note-actions">
                    <button onClick={() => handleFileDownload(file)}>
                      Download
                    </button>
                    <button onClick={() => onDeleteFile(file.id)}>Delete</button>
                  </div>
                </li>
              ))
            ) : (
              <li>No files uploaded yet.</li>
            )}
          </ul>
        </>
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
