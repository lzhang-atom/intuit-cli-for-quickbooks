import { entityOperation } from "../lib/entity-operation.js";
export async function creditmemosDelete(id, profile) {
    const deleted = await entityOperation("creditmemo", "CreditMemo", id, "delete", profile);
    console.log(`Deleted credit memo [${deleted.Id}]`);
}
