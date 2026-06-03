import https from "node:https";
import fs from "node:fs";

let configured = false;

export function configureTls() {
  if (configured) return;
  configured = true;

  // Support custom CA bundle for environments with custom certificates
  const caPath = process.env.NODE_EXTRA_CA_CERTS;
  if (caPath) {
    try {
      const ca = fs.readFileSync(caPath);
      https.globalAgent.options.ca = ca;
    } catch {
      // Ignore — Node will use default CAs
    }
  }
}
