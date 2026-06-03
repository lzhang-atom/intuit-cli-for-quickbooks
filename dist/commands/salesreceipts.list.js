import { intuitQueryPaginated } from "../lib/intuit-api.js";
import { toCsv } from "../lib/csv.js";
import { toTable } from "../lib/table.js";
export async function salesreceiptsList(options, profile) {
    const receipts = await intuitQueryPaginated("SalesReceipt", options, profile);
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
        Customer: r.CustomerRef?.name || "Unknown",
        Amount: `$${r.TotalAmt}`,
        Date: r.TxnDate || "",
    }));
    console.log(`Found ${receipts.length} sales receipt(s):\n`);
    console.log(toTable(rows));
}
