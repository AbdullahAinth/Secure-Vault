import React, { useState, useEffect, useRef, useCallback } from "react";
import UnlockScreen from "./components/UnlockScreen";
import VaultDashboard from "./components/VaultDashboard";
import SetupScreen from "./components/SetupScreen";
import Toast from "./components/Toast";
import Modal from "./components/Modal";
import {
  deriveKey,
  encryptData,
  decryptData,
  hashPassword,
} from "./utils/crypto";
import {
  getEncryptedVault,
  saveEncryptedVault,
} from "./utils/storage";
import {
  saveEncryptedFile,
  getAllFiles,
  deleteFile,
  clearAllFiles,
} from "./utils/db";
import "./styles.css";

function App() {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [derivedKey, setDerivedKey] = useState(null);
  const [notes, setNotes] = useState([]);
  const [passwords, setPasswords] = useState([]);
  const [files, setFiles] = useState([]);
  const [toastMessage, setToastMessage] = useState("");
  const [isFirstTime, setIsFirstTime] = useState(false);
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const modalContentRef = useRef(null);
  const autoLockTimeout = useRef(null);

  useEffect(() => {
    const storedHash = localStorage.getItem("vaultPasswordHash");
    if (!storedHash) setIsFirstTime(true);
  }, []);

  const resetAutoLockTimer = useCallback(() => {
    if (autoLockTimeout.current) clearTimeout(autoLockTimeout.current);
    autoLockTimeout.current = setTimeout(handleAutoLock, 5 * 60 * 1000);
  }, []);
  

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
    events.forEach((e) => document.addEventListener(e, resetAutoLockTimer));
    resetAutoLockTimer();
    return () => {
      events.forEach((e) => document.removeEventListener(e, resetAutoLockTimer));
      clearTimeout(autoLockTimeout.current);
    };
  }, [isUnlocked, resetAutoLockTimer]); // <- include it here
  

  const unlockVault = async (password) => {
    const inputHash = await hashPassword(password);
    const storedHash = localStorage.getItem("vaultPasswordHash");
    if (inputHash !== storedHash) return showToast("Invalid password.");

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
      showToast("Corrupted vault data.");
    }
  };

  const handleCreateMasterPassword = async (password) => {
    const hash = await hashPassword(password);
    localStorage.setItem("vaultPasswordHash", hash);
    showToast("Master password set.");
    setIsFirstTime(false);
  };

  const handleResetMasterPassword = async (oldPassword, newPassword) => {
    const storedHash = localStorage.getItem("vaultPasswordHash");
    const inputOldHash = await hashPassword(oldPassword);
    if (storedHash !== inputOldHash) return showToast("Incorrect current password.");

    const oldKey = await deriveKey(oldPassword);
    const newKey = await deriveKey(newPassword);
    const newHash = await hashPassword(newPassword);

    try {
      const storedNotes = await getEncryptedVault(oldKey, "notes");
      const storedPasswords = await getEncryptedVault(oldKey, "passwords");
      const encryptedFiles = await getAllFiles();

      await saveEncryptedVault(newKey, "notes", storedNotes || []);
      await saveEncryptedVault(newKey, "passwords", storedPasswords || []);
      await clearAllFiles();

      for (const file of encryptedFiles) {
        const decrypted = await decryptData(file.encrypted, oldKey);
        const reEncrypted = await encryptData(decrypted, newKey);
        await saveEncryptedFile({ name: file.name, encrypted: reEncrypted });
      }

      localStorage.setItem("vaultPasswordHash", newHash);
      showToast("Master password updated.");
    } catch (err) {
      console.error(err);
      showToast("Failed to re-encrypt data.");
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
    setTimeout(() => setToastMessage(""), 3000);
  };

  return (
    <div className="App">
      {isFirstTime ? (
        <SetupScreen onCreatePassword={handleCreateMasterPassword} />
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
        <UnlockScreen
          onUnlock={unlockVault}
          onReset={() => setResetModalOpen(true)}
        />
      )}

      {resetModalOpen && (
        <Modal
          title="Reset Master Password"
          isOpen={resetModalOpen}
          onCancel={() => setResetModalOpen(false)}
          onSave={async () => {
            const formEl = modalContentRef.current;
            if (!formEl) return;
            const oldPass = formEl.querySelector("#old-pass")?.value;
            const newPass = formEl.querySelector("#new-pass")?.value;
            if (!oldPass || !newPass) return showToast("Fill both fields.");
            await handleResetMasterPassword(oldPass, newPass);
            setResetModalOpen(false);
          }}
          content={
            <div ref={modalContentRef} className="reset-form">
              <div className="form-group">
                <label htmlFor="old-pass">Current Password</label>
                <input
                  id="old-pass"
                  type="password"
                  placeholder="Enter current password"
                />
              </div>
              <div className="form-group">
                <label htmlFor="new-pass">New Password</label>
                <input
                  id="new-pass"
                  type="password"
                  placeholder="Enter new password"
                />
              </div>
            </div>
          }
          
        />
      )}

      {toastMessage && (
        <Toast message={toastMessage} onClose={() => setToastMessage("")} />
      )}
    </div>
  );
}

export default App;
