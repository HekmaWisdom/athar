// Client-side AES-256-GCM encryption for journal entries. The server (Supabase) only
// ever sees ciphertext + a per-entry IV — the passphrase and derived key never leave
// the browser. If the passphrase is forgotten, entries encrypted with it are
// permanently unrecoverable by design (that's what makes this real E2E, not theater).

const PBKDF2_ITERATIONS = 250_000;

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

function base64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export function generateSalt(): string {
  return bytesToBase64(crypto.getRandomValues(new Uint8Array(16)));
}

export async function deriveJournalKey(passphrase: string, saltBase64: string): Promise<CryptoKey> {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(passphrase),
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: base64ToBytes(saltBase64) as BufferSource, iterations: PBKDF2_ITERATIONS, hash: "SHA-256" },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    true, // extractable, so we can cache it in sessionStorage for the rest of the session
    ["encrypt", "decrypt"],
  );
}

export async function encryptJournalText(key: CryptoKey, plaintext: string): Promise<{ ciphertext: string; iv: string }> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(plaintext));
  return { ciphertext: bytesToBase64(new Uint8Array(encrypted)), iv: bytesToBase64(iv) };
}

export async function decryptJournalText(key: CryptoKey, ciphertextB64: string, ivB64: string): Promise<string> {
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: base64ToBytes(ivB64) as BufferSource },
    key,
    base64ToBytes(ciphertextB64) as BufferSource,
  );
  return new TextDecoder().decode(decrypted);
}

// Session-scoped key cache (sessionStorage, not localStorage — cleared when the tab/
// browser closes, not persisted long-term). A reasonable middle ground: avoids
// re-prompting for the passphrase on every navigation within a session, without
// keeping the derived key around indefinitely like localStorage would.
const SESSION_KEY_STORAGE = "athar_journal_key";

export async function cacheJournalKey(key: CryptoKey) {
  const raw = await crypto.subtle.exportKey("raw", key);
  sessionStorage.setItem(SESSION_KEY_STORAGE, bytesToBase64(new Uint8Array(raw)));
}

export async function getCachedJournalKey(): Promise<CryptoKey | null> {
  const cached = sessionStorage.getItem(SESSION_KEY_STORAGE);
  if (!cached) return null;
  return crypto.subtle.importKey("raw", base64ToBytes(cached) as BufferSource, { name: "AES-GCM", length: 256 }, true, [
    "encrypt",
    "decrypt",
  ]);
}

export function clearCachedJournalKey() {
  sessionStorage.removeItem(SESSION_KEY_STORAGE);
}
