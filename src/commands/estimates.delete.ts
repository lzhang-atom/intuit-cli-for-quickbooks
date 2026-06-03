import { entityOperation } from "../lib/entity-operation.js";

export async function estimatesDelete(id: string, profile?: string) {
  const deleted = await entityOperation("estimate", "Estimate", id, "delete", profile);
  console.log(`Deleted estimate [${deleted.Id}]`);
}
