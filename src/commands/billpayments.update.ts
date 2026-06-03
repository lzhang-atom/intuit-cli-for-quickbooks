import { entityUpdate } from "../lib/entity-update.js";

export async function billpaymentsUpdate(id: string, options: { file?: string }, profile?: string) {
  const updated = await entityUpdate("billpayment", "BillPayment", id, {}, options.file, profile);
  console.log(`Updated bill payment [${updated.Id}]`);
}
