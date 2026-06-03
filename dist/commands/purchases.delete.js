import { entityOperation } from "../lib/entity-operation.js";
export async function purchasesDelete(id, profile) {
    const deleted = await entityOperation("purchase", "Purchase", id, "delete", profile);
    console.log(`Deleted purchase [${deleted.Id}]`);
}
