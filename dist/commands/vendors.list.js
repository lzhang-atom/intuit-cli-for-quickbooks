import { intuitQueryPaginated } from "../lib/intuit-api.js";
import { toCsv } from "../lib/csv.js";
import { toTable } from "../lib/table.js";
export async function vendorsList(options, profile) {
    const vendors = await intuitQueryPaginated("Vendor", options, profile);
    if (options.json) {
        console.log(JSON.stringify(vendors, null, 2));
        return;
    }
    if (options.csv) {
        console.log(toCsv(vendors));
        return;
    }
    if (vendors.length === 0) {
        console.log("No vendors found.");
        return;
    }
    const rows = vendors.map(v => ({
        Id: v.Id,
        DisplayName: v.DisplayName,
        Email: v.PrimaryEmailAddr?.Address || "",
        Balance: v.Balance !== undefined ? `$${v.Balance}` : "",
    }));
    console.log(`Found ${vendors.length} vendor(s):\n`);
    console.log(toTable(rows));
}
