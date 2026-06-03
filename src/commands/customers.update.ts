import { entityUpdate } from "../lib/entity-update.js";

export async function customersUpdate(id: string, options: { file?: string; displayName?: string; email?: string; phone?: string }, profile?: string) {
  const fields: Record<string, unknown> = {};
  if (options.displayName) fields.DisplayName = options.displayName;
  if (options.email) fields.PrimaryEmailAddr = { Address: options.email };
  if (options.phone) fields.PrimaryPhone = { FreeFormNumber: options.phone };

  const updated = await entityUpdate("customer", "Customer", id, fields, options.file, profile);
  console.log(`Updated customer [${updated.Id}] ${updated.DisplayName}`);
}
