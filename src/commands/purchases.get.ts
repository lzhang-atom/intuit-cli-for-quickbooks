import { entityGet, type GetOptions } from "../lib/entity-get.js";

export async function purchasesGet(id: string, options: GetOptions, profile?: string) {
  await entityGet("purchase", "Purchase", id, options, profile, [
    { label: "Id", value: e => String(e.Id) },
    { label: "PaymentType", value: e => String(e.PaymentType || "") },
    { label: "Account", value: e => (e.AccountRef as Record<string, string>)?.name || "" },
    { label: "Amount", value: e => e.TotalAmt !== undefined ? `$${e.TotalAmt}` : "" },
    { label: "TxnDate", value: e => String(e.TxnDate || "") },
    { label: "SyncToken", value: e => String(e.SyncToken || "") },
  ]);
}
