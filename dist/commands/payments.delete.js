import { entityOperation } from "../lib/entity-operation.js";
export async function paymentsDelete(id, profile) {
    const deleted = await entityOperation("payment", "Payment", id, "delete", profile);
    console.log(`Deleted payment [${deleted.Id}]`);
}
