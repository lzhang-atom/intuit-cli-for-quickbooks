import { intuitQueryPaginated, type ListOptions } from "../lib/intuit-api.js";
import { toCsv } from "../lib/csv.js";
import { toTable } from "../lib/table.js";

export async function depositsList(options: ListOptions & { json?: boolean; csv?: boolean }, profile?: string) {
  const deposits = await intuitQueryPaginated("Deposit", options, profile) as Record<string, unknown>[];

  if (options.json) {
    console.log(JSON.stringify(deposits, null, 2));
    return;
  }

  if (options.csv) {
    console.log(toCsv(deposits));
    return;
  }

  if (deposits.length === 0) {
    console.log("No deposits found.");
    return;
  }

  const rows = deposits.map(d => ({
    Id: d.Id,
    Account: (d.DepositToAccountRef as Record<string, string>)?.name || "",
    Amount: `$${d.TotalAmt}`,
    Date: d.TxnDate || "",
  }));
  console.log(`Found ${deposits.length} deposit(s):\n`);
  console.log(toTable(rows as Record<string, unknown>[]));
}
