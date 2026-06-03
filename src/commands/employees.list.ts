import { intuitQueryPaginated, type ListOptions } from "../lib/intuit-api.js";
import { toCsv } from "../lib/csv.js";
import { toTable } from "../lib/table.js";

export async function employeesList(options: ListOptions & { json?: boolean; csv?: boolean }, profile?: string) {
  const employees = await intuitQueryPaginated("Employee", options, profile) as Record<string, unknown>[];

  if (options.json) {
    console.log(JSON.stringify(employees, null, 2));
    return;
  }

  if (options.csv) {
    console.log(toCsv(employees));
    return;
  }

  if (employees.length === 0) {
    console.log("No employees found.");
    return;
  }

  const rows = employees.map(e => ({
    Id: e.Id,
    DisplayName: e.DisplayName,
    Email: (e.PrimaryEmailAddr as Record<string, string>)?.Address || "",
    Active: e.Active === false ? "No" : "Yes",
  }));
  console.log(`Found ${employees.length} employee(s):\n`);
  console.log(toTable(rows as Record<string, unknown>[]));
}
