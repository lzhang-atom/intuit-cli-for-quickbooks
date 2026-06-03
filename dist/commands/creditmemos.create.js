import fs from "node:fs";
import { intuitPost } from "../lib/intuit-api.js";
export async function creditmemosCreate(options, profile) {
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
    else if (options.customerRef) {
        const line = {
            Amount: parseFloat(options.amount || "0"),
            DetailType: "SalesItemLineDetail",
            SalesItemLineDetail: {
                ItemRef: { value: options.itemRef || "1" },
            },
        };
        body = {
            CustomerRef: { value: options.customerRef },
            Line: [line],
        };
    }
    else {
        throw new Error("Provide --customer-ref for a simple single-line credit memo, or --file for full control (multi-line items, descriptions, tax, etc.).");
    }
    const data = await intuitPost("creditmemo", body, profile);
    const memo = data.CreditMemo;
    console.log(`Created credit memo [${memo.Id}] #${memo.DocNumber || "N/A"} — $${memo.TotalAmt}`);
}
