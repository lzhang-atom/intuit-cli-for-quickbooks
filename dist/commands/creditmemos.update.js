import { entityUpdate } from "../lib/entity-update.js";
export async function creditmemosUpdate(id, options, profile) {
    const fields = {};
    if (options.customerRef)
        fields.CustomerRef = { value: options.customerRef };
    if (options.amount) {
        fields.Line = [{
                Amount: parseFloat(options.amount),
                DetailType: "SalesItemLineDetail",
                SalesItemLineDetail: { ItemRef: { value: options.itemRef || "1" } },
            }];
    }
    const updated = await entityUpdate("creditmemo", "CreditMemo", id, fields, options.file, profile);
    console.log(`Updated credit memo [${updated.Id}] #${updated.DocNumber || "N/A"}`);
}
