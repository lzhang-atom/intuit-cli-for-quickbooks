import { entityOperation } from "../lib/entity-operation.js";
export async function depositsDelete(id, profile) {
    const deleted = await entityOperation("deposit", "Deposit", id, "delete", profile);
    console.log(`Deleted deposit [${deleted.Id}]`);
}
