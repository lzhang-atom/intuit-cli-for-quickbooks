import { entityOperation } from "../lib/entity-operation.js";

export async function salesreceiptsDelete(id: string, profile?: string) {
  const deleted = await entityOperation("salesreceipt", "SalesReceipt", id, "delete", profile);
  console.log(`Deleted sales receipt [${deleted.Id}]`);
}
