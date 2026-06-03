import { entityGet } from "../lib/entity-get.js";
export async function depositsGet(id, options, profile) {
    await entityGet("deposit", "Deposit", id, options, profile, [
        { label: "Id", value: e => String(e.Id) },
        { label: "Account", value: e => e.DepositToAccountRef?.name || "" },
        { label: "Amount", value: e => e.TotalAmt !== undefined ? `$${e.TotalAmt}` : "" },
        { label: "TxnDate", value: e => String(e.TxnDate || "") },
        { label: "SyncToken", value: e => String(e.SyncToken || "") },
    ]);
}
