import { intuitQueryPaginated } from "../lib/intuit-api.js";
import { toCsv } from "../lib/csv.js";
import { toTable } from "../lib/table.js";
export async function customersList(options, profile) {
    const customers = await intuitQueryPaginated("Customer", options, profile);
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
        Email: c.PrimaryEmailAddr?.Address || "",
        Balance: c.Balance !== undefined ? `$${c.Balance}` : "",
    }));
    console.log(`Found ${customers.length} customer(s):\n`);
    console.log(toTable(rows));
}
