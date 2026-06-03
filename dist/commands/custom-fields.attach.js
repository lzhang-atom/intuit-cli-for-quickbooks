import fs from "fs";
import { intuitGet, intuitPost } from "../lib/intuit-api.js";
import { graphqlQuery } from "../lib/graphql-api.js";
const SUPPORTED_ENTITIES = {
    invoice: { apiPath: "invoice", responseKey: "Invoice" },
    estimate: { apiPath: "estimate", responseKey: "Estimate" },
    bill: { apiPath: "bill", responseKey: "Bill" },
    salesreceipt: { apiPath: "salesreceipt", responseKey: "SalesReceipt" },
    purchase: { apiPath: "purchase", responseKey: "Purchase" },
    customer: { apiPath: "customer", responseKey: "Customer" },
};
const CF_QUERY = `
query appFoundationsCustomFieldDefinitions {
  appFoundationsCustomFieldDefinitions {
    edges {
      node {
        id
        legacyIDV2
        label
        dataType
      }
    }
  }
}`;
function buildCustomFieldEntry(legacyId, value, dataType) {
    const entry = { DefinitionId: legacyId };
    const type = (dataType || "STRING").toUpperCase();
    if (type === "NUMBER") {
        entry.NumericValue = parseFloat(value);
    }
    else if (type === "DATE") {
        entry.DateValue = value;
    }
    else if (type === "BOOLEAN") {
        entry.BooleanValue = value.toLowerCase() === "true";
    }
    else {
        entry.StringValue = value;
    }
    return entry;
}
export async function customFieldsAttach(options, profile) {
    const entityDef = SUPPORTED_ENTITIES[options.entity.toLowerCase()];
    if (!entityDef) {
        throw new Error(`Unsupported entity "${options.entity}". Supported: ${Object.keys(SUPPORTED_ENTITIES).join(", ")}`);
    }
    // Resolve custom field inputs — flags or file
    let inputs;
    if (options.file) {
        const raw = fs.readFileSync(options.file, "utf-8");
        inputs = JSON.parse(raw);
    }
    else {
        if (!options.definitionId)
            throw new Error("--definition-id is required (or use --file)");
        if (!options.value)
            throw new Error("--value is required (or use --file)");
        inputs = [{ definitionId: options.definitionId, value: options.value }];
    }
    // Fetch all CF definitions to resolve legacyIDV2 and dataType
    const cfData = await graphqlQuery(CF_QUERY, {}, "appFoundationsCustomFieldDefinitions", profile);
    const cfNodes = cfData.appFoundationsCustomFieldDefinitions.edges.map(e => e.node);
    const resolved = inputs.map(input => {
        const def = cfNodes.find(n => n.id === input.definitionId || n.legacyIDV2 === input.definitionId);
        if (!def)
            throw new Error(`Custom field definition "${input.definitionId}" not found. Run 'intuit custom-fields list' to see available definitions.`);
        return { def, value: input.value };
    });
    // Fetch the transaction
    const data = await intuitGet(`${entityDef.apiPath}/${options.entityId}?include=enhancedAllCustomFields`, profile);
    const txn = data[entityDef.responseKey];
    if (!txn)
        throw new Error(`${entityDef.responseKey} ${options.entityId} not found.`);
    const docNum = txn.DocNumber ? ` #${txn.DocNumber}` : "";
    const totalAmt = txn.TotalAmt ? ` — $${txn.TotalAmt}` : "";
    if (options.dryRun) {
        console.log(`\nCustom field(s) to attach to ${options.entity}${docNum}${totalAmt} [${options.entityId}]:\n`);
        for (const { def, value } of resolved) {
            console.log(`  "${def.label}" (${def.dataType || "STRING"})  →  ${value}`);
        }
        if (options.file) {
            console.log(`\nSource: ${options.file}`);
        }
        else {
            console.log(`\nUse --file to attach multiple custom fields in one command.`);
            console.log(`File format: [{ "definitionId": "<id>", "value": "<value>" }, ...]`);
        }
        console.log(`\nRun without --dry-run to apply.`);
        return;
    }
    // Merge with existing CustomField array on the entity
    const existing = txn.CustomField || [];
    const newEntries = resolved.map(({ def, value }) => buildCustomFieldEntry(def.legacyIDV2 || def.id, value, def.dataType));
    // Replace existing entries for same DefinitionId, add new ones
    const merged = [...existing];
    for (const entry of newEntries) {
        const idx = merged.findIndex(e => e.DefinitionId === entry.DefinitionId);
        if (idx >= 0)
            merged[idx] = entry;
        else
            merged.push(entry);
    }
    const body = {
        CustomField: merged,
        Id: txn.Id,
        SyncToken: txn.SyncToken,
        sparse: true,
    };
    const result = await intuitPost(`${entityDef.apiPath}?include=enhancedAllCustomFields`, body, profile);
    const updated = result[entityDef.responseKey];
    const appliedFields = resolved.map(({ def }) => `"${def.label}"`).join(", ");
    console.log(`Attached custom field(s) ${appliedFields} to ${options.entity} [${updated.Id}]${docNum}${totalAmt}`);
}
