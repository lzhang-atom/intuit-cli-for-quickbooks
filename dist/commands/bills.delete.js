import { entityOperation } from "../lib/entity-operation.js";
export async function billsDelete(id, profile) {
    const deleted = await entityOperation("bill", "Bill", id, "delete", profile);
    console.log(`Deleted bill [${deleted.Id}]`);
}
