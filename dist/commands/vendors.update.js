import { entityUpdate } from "../lib/entity-update.js";
export async function vendorsUpdate(id, options, profile) {
    const fields = {};
    if (options.displayName)
        fields.DisplayName = options.displayName;
    if (options.email)
        fields.PrimaryEmailAddr = { Address: options.email };
    if (options.phone)
        fields.PrimaryPhone = { FreeFormNumber: options.phone };
    const updated = await entityUpdate("vendor", "Vendor", id, fields, options.file, profile);
    console.log(`Updated vendor [${updated.Id}] ${updated.DisplayName}`);
}
