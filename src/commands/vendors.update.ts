import { entityUpdate } from "../lib/entity-update.js";

export async function vendorsUpdate(id: string, options: { file?: string; displayName?: string; email?: string; phone?: string }, profile?: string) {
  const fields: Record<string, unknown> = {};
  if (options.displayName) fields.DisplayName = options.displayName;
  if (options.email) fields.PrimaryEmailAddr = { Address: options.email };
  if (options.phone) fields.PrimaryPhone = { FreeFormNumber: options.phone };

  const updated = await entityUpdate("vendor", "Vendor", id, fields, options.file, profile);
  console.log(`Updated vendor [${updated.Id}] ${updated.DisplayName}`);
}
