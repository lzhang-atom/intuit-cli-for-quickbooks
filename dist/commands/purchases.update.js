import { entityUpdate } from "../lib/entity-update.js";
export async function purchasesUpdate(id, options, profile) {
    const fields = {};
    if (options.paymentType)
        fields.PaymentType = options.paymentType;
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
