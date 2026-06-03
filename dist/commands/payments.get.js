import { entityGet } from "../lib/entity-get.js";
export async function paymentsGet(id, options, profile) {
    await entityGet("payment", "Payment", id, options, profile, [
        { label: "Id", value: e => String(e.Id) },
        { label: "Customer", value: e => e.CustomerRef?.name || "Unknown" },
        { label: "Amount", value: e => e.TotalAmt !== undefined ? `$${e.TotalAmt}` : "" },
        { label: "TxnDate", value: e => String(e.TxnDate || "") },
        { label: "SyncToken", value: e => String(e.SyncToken || "") },
    ]);
}
