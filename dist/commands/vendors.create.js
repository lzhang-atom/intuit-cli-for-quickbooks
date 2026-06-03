import fs from "node:fs";
import { intuitPost } from "../lib/intuit-api.js";
export async function vendorsCreate(options, profile) {
    let body;
    if (options.file) {
        let raw;
        try {
            raw = fs.readFileSync(options.file, "utf-8");
        }
        catch {
            throw new Error(`Cannot read file: ${options.file}`);
        }
        try {
            body = JSON.parse(raw);
        }
        catch {
            throw new Error(`Invalid JSON in ${options.file}. Check the file format and try again.`);
        }
    }
    else if (options.displayName) {
        body = { DisplayName: options.displayName };
        if (options.email)
            body.PrimaryEmailAddr = { Address: options.email };
        if (options.phone)
            body.PrimaryPhone = { FreeFormNumber: options.phone };
    }
    else {
        throw new Error("Provide --display-name for a quick create, or --file for full control (addresses, tax info, payment terms, etc.).");
    }
    if (options.idempotencyTag) {
        const marker = ` [via Intuit CLI · run ${options.idempotencyTag}]`;
        const existing = typeof body.Notes === "string" ? body.Notes : "";
        body.Notes = existing ? `${existing}${marker}` : marker.trimStart();
    }
    if (options.dryRun) {
        console.log("[dry-run] POST /vendor");
        console.log(JSON.stringify(body, null, 2));
        return;
    }
    const data = await intuitPost("vendor", body, profile);
    const vendor = data.Vendor;
    console.log(`Created vendor [${vendor.Id}] ${vendor.DisplayName}`);
}
