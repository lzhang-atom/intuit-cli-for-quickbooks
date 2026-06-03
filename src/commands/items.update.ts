import { entityUpdate } from "../lib/entity-update.js";

export async function itemsUpdate(id: string, options: { file?: string; name?: string; type?: string }, profile?: string) {
  const fields: Record<string, unknown> = {};
  if (options.name) fields.Name = options.name;
  if (options.type) fields.Type = options.type;

  const updated = await entityUpdate("item", "Item", id, fields, options.file, profile);
  console.log(`Updated item [${updated.Id}] ${updated.Name}`);
}
