import fs from "node:fs";
import { intuitPost } from "../lib/intuit-api.js";

export async function purchasesCreate(options: { file?: string; accountRef?: string; expenseAccountRef?: string; amount?: string; paymentType?: string }, profile?: string) {
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
  } else if (options.accountRef && options.expenseAccountRef && options.amount) {
    const line: Record<string, unknown> = {
      Amount: parseFloat(options.amount),
      DetailType: "AccountBasedExpenseLineDetail",
      AccountBasedExpenseLineDetail: {
        AccountRef: { value: options.expenseAccountRef },
      },
    };
    body = {
      PaymentType: options.paymentType || "Cash",
      AccountRef: { value: options.accountRef },
      Line: [line],
    };
  } else {
    throw new Error("Provide --account-ref, --expense-account-ref, and --amount for a quick create, or --file for full control (multiple lines, item-based expenses, vendor ref, memo, etc.).");
  }

  const data = await intuitPost("purchase", body, profile);
  const purchase = data.Purchase;
  console.log(`Created purchase [${purchase.Id}] — ${purchase.PaymentType} — $${purchase.TotalAmt}`);
}
