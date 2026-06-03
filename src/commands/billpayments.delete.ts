import { entityOperation } from "../lib/entity-operation.js";

export async function billpaymentsDelete(id: string, profile?: string) {
  const deleted = await entityOperation("billpayment", "BillPayment", id, "delete", profile);
  console.log(`Deleted bill payment [${deleted.Id}]`);
}
