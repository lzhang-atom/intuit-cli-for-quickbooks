import { entityGet, type GetOptions } from "../lib/entity-get.js";

export async function estimatesGet(id: string, options: GetOptions, profile?: string) {
  await entityGet("estimate", "Estimate", id, options, profile, [
    { label: "Id", value: e => String(e.Id) },
    { label: "DocNumber", value: e => String(e.DocNumber || "N/A") },
    { label: "Customer", value: e => (e.CustomerRef as Record<string, string>)?.name || "Unknown" },
    { label: "Amount", value: e => e.TotalAmt !== undefined ? `$${e.TotalAmt}` : "" },
    { label: "Status", value: e => String(e.TxnStatus || "") },
    { label: "TxnDate", value: e => String(e.TxnDate || "") },
    { label: "ExpirationDate", value: e => String(e.ExpirationDate || "") },
    { label: "SyncToken", value: e => String(e.SyncToken || "") },
  ]);
}
