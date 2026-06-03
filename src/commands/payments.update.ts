import { entityUpdate } from "../lib/entity-update.js";

export async function paymentsUpdate(id: string, options: { file?: string; customerRef?: string; amount?: string }, profile?: string) {
  const fields: Record<string, unknown> = {};
  if (options.customerRef) fields.CustomerRef = { value: options.customerRef };
  if (options.amount) fields.TotalAmt = parseFloat(options.amount);

  const updated = await entityUpdate("payment", "Payment", id, fields, options.file, profile);
  console.log(`Updated payment [${updated.Id}] — $${updated.TotalAmt}`);
}
