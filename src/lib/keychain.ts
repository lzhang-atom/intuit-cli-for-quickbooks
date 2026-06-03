import { Entry } from "@napi-rs/keyring";
import crypto from "node:crypto";

const SERVICE = "intuit-cli";

function keyEntry(profile: string) {
  return new Entry(SERVICE, `${profile}-encryption-key`);
}

export function getOrCreateKey(profile: string = "default"): Buffer {
  const entry = keyEntry(profile);
  try {
    const existing = entry.getPassword();
    if (!existing) throw new Error("No key found");
    return Buffer.from(existing, "hex");
  } catch {
    const key = crypto.randomBytes(32);
    entry.setPassword(key.toString("hex"));
    return key;
  }
}

export function deleteKey(profile: string = "default") {
  const entry = keyEntry(profile);
  try {
    entry.deletePassword();
  } catch {
    // key doesn't exist
  }
}
