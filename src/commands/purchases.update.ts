import { entityUpdate } from "../lib/entity-update.js";

export async function purchasesUpdate(id: string, options: { file?: string; amount?: string; paymentType?: string }, profile?: string) {
  const fields: Record<string, unknown> = {};
  if (options.paymentType) fields.PaymentType = options.paymentType;
  if (options.amount) {
    fields.Line = [{
      Amount: parseFloat(options.amount),
      DetailType: "AccountBasedExpenseLineDetail",
      AccountBasedExpenseLineDetail: { AccountRef: { value: "1" } },
    }];
  }

  const updated = await entityUpdate("purchase", "Purchase", id, fields, options.file, profile);
  console.log(`Updated purchase [${updated.Id}]`);
}
