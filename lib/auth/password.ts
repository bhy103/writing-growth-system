import { pbkdf2Sync, randomBytes, timingSafeEqual } from "node:crypto";

const iterations = 210000;
const keyLength = 32;
const digest = "sha256";

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = pbkdf2Sync(password, salt, iterations, keyLength, digest).toString("hex");

  return { hash, salt };
}

export function verifyPassword(password: string, hash: string, salt: string) {
  const candidate = pbkdf2Sync(password, salt, iterations, keyLength, digest);
  const stored = Buffer.from(hash, "hex");

  return stored.length === candidate.length && timingSafeEqual(stored, candidate);
}
