import fs from "node:fs";
import { intuitPost } from "../lib/intuit-api.js";

export async function invoicesCreate(
  options: {
    file?: string;
    customerRef?: string;
    amount?: string;
    itemRef?: string;
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
  } else if (options.customerRef) {
    const line: Record<string, unknown> = {
      Amount: parseFloat(options.amount || "0"),
      DetailType: "SalesItemLineDetail",
      SalesItemLineDetail: {
        ItemRef: { value: options.itemRef || "1" },
      },
    };
    body = {
      CustomerRef: { value: options.customerRef },
      Line: [line],
    };
  } else {
    throw new Error("Provide --customer-ref for a simple single-line invoice, or --file for full control (multi-line items, descriptions, tax, etc.).");
  }

  if (options.idempotencyTag) {
    const marker = `[via Intuit CLI · run ${options.idempotencyTag}]`;
    const existing = typeof body.PrivateNote === "string" ? body.PrivateNote : "";
    body.PrivateNote = existing ? `${existing} ${marker}` : marker;
  }

  if (options.dryRun) {
    console.log("[dry-run] POST /invoice");
    console.log(JSON.stringify(body, null, 2));
    return;
  }

  const data = await intuitPost("invoice", body, profile);
  const invoice = data.Invoice;
  console.log(`Created invoice [${invoice.Id}] #${invoice.DocNumber || "N/A"} — $${invoice.TotalAmt}`);
}
