import { entityGet, type GetOptions } from "../lib/entity-get.js";

export async function billsGet(id: string, options: GetOptions, profile?: string) {
  await entityGet("bill", "Bill", id, options, profile, [
    { label: "Id", value: e => String(e.Id) },
    { label: "Vendor", value: e => (e.VendorRef as Record<string, string>)?.name || "Unknown" },
    { label: "Amount", value: e => e.TotalAmt !== undefined ? `$${e.TotalAmt}` : "" },
    { label: "Balance", value: e => e.Balance !== undefined ? `$${e.Balance}` : "" },
    { label: "DueDate", value: e => String(e.DueDate || "") },
    { label: "TxnDate", value: e => String(e.TxnDate || "") },
    { label: "SyncToken", value: e => String(e.SyncToken || "") },
  ]);
}
