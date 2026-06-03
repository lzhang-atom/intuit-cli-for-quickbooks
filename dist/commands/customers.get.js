import { entityGet } from "../lib/entity-get.js";
export async function customersGet(id, options, profile) {
    await entityGet("customer", "Customer", id, options, profile, [
        { label: "Id", value: e => String(e.Id) },
        { label: "DisplayName", value: e => String(e.DisplayName || "") },
        { label: "Email", value: e => e.PrimaryEmailAddr?.Address || "" },
        { label: "Phone", value: e => e.PrimaryPhone?.FreeFormNumber || "" },
        { label: "Balance", value: e => e.Balance !== undefined ? `$${e.Balance}` : "" },
        { label: "Active", value: e => String(e.Active ?? "") },
        { label: "SyncToken", value: e => String(e.SyncToken || "") },
    ]);
}
