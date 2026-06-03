import fs from "node:fs";
import { intuitPost } from "../lib/intuit-api.js";

export async function customersCreate(
  options: {
    file?: string;
    displayName?: string;
    email?: string;
    phone?: string;
    dryRun?: boolean;
    idempotencyTag?: string;
  },
  profile?: string,
) {
  let body: Record<string, unknown>;

  if (options.file) {
    let raw: string;
    try {
      raw = fs.readFileSync(options.file, "utf-8");
    } catch {
      throw new Error(`Cannot read file: ${options.file}`);
    }
    try {
      body = JSON.parse(raw);
    } catch {
      throw new Error(`Invalid JSON in ${options.file}. Check the file format and try again.`);
    }
  } else if (options.displayName) {
    body = { DisplayName: options.displayName };
    if (options.email) body.PrimaryEmailAddr = { Address: options.email };
    if (options.phone) body.PrimaryPhone = { FreeFormNumber: options.phone };
  } else {
    throw new Error("Provide --display-name for a quick create, or --file for full control (addresses, tax info, custom fields, etc.).");
  }

  if (options.idempotencyTag) {
    const marker = ` [via Intuit CLI · run ${options.idempotencyTag}]`;
    const existing = typeof body.Notes === "string" ? body.Notes : "";
    body.Notes = existing ? `${existing}${marker}` : marker.trimStart();
  }

  if (options.dryRun) {
    console.log("[dry-run] POST /customer");
    console.log(JSON.stringify(body, null, 2));
    return;
  }

  const data = await intuitPost("customer", body, profile);
  const customer = data.Customer;
  console.log(`Created customer [${customer.Id}] ${customer.DisplayName}`);
}
