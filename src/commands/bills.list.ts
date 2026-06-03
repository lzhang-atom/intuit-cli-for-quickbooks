import { intuitQueryPaginated, type ListOptions } from "../lib/intuit-api.js";
import { toCsv } from "../lib/csv.js";
import { toTable } from "../lib/table.js";

export async function billsList(options: ListOptions & { json?: boolean; csv?: boolean }, profile?: string) {
  const bills = await intuitQueryPaginated("Bill", options, profile) as Record<string, unknown>[];

  if (options.json) {
    console.log(JSON.stringify(bills, null, 2));
    return;
  }

  if (options.csv) {
    console.log(toCsv(bills));
    return;
  }

  if (bills.length === 0) {
    console.log("No bills found.");
    return;
  }

  const rows = bills.map(b => ({
    Id: b.Id,
    Vendor: (b.VendorRef as Record<string, string>)?.name || "Unknown",
    Amount: `$${b.TotalAmt}`,
    Status: b.Balance === 0 ? "Paid" : "Open",
    DueDate: b.DueDate || "",
  }));
  console.log(`Found ${bills.length} bill(s):\n`);
  console.log(toTable(rows as Record<string, unknown>[]));
}
