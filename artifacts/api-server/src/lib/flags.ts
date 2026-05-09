import { createHash, timingSafeEqual } from "node:crypto";

const HASH_PREFIX = "sha256$";

function normalizeFlag(flag: string) {
  return flag.trim().replace(/\r\n/g, "\n");
}

export function hashFlag(flag: string) {
  return `${HASH_PREFIX}${createHash("sha256").update(normalizeFlag(flag), "utf8").digest("hex")}`;
}

export function isHashedFlag(flag: string) {
  return flag.startsWith(HASH_PREFIX);
}

export function verifyFlag(submitted: string, stored: string) {
  const expected = isHashedFlag(stored) ? stored : normalizeFlag(stored);
  const actual = isHashedFlag(stored) ? hashFlag(submitted) : normalizeFlag(submitted);
  const expectedBuffer = Buffer.from(expected, "utf8");
  const actualBuffer = Buffer.from(actual, "utf8");
  if (expectedBuffer.length !== actualBuffer.length) return false;
  return timingSafeEqual(actualBuffer, expectedBuffer);
}
