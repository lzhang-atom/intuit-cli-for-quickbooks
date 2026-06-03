import { entityUpdate } from "../lib/entity-update.js";
export async function employeesUpdate(id, options, profile) {
    const fields = {};
    if (options.displayName)
        fields.DisplayName = options.displayName;
    if (options.givenName)
        fields.GivenName = options.givenName;
    if (options.familyName)
        fields.FamilyName = options.familyName;
    if (options.email)
        fields.PrimaryEmailAddr = { Address: options.email };
    const updated = await entityUpdate("employee", "Employee", id, fields, options.file, profile);
    console.log(`Updated employee [${updated.Id}] ${updated.DisplayName}`);
}
