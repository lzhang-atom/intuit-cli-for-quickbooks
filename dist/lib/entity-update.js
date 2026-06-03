import fs from "node:fs";
import { intuitGet, intuitPost } from "./intuit-api.js";
/**
 * Sparse update for a QBO entity.
 * Fetches the current entity to get Id and SyncToken, merges provided fields, and POSTs with sparse: true.
 */
export async function entityUpdate(apiPath, responseKey, id, fields, file, profile) {
    // Get current entity for SyncToken
    const data = await intuitGet(`${apiPath}/${id}`, profile);
    const current = data[responseKey];
    if (!current) {
        throw new Error(`${responseKey} ${id} not found.`);
    }
    let body;
    if (file) {
        let raw;
        try {
            raw = fs.readFileSync(file, "utf-8");
        }
        catch {
            throw new Error(`Cannot read file: ${file}`);
        }
        try {
            body = JSON.parse(raw);
        }
        catch {
            throw new Error(`Invalid JSON in ${file}. Check the file format and try again.`);
        }
    }
    else {
        // Filter out undefined fields
        body = Object.fromEntries(Object.entries(fields).filter(([, v]) => v !== undefined));
        if (Object.keys(body).length === 0) {
            throw new Error("Provide at least one field to update, or use --file for full control.");
        }
    }
    // Inject required fields for sparse update
    body.Id = current.Id;
    body.SyncToken = current.SyncToken;
    body.sparse = true;
    const result = await intuitPost(apiPath, body, profile);
    return result[responseKey];
}
