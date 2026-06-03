import { entityGet } from "../lib/entity-get.js";
export async function itemsGet(id, options, profile) {
    await entityGet("item", "Item", id, options, profile, [
        { label: "Id", value: e => String(e.Id) },
        { label: "Name", value: e => String(e.Name || "") },
        { label: "Type", value: e => String(e.Type || "") },
        { label: "UnitPrice", value: e => e.UnitPrice !== undefined ? `$${e.UnitPrice}` : "" },
        { label: "Active", value: e => String(e.Active ?? "") },
        { label: "SyncToken", value: e => String(e.SyncToken || "") },
    ]);
}
