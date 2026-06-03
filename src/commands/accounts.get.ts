import { entityGet, type GetOptions } from "../lib/entity-get.js";

export async function accountsGet(id: string, options: GetOptions, profile?: string) {
  await entityGet("account", "Account", id, options, profile, [
    { label: "Id", value: e => String(e.Id) },
    { label: "Name", value: e => String(e.Name || "") },
    { label: "AccountType", value: e => String(e.AccountType || "") },
    { label: "AccountSubType", value: e => String(e.AccountSubType || "") },
    { label: "CurrentBalance", value: e => e.CurrentBalance !== undefined ? `$${e.CurrentBalance}` : "" },
    { label: "Active", value: e => String(e.Active ?? "") },
    { label: "SyncToken", value: e => String(e.SyncToken || "") },
  ]);
}
