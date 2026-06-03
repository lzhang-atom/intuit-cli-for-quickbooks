import { entityOperation } from "../lib/entity-operation.js";
export async function paymentsVoid(id, profile) {
    const voided = await entityOperation("payment", "Payment", id, "void", profile);
    console.log(`Voided payment [${voided.Id}] — $${voided.TotalAmt}`);
}
