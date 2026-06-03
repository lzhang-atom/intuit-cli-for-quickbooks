import { intuitQueryPaginated } from "../lib/intuit-api.js";
import { toCsv } from "../lib/csv.js";
import { toTable } from "../lib/table.js";
export async function paymentsList(options, profile) {
    const payments = await intuitQueryPaginated("Payment", options, profile);
    if (options.json) {
        console.log(JSON.stringify(payments, null, 2));
        return;
    }
    if (options.csv) {
        console.log(toCsv(payments));
        return;
    }
    if (payments.length === 0) {
        console.log("No payments found.");
        return;
    }
    const rows = payments.map(p => ({
        Id: p.Id,
        Customer: p.CustomerRef?.name || "Unknown",
        Amount: `$${p.TotalAmt}`,
        Date: p.TxnDate || "",
    }));
    console.log(`Found ${payments.length} payment(s):\n`);
    console.log(toTable(rows));
}
