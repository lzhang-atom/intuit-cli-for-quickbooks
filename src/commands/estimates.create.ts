import fs from "node:fs";
import { intuitPost } from "../lib/intuit-api.js";

export async function estimatesCreate(options: { file?: string; customerRef?: string; amount?: string; itemRef?: string }, profile?: string) {
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
    throw new Error("Provide --customer-ref for a simple single-line estimate, or --file for full control (multi-line items, descriptions, tax, etc.).");
  }

  const data = await intuitPost("estimate", body, profile);
  const estimate = data.Estimate;
  console.log(`Created estimate [${estimate.Id}] #${estimate.DocNumber || "N/A"} — $${estimate.TotalAmt}`);
}
