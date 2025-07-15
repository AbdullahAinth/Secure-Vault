import React, { useState, useEffect, useRef } from "react";
import UnlockScreen from "./components/UnlockScreen";
import SetupScreen from "./components/SetupScreen";
import VaultDashboard from "./components/VaultDashboard";
import Toast from "./components/Toast";
import { deriveKey, encryptData, decryptData, hashPassword } from "./utils/crypto";
import {
  getEncryptedVault,
  saveEncryptedVault
} from "./utils/storage";
import {
  saveEncryptedFile,
  getAllFiles,
  deleteFile
} from "./utils/db";
import "./styles.css";

function App() {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isSetup, setIsSetup] = useState(false);
  const [derivedKey, setDerivedKey] = useState(null);
  const [notes, setNotes] = useState([]);
  const [passwords, setPasswords] = useState([]);
  const [files, setFiles] = useState([]);
  const [toastMessage, setToastMessage] = useState("");
  const autoLockTimeout = useRef(null);

  // Check setup state on load
  useEffect(() => {
    const storedHash = localStorage.getItem("vault-hash");
    setIsSetup(!!storedHash); // true if hash exists
  }, []);

  const resetAutoLockTimer = () => {
    if (autoLockTimeout.current) {
      clearTimeout(autoLockTimeout.current);
    }
    autoLockTimeout.current = setTimeout(() => {
      handleAutoLock();
    }, 5 * 60 * 1000);
  };

  const handleAutoLock = () => {
    setToastMessage("Vault locked due to inactivity.");
    setNotes([]);
    setPasswords([]);
    setFiles([]);
    setDerivedKey(null);
    setIsUnlocked(false);
  };

  useEffect(() => {
    if (!isUnlocked) return;

    const events = ["mousemove", "keydown", "click"];
    events.forEach((event) =>
      document.addEventListener(event, resetAutoLockTimer)
    );

    resetAutoLockTimer();

    return () => {
      events.forEach((event) =>
        document.removeEventListener(event, resetAutoLockTimer)
      );
      clearTimeout(autoLockTimeout.current);
    };
  }, [isUnlocked]);

  const handleCreatePassword = async (password) => {
    const hash = await hashPassword(password);
    localStorage.setItem("vault-hash", hash);
    setIsSetup(true);
    showToast("Master password created!");
  };

  const unlockVault = async (password) => {
    const inputHash = await hashPassword(password);
    const storedHash = localStorage.getItem("vault-hash");

    if (inputHash !== storedHash) {
      showToast("Incorrect master password.");
      return;
    }

    const key = await deriveKey(password);
    try {
      const storedNotes = await getEncryptedVault(key, "notes");
      const storedPasswords = await getEncryptedVault(key, "passwords");
      const encryptedFiles = await getAllFiles();
      const decryptedFiles = await Promise.all(
        encryptedFiles.map(async (f) => {
          const decrypted = await decryptData(f.encrypted, key);
          const blob = new Blob([new Uint8Array(decrypted)]);
          return { id: f.id, name: f.name, blob };
        })
      );

      setNotes(storedNotes || []);
      setPasswords(storedPasswords || []);
      setFiles(decryptedFiles || []);
      setDerivedKey(key);
      setIsUnlocked(true);
    } catch (e) {
      console.error(e);
      showToast("Invalid password or corrupted data.");
    }
  };

  const handleAddNote = (newNote) => {
    const updated = [...notes, { text: newNote }];
    setNotes(updated);
    saveEncryptedVault(derivedKey, "notes", updated);
    showToast("Note added.");
  };

  const handleEditNote = (index, newText) => {
    const updated = [...notes];
    updated[index].text = newText;
    setNotes(updated);
    saveEncryptedVault(derivedKey, "notes", updated);
    showToast("Note updated.");
  };

  const handleDeleteNote = (index) => {
    const updated = notes.filter((_, i) => i !== index);
    setNotes(updated);
    saveEncryptedVault(derivedKey, "notes", updated);
    showToast("Note deleted.");
  };

  const handleAddPassword = (entry) => {
    const updated = [...passwords, entry];
    setPasswords(updated);
    saveEncryptedVault(derivedKey, "passwords", updated);
    showToast("Password saved.");
  };

  const handleDeletePassword = (index) => {
    const updated = passwords.filter((_, i) => i !== index);
    setPasswords(updated);
    saveEncryptedVault(derivedKey, "passwords", updated);
    showToast("Password deleted.");
  };

  const handleAddFile = async (file) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const binaryData = e.target.result;
      const encrypted = await encryptData(
        Array.from(new Uint8Array(binaryData)),
        derivedKey
      );
      const { id } = await saveEncryptedFile({ name: file.name, encrypted });
      const newBlob = new Blob([binaryData]);
      setFiles((prev) => [...prev, { id, name: file.name, blob: newBlob }]);
      showToast("File added.");
    };
    reader.readAsArrayBuffer(file);
  };

  const handleDeleteFile = async (id) => {
    await deleteFile(id);
    setFiles((prev) => prev.filter((file) => file.id !== id));
    showToast("File deleted.");
  };

  const showToast = (message) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(""), 3000); // auto-dismiss after 3 sec
  };

  return (
    <div className="App">
      {!isSetup ? (
        <SetupScreen onCreatePassword={handleCreatePassword} />
      ) : isUnlocked ? (
        <VaultDashboard
          notes={notes}
          passwords={passwords}
          files={files}
          onAddNote={handleAddNote}
          onEditNote={handleEditNote}
          onDeleteNote={handleDeleteNote}
          onAddPassword={handleAddPassword}
          onDeletePassword={handleDeletePassword}
          onAddFile={handleAddFile}
          onDeleteFile={handleDeleteFile}
          showToast={showToast}
        />
      ) : (
        <UnlockScreen onUnlock={unlockVault} />
      )}

      {toastMessage && (
        <Toast message={toastMessage} onClose={() => setToastMessage("")} />
      )}
    </div>
  );
}

export default App;
