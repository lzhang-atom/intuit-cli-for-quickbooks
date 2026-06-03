import fs from "node:fs";
import { intuitPost } from "../lib/intuit-api.js";

export async function depositsCreate(options: { file?: string; accountRef?: string; lineAccountRef?: string; amount?: string }, profile?: string) {
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
  } else if (options.accountRef && options.lineAccountRef && options.amount) {
    const line: Record<string, unknown> = {
      Amount: parseFloat(options.amount),
      DetailType: "DepositLineDetail",
      DepositLineDetail: {
        AccountRef: { value: options.lineAccountRef },
      },
    };
    body = {
      DepositToAccountRef: { value: options.accountRef },
      Line: [line],
    };
  } else {
    throw new Error("Provide --account-ref, --line-account-ref, and --amount for a quick create, or --file for full control (multiple deposit lines, memo, cashback, etc.).");
  }

  const data = await intuitPost("deposit", body, profile);
  const deposit = data.Deposit;
  console.log(`Created deposit [${deposit.Id}] — $${deposit.TotalAmt}`);
}
