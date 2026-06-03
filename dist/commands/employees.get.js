import { entityGet } from "../lib/entity-get.js";
export async function employeesGet(id, options, profile) {
    await entityGet("employee", "Employee", id, options, profile, [
        { label: "Id", value: e => String(e.Id) },
        { label: "DisplayName", value: e => String(e.DisplayName || "") },
        { label: "GivenName", value: e => String(e.GivenName || "") },
        { label: "FamilyName", value: e => String(e.FamilyName || "") },
        { label: "Email", value: e => e.PrimaryEmailAddr?.Address || "" },
        { label: "Active", value: e => String(e.Active ?? "") },
        { label: "SyncToken", value: e => String(e.SyncToken || "") },
    ]);
}
