import { entityGet, type GetOptions } from "../lib/entity-get.js";

export async function invoicesGet(id: string, options: GetOptions, profile?: string) {
  await entityGet("invoice", "Invoice", id, options, profile, [
    { label: "Id", value: e => String(e.Id) },
    { label: "DocNumber", value: e => String(e.DocNumber || "N/A") },
    { label: "Customer", value: e => (e.CustomerRef as Record<string, string>)?.name || "Unknown" },
    { label: "Amount", value: e => e.TotalAmt !== undefined ? `$${e.TotalAmt}` : "" },
    { label: "Balance", value: e => e.Balance !== undefined ? `$${e.Balance}` : "" },
    { label: "Status", value: e => e.Balance === 0 ? "Paid" : "Open" },
    { label: "DueDate", value: e => String(e.DueDate || "") },
    { label: "TxnDate", value: e => String(e.TxnDate || "") },
    { label: "SyncToken", value: e => String(e.SyncToken || "") },
  ]);
}
