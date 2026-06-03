import { intuitGet, intuitPost } from "../lib/intuit-api.js";
const SUPPORTED_ENTITIES = {
    invoice: { apiPath: "invoice", responseKey: "Invoice" },
    estimate: { apiPath: "estimate", responseKey: "Estimate" },
    bill: { apiPath: "bill", responseKey: "Bill" },
    salesreceipt: { apiPath: "salesreceipt", responseKey: "SalesReceipt" },
    purchase: { apiPath: "purchase", responseKey: "Purchase" },
};
export async function projectsAttach(options, profile) {
    const entityDef = SUPPORTED_ENTITIES[options.entity.toLowerCase()];
    if (!entityDef) {
        throw new Error(`Unsupported entity "${options.entity}". Supported: ${Object.keys(SUPPORTED_ENTITIES).join(", ")}`);
    }
    const data = await intuitGet(`${entityDef.apiPath}/${options.entityId}`, profile);
    const txn = data[entityDef.responseKey];
    if (!txn)
        throw new Error(`${entityDef.responseKey} ${options.entityId} not found.`);
    const lines = txn.Line || [];
    const docNum = txn.DocNumber ? ` #${txn.DocNumber}` : "";
    const totalAmt = txn.TotalAmt ? ` — $${txn.TotalAmt}` : "";
    if (options.dryRun) {
        console.log(`\nProject to attach: [${options.projectId}]`);
        console.log(`Will set ProjectRef on ${options.entity}${docNum}${totalAmt} [${options.entityId}] at the transaction level.\n`);
        console.log(`  Transaction: ${options.entity}${docNum}${totalAmt}`);
        console.log(`  Lines: ${lines.length} (ProjectRef is a header-level field — applies to the whole transaction)\n`);
        console.log(`Use --file with intuit ${options.entity}s create/update for line-level ProjectRef on individual bill/purchase lines.`);
        console.log(`\nRun without --dry-run to apply.`);
        return;
    }
    const body = {
        ...txn,
        ProjectRef: { value: String(options.projectId) },
        Id: txn.Id,
        SyncToken: txn.SyncToken,
        sparse: true,
    };
    const result = await intuitPost(entityDef.apiPath, body, profile);
    const updated = result[entityDef.responseKey];
    console.log(`Attached project [${options.projectId}] to ${options.entity} [${updated.Id}]${docNum}${totalAmt}`);
}
