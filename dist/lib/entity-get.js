import { intuitGet } from "./intuit-api.js";
import { toCsv } from "./csv.js";
import { toTable } from "./table.js";
/**
 * Generic get-by-ID handler. Fetches a single entity and outputs as JSON, CSV, or key-value table.
 */
export async function entityGet(apiPath, responseKey, id, options, profile, fields) {
    const data = await intuitGet(`${apiPath}/${id}`, profile);
    const entity = data[responseKey];
    if (!entity) {
        throw new Error(`${responseKey} ${id} not found.`);
    }
    if (options.json) {
        console.log(JSON.stringify(entity, null, 2));
        return;
    }
    if (options.csv) {
        console.log(toCsv([entity]));
        return;
    }
    // Key-value table display
    if (fields) {
        const rows = fields
            .map(f => ({ Field: f.label, Value: f.value(entity) }))
            .filter(r => r.Value !== "" && r.Value !== undefined);
        console.log("");
        console.log(toTable(rows));
    }
    else {
        // Fallback: display all top-level keys
        const rows = Object.entries(entity)
            .filter(([, v]) => v !== null && v !== undefined)
            .map(([k, v]) => ({
            Field: k,
            Value: typeof v === "object" ? JSON.stringify(v) : String(v),
        }));
        console.log("");
        console.log(toTable(rows));
    }
}
