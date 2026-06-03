import { intuitQueryPaginated } from "../lib/intuit-api.js";
import { toCsv } from "../lib/csv.js";
import { toTable } from "../lib/table.js";
export async function billpaymentsList(options, profile) {
    const payments = await intuitQueryPaginated("BillPayment", options, profile);
    if (options.json) {
        console.log(JSON.stringify(payments, null, 2));
        return;
    }
    if (options.csv) {
        console.log(toCsv(payments));
        return;
    }
    if (payments.length === 0) {
        console.log("No bill payments found.");
        return;
    }
    const rows = payments.map(p => ({
        Id: p.Id,
        Vendor: p.VendorRef?.name || "Unknown",
        Amount: `$${p.TotalAmt}`,
        PayType: p.PayType || "",
        Date: p.TxnDate || "",
    }));
    console.log(`Found ${payments.length} bill payment(s):\n`);
    console.log(toTable(rows));
}
