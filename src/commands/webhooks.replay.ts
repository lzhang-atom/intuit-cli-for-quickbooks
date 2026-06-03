import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import type { StoredEvent } from "./webhooks.listen.js";

const EVENTS_FILE = path.join(os.homedir(), ".config", "intuit-cli", "webhook-events.json");

export function webhooksReplay(options: { last: number; json?: boolean }) {
  let events: StoredEvent[];
  try {
    events = JSON.parse(fs.readFileSync(EVENTS_FILE, "utf-8"));
  } catch {
    console.log("No captured events found. Run 'intuit webhooks listen' first.");
    return;
  }

  const recent = events.slice(-options.last);

  if (recent.length === 0) {
    console.log("No captured events found.");
    return;
  }

  if (options.json) {
    console.log(JSON.stringify(recent, null, 2));
    return;
  }

  console.log(`\nLast ${recent.length} webhook event(s):\n`);
  for (const event of recent) {
    console.log(`${event.timestamp}  ${event.signatureValid ? "✓" : "✗"} VERIFIED`);
    console.log(`  ${event.payload}`);
    console.log();
  }
}
