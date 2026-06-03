import { intuitQueryPaginated, type ListOptions } from "../lib/intuit-api.js";
import { toCsv } from "../lib/csv.js";
import { toTable } from "../lib/table.js";

export async function creditmemosList(options: ListOptions & { json?: boolean; csv?: boolean }, profile?: string) {
  const memos = await intuitQueryPaginated("CreditMemo", options, profile) as Record<string, unknown>[];

  if (options.json) {
    console.log(JSON.stringify(memos, null, 2));
    return;
  }

  if (options.csv) {
    console.log(toCsv(memos));
    return;
  }

  if (memos.length === 0) {
    console.log("No credit memos found.");
    return;
  }

  const rows = memos.map(m => ({
    Id: m.Id,
    DocNumber: m.DocNumber || "N/A",
    Customer: (m.CustomerRef as Record<string, string>)?.name || "Unknown",
    Amount: `$${m.TotalAmt}`,
    Balance: `$${m.RemainingCredit ?? m.Balance ?? 0}`,
    Date: m.TxnDate || "",
  }));
  console.log(`Found ${memos.length} credit memo(s):\n`);
  console.log(toTable(rows as Record<string, unknown>[]));
}
