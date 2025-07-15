import { encryptData, decryptData } from "./crypto";

// Save encrypted vault data to localStorage
export async function saveEncryptedVault(key, dataType, data) {
  const encrypted = await encryptData(data, key);
  const vault = JSON.parse(localStorage.getItem("vault")) || {};
  vault[dataType] = encrypted;
  localStorage.setItem("vault", JSON.stringify(vault));
}

// Load and decrypt vault data from localStorage
export async function getEncryptedVault(key, dataType) {
  const vault = JSON.parse(localStorage.getItem("vault")) || {};
  const encrypted = vault[dataType];
  if (!encrypted) return [];
  return await decryptData(encrypted, key);
}

// Optional: Clear everything
export function clearVault() {
  localStorage.removeItem("vault");
}
