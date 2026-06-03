import { intuitQueryPaginated, type ListOptions } from "../lib/intuit-api.js";
import { toCsv } from "../lib/csv.js";
import { toTable } from "../lib/table.js";

export async function estimatesList(options: ListOptions & { json?: boolean; csv?: boolean }, profile?: string) {
  const estimates = await intuitQueryPaginated("Estimate", options, profile) as Record<string, unknown>[];

  if (options.json) {
    console.log(JSON.stringify(estimates, null, 2));
    return;
  }

  if (options.csv) {
    console.log(toCsv(estimates));
    return;
  }

  if (estimates.length === 0) {
    console.log("No estimates found.");
    return;
  }

  const rows = estimates.map(e => ({
    Id: e.Id,
    DocNumber: e.DocNumber || "N/A",
    Customer: (e.CustomerRef as Record<string, string>)?.name || "Unknown",
    Amount: `$${e.TotalAmt}`,
    Status: e.TxnStatus || "Pending",
    ExpirationDate: e.ExpirationDate || "",
  }));
  console.log(`Found ${estimates.length} estimate(s):\n`);
  console.log(toTable(rows as Record<string, unknown>[]));
}
