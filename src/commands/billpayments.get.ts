import { entityGet, type GetOptions } from "../lib/entity-get.js";

export async function billpaymentsGet(id: string, options: GetOptions, profile?: string) {
  await entityGet("billpayment", "BillPayment", id, options, profile, [
    { label: "Id", value: e => String(e.Id) },
    { label: "Vendor", value: e => (e.VendorRef as Record<string, string>)?.name || "Unknown" },
    { label: "Amount", value: e => e.TotalAmt !== undefined ? `$${e.TotalAmt}` : "" },
    { label: "PayType", value: e => String(e.PayType || "") },
    { label: "TxnDate", value: e => String(e.TxnDate || "") },
    { label: "SyncToken", value: e => String(e.SyncToken || "") },
  ]);
}
