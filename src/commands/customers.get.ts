import { entityGet, type GetOptions } from "../lib/entity-get.js";

export async function customersGet(id: string, options: GetOptions, profile?: string) {
  await entityGet("customer", "Customer", id, options, profile, [
    { label: "Id", value: e => String(e.Id) },
    { label: "DisplayName", value: e => String(e.DisplayName || "") },
    { label: "Email", value: e => (e.PrimaryEmailAddr as Record<string, string>)?.Address || "" },
    { label: "Phone", value: e => (e.PrimaryPhone as Record<string, string>)?.FreeFormNumber || "" },
    { label: "Balance", value: e => e.Balance !== undefined ? `$${e.Balance}` : "" },
    { label: "Active", value: e => String(e.Active ?? "") },
    { label: "SyncToken", value: e => String(e.SyncToken || "") },
  ]);
}
