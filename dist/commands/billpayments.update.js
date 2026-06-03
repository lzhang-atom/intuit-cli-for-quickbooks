import { entityUpdate } from "../lib/entity-update.js";
export async function billpaymentsUpdate(id, options, profile) {
    const updated = await entityUpdate("billpayment", "BillPayment", id, {}, options.file, profile);
    console.log(`Updated bill payment [${updated.Id}]`);
}
