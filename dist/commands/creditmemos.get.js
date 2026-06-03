import { entityGet } from "../lib/entity-get.js";
export async function creditmemosGet(id, options, profile) {
    await entityGet("creditmemo", "CreditMemo", id, options, profile, [
        { label: "Id", value: e => String(e.Id) },
        { label: "DocNumber", value: e => String(e.DocNumber || "N/A") },
        { label: "Customer", value: e => e.CustomerRef?.name || "Unknown" },
        { label: "Amount", value: e => e.TotalAmt !== undefined ? `$${e.TotalAmt}` : "" },
        { label: "RemainingCredit", value: e => e.RemainingCredit !== undefined ? `$${e.RemainingCredit}` : "" },
        { label: "TxnDate", value: e => String(e.TxnDate || "") },
        { label: "SyncToken", value: e => String(e.SyncToken || "") },
    ]);
}
