import { intuitQueryPaginated, type ListOptions } from "../lib/intuit-api.js";
import { toCsv } from "../lib/csv.js";
import { toTable } from "../lib/table.js";

export async function customersList(options: ListOptions & { json?: boolean; csv?: boolean }, profile?: string) {
  const customers = await intuitQueryPaginated("Customer", options, profile) as Record<string, unknown>[];

  if (options.json) {
    console.log(JSON.stringify(customers, null, 2));
    return;
  }

  if (options.csv) {
    console.log(toCsv(customers));
    return;
  }

  if (customers.length === 0) {
    console.log("No customers found.");
    return;
  }

  const rows = customers.map(c => ({
    Id: c.Id,
    DisplayName: c.DisplayName,
    Email: (c.PrimaryEmailAddr as Record<string, string>)?.Address || "",
    Balance: c.Balance !== undefined ? `$${c.Balance}` : "",
  }));
  console.log(`Found ${customers.length} customer(s):\n`);
  console.log(toTable(rows as Record<string, unknown>[]));
}
