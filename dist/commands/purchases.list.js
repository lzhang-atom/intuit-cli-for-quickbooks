import { intuitQueryPaginated } from "../lib/intuit-api.js";
import { toCsv } from "../lib/csv.js";
import { toTable } from "../lib/table.js";
export async function purchasesList(options, profile) {
    const purchases = await intuitQueryPaginated("Purchase", options, profile);
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
        Account: p.AccountRef?.name || "",
        Amount: `$${p.TotalAmt}`,
        Date: p.TxnDate || "",
    }));
    console.log(`Found ${purchases.length} purchase(s):\n`);
    console.log(toTable(rows));
}
