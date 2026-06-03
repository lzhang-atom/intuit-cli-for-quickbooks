import { intuitQueryPaginated, type ListOptions } from "../lib/intuit-api.js";
import { toCsv } from "../lib/csv.js";
import { toTable } from "../lib/table.js";

export async function invoicesList(options: ListOptions & { json?: boolean; csv?: boolean }, profile?: string) {
  const invoices = await intuitQueryPaginated("Invoice", options, profile) as Record<string, unknown>[];

  if (options.json) {
    console.log(JSON.stringify(invoices, null, 2));
    return;
  }

  if (options.csv) {
    console.log(toCsv(invoices));
    return;
  }

  if (invoices.length === 0) {
    console.log("No invoices found.");
    return;
  }

  const rows = invoices.map(inv => ({
    Id: inv.Id,
    DocNumber: inv.DocNumber || "N/A",
    Customer: (inv.CustomerRef as Record<string, string>)?.name || "Unknown",
    Amount: `$${inv.TotalAmt}`,
    Status: inv.Balance === 0 ? "Paid" : "Open",
    DueDate: inv.DueDate || "",
  }));
  console.log(`Found ${invoices.length} invoice(s):\n`);
  console.log(toTable(rows as Record<string, unknown>[]));
}
