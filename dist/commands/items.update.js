import { entityUpdate } from "../lib/entity-update.js";
export async function itemsUpdate(id, options, profile) {
    const fields = {};
    if (options.name)
        fields.Name = options.name;
    if (options.type)
        fields.Type = options.type;
    const updated = await entityUpdate("item", "Item", id, fields, options.file, profile);
    console.log(`Updated item [${updated.Id}] ${updated.Name}`);
}
