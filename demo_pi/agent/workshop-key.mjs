// The workshop key: the model's API key, encrypted with a short code we say out loud in the room, so a copy of this
// repo (a participant's own dev container) can use the model without anyone handing out the key itself.
//
//   workshop-key.json   committed: the endpoint and model in the clear, the API key encrypted
//   node encrypt-key.mjs [--code k7mp-ra3x]   writes it from DEMO_API_KEY (`just key-encrypt`), prints the code
//
// The key is scrypt(code) -> AES-256-GCM; a wrong code fails GCM's check, so the server can tell it is wrong. The repo
// is public, so the file is too: the code is all that protects the key, which is why the default code is random
// (8 characters, about 40 bits) and scrypt is slow (~0.2 s a guess, 128 MiB each). Anyone in the room with the code
// can recover the key, so use a key from a project with a budget cap, and revoke it after the workshop.

import { createCipheriv, createDecipheriv, randomBytes, randomInt, scrypt } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// DEMO_KEY_FILE points elsewhere (test/unlock.mjs uses a throwaway one)
export const KEY_FILE = process.env.DEMO_KEY_FILE || join(dirname(fileURLToPath(import.meta.url)), "..", "workshop-key.json");

const ALPHABET = "23456789abcdefghjkmnpqrstuvwxyz";            // no 0/o, 1/i/l: easy to read off a slide
const KDF = { N: 2 ** 17, r: 8, p: 1, maxmem: 256 * 1024 * 1024 };

/** What people type, made comparable: case, spaces and dashes don't matter. */
export const normalizeCode = (code) => String(code || "").toLowerCase().replace(/[\s-]/g, "");

export function newCode() {
  const c = Array.from({ length: 8 }, () => ALPHABET[randomInt(ALPHABET.length)]).join("");
  return `${c.slice(0, 4)}-${c.slice(4)}`;
}

const derive = (code, salt) => new Promise((resolve, reject) =>
  scrypt(normalizeCode(code), salt, 32, KDF, (err, key) => (err ? reject(err) : resolve(key))));

export async function encryptKey({ apiKey, baseUrl, model, code }) {
  const salt = randomBytes(16), iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", await derive(code, salt), iv);
  const ciphertext = Buffer.concat([cipher.update(apiKey, "utf8"), cipher.final()]);
  return {
    baseUrl, model, created: new Date().toISOString().slice(0, 10),
    kdf: { name: "scrypt", N: KDF.N, r: KDF.r, p: KDF.p }, cipher: "aes-256-gcm",
    salt: salt.toString("base64"), iv: iv.toString("base64"), tag: cipher.getAuthTag().toString("base64"), ciphertext: ciphertext.toString("base64"),
  };
}

/** The API key, or null when the code is wrong. */
export async function decryptKey(file, code) {
  const decipher = createDecipheriv("aes-256-gcm", await derive(code, Buffer.from(file.salt, "base64")), Buffer.from(file.iv, "base64"));
  decipher.setAuthTag(Buffer.from(file.tag, "base64"));
  try {
    return Buffer.concat([decipher.update(Buffer.from(file.ciphertext, "base64")), decipher.final()]).toString("utf8");
  } catch {
    return null;
  }
}

export const readKeyFile = () => (existsSync(KEY_FILE) ? JSON.parse(readFileSync(KEY_FILE, "utf8")) : null);
export const writeKeyFile = (file) => writeFileSync(KEY_FILE, JSON.stringify(file, null, 1) + "\n");
