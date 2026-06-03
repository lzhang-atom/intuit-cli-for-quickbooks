import { intuitQueryPaginated, type ListOptions } from "../lib/intuit-api.js";
import { toCsv } from "../lib/csv.js";
import { toTable } from "../lib/table.js";

export async function purchasesList(options: ListOptions & { json?: boolean; csv?: boolean }, profile?: string) {
  const purchases = await intuitQueryPaginated("Purchase", options, profile) as Record<string, unknown>[];

  if (options.json) {
    console.log(JSON.stringify(purchases, null, 2));
    return;
  }

  if (options.csv) {
    console.log(toCsv(purchases));
    return;
  }

  if (purchases.length === 0) {
    console.log("No purchases found.");
    return;
  }

  const rows = purchases.map(p => ({
    Id: p.Id,
    PaymentType: p.PaymentType || "Unknown",
    Account: (p.AccountRef as Record<string, string>)?.name || "",
    Amount: `$${p.TotalAmt}`,
    Date: p.TxnDate || "",
  }));
  console.log(`Found ${purchases.length} purchase(s):\n`);
  console.log(toTable(rows as Record<string, unknown>[]));
}
