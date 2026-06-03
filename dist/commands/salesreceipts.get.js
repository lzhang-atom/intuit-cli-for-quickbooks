import { entityGet } from "../lib/entity-get.js";
export async function salesreceiptsGet(id, options, profile) {
    await entityGet("salesreceipt", "SalesReceipt", id, options, profile, [
        { label: "Id", value: e => String(e.Id) },
        { label: "DocNumber", value: e => String(e.DocNumber || "N/A") },
        { label: "Customer", value: e => e.CustomerRef?.name || "Unknown" },
        { label: "Amount", value: e => e.TotalAmt !== undefined ? `$${e.TotalAmt}` : "" },
        { label: "TxnDate", value: e => String(e.TxnDate || "") },
        { label: "SyncToken", value: e => String(e.SyncToken || "") },
    ]);
}
