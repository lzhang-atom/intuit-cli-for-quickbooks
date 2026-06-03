import { intuitQueryPaginated, type ListOptions } from "../lib/intuit-api.js";
import { toCsv } from "../lib/csv.js";
import { toTable } from "../lib/table.js";

export async function salesreceiptsList(options: ListOptions & { json?: boolean; csv?: boolean }, profile?: string) {
  const receipts = await intuitQueryPaginated("SalesReceipt", options, profile) as Record<string, unknown>[];

  if (options.json) {
    console.log(JSON.stringify(receipts, null, 2));
    return;
  }

  if (options.csv) {
    console.log(toCsv(receipts));
    return;
  }

  if (receipts.length === 0) {
    console.log("No sales receipts found.");
    return;
  }

  const rows = receipts.map(r => ({
    Id: r.Id,
    DocNumber: r.DocNumber || "N/A",
    Customer: (r.CustomerRef as Record<string, string>)?.name || "Unknown",
    Amount: `$${r.TotalAmt}`,
    Date: r.TxnDate || "",
  }));
  console.log(`Found ${receipts.length} sales receipt(s):\n`);
  console.log(toTable(rows as Record<string, unknown>[]));
}
