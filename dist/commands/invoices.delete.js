import { entityOperation } from "../lib/entity-operation.js";
export async function invoicesDelete(id, profile) {
    const deleted = await entityOperation("invoice", "Invoice", id, "delete", profile);
    console.log(`Deleted invoice [${deleted.Id}]`);
}
