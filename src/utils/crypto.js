const encoder = new TextEncoder();
const decoder = new TextDecoder();

// Derive key from master password using PBKDF2
export async function deriveKey(password, salt = "vault-salt") {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: encoder.encode(salt),
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

// Encrypt data
export async function encryptData(data, key) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = encoder.encode(JSON.stringify(data));
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoded
  );

  return JSON.stringify({
    iv: Array.from(iv),
    ciphertext: Array.from(new Uint8Array(encrypted)),
  });
}

// Decrypt data
export async function decryptData(encryptedStr, key) {
  const { iv, ciphertext } = JSON.parse(encryptedStr);
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: new Uint8Array(iv) },
    key,
    new Uint8Array(ciphertext)
  );
  return JSON.parse(decoder.decode(decrypted));
}
