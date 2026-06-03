import { entityUpdate } from "../lib/entity-update.js";

export async function employeesUpdate(id: string, options: { file?: string; displayName?: string; givenName?: string; familyName?: string; email?: string }, profile?: string) {
  const fields: Record<string, unknown> = {};
  if (options.displayName) fields.DisplayName = options.displayName;
  if (options.givenName) fields.GivenName = options.givenName;
  if (options.familyName) fields.FamilyName = options.familyName;
  if (options.email) fields.PrimaryEmailAddr = { Address: options.email };

  const updated = await entityUpdate("employee", "Employee", id, fields, options.file, profile);
  console.log(`Updated employee [${updated.Id}] ${updated.DisplayName}`);
}
