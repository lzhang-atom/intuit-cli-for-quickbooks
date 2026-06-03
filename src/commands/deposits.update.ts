import { entityUpdate } from "../lib/entity-update.js";

export async function depositsUpdate(id: string, options: { file?: string }, profile?: string) {
  const updated = await entityUpdate("deposit", "Deposit", id, {}, options.file, profile);
  console.log(`Updated deposit [${updated.Id}]`);
}
