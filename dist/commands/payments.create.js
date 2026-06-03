import fs from "node:fs";
import { intuitPost } from "../lib/intuit-api.js";
export async function paymentsCreate(options, profile) {
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
    else if (options.customerRef && options.amount) {
        body = {
            CustomerRef: { value: options.customerRef },
            TotalAmt: parseFloat(options.amount),
        };
    }
    else {
        throw new Error("Provide --customer-ref and --amount for a quick create, or --file for full control (linked invoices, payment method, memo, etc.).");
    }
    const data = await intuitPost("payment", body, profile);
    const payment = data.Payment;
    console.log(`Created payment [${payment.Id}] — $${payment.TotalAmt}`);
}
