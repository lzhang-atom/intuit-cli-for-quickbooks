import { entityOperation } from "../lib/entity-operation.js";

export async function invoicesVoid(id: string, profile?: string) {
  const voided = await entityOperation("invoice", "Invoice", id, "void", profile);
  console.log(`Voided invoice [${voided.Id}] #${voided.DocNumber || "N/A"} — balance: $${voided.Balance}`);
}
