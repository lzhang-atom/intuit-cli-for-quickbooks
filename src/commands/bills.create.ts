import fs from "node:fs";
import { intuitPost } from "../lib/intuit-api.js";

export async function billsCreate(options: { file?: string; vendorRef?: string; expenseAccountRef?: string; amount?: string }, profile?: string) {
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
  } else if (options.vendorRef && options.amount) {
    const line: Record<string, unknown> = {
      Amount: parseFloat(options.amount),
      DetailType: "AccountBasedExpenseLineDetail",
      AccountBasedExpenseLineDetail: {
        AccountRef: { value: options.expenseAccountRef || "1" },
      },
    };
    body = {
      VendorRef: { value: options.vendorRef },
      Line: [line],
    };
  } else {
    throw new Error("Provide --vendor-ref and --amount for a quick create, or --file for full control (multiple lines, terms, memo, etc.).");
  }

  const data = await intuitPost("bill", body, profile);
  const bill = data.Bill;
  console.log(`Created bill [${bill.Id}] — $${bill.TotalAmt}`);
}
