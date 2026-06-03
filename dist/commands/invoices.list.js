import { intuitQueryPaginated } from "../lib/intuit-api.js";
import { toCsv } from "../lib/csv.js";
import { toTable } from "../lib/table.js";
export async function invoicesList(options, profile) {
    const invoices = await intuitQueryPaginated("Invoice", options, profile);
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
        Customer: inv.CustomerRef?.name || "Unknown",
        Amount: `$${inv.TotalAmt}`,
        Status: inv.Balance === 0 ? "Paid" : "Open",
        DueDate: inv.DueDate || "",
    }));
    console.log(`Found ${invoices.length} invoice(s):\n`);
    console.log(toTable(rows));
}
