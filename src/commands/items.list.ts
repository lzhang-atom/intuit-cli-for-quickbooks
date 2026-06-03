import { intuitQueryPaginated, type ListOptions } from "../lib/intuit-api.js";
import { toCsv } from "../lib/csv.js";
import { toTable } from "../lib/table.js";

export async function itemsList(options: ListOptions & { json?: boolean; csv?: boolean }, profile?: string) {
  const items = await intuitQueryPaginated("Item", options, profile) as Record<string, unknown>[];

  if (options.json) {
    console.log(JSON.stringify(items, null, 2));
    return;
  }

  if (options.csv) {
    console.log(toCsv(items));
    return;
  }

  if (items.length === 0) {
    console.log("No items found.");
    return;
  }

  const rows = items.map(i => ({
    Id: i.Id,
    Name: i.Name,
    Type: i.Type || "Unknown",
    UnitPrice: i.UnitPrice !== undefined ? `$${i.UnitPrice}` : "",
    Active: i.Active === false ? "No" : "Yes",
  }));
  console.log(`Found ${items.length} item(s):\n`);
  console.log(toTable(rows as Record<string, unknown>[]));
}
