import { intuitQueryPaginated } from "../lib/intuit-api.js";
import { toCsv } from "../lib/csv.js";
import { toTable } from "../lib/table.js";
export async function accountsList(options, profile) {
    const accounts = await intuitQueryPaginated("Account", options, profile);
    if (options.json) {
        console.log(JSON.stringify(accounts, null, 2));
        return;
    }
    if (options.csv) {
        console.log(toCsv(accounts));
        return;
    }
    if (accounts.length === 0) {
        console.log("No accounts found.");
        return;
    }
    const rows = accounts.map(a => ({
        Id: a.Id,
        Name: a.Name,
        Type: `${a.AccountType}${a.AccountSubType ? `/${a.AccountSubType}` : ""}`,
        Balance: a.CurrentBalance !== undefined ? `$${a.CurrentBalance}` : "",
        Active: a.Active === false ? "No" : "Yes",
    }));
    console.log(`Found ${accounts.length} account(s):\n`);
    console.log(toTable(rows));
}
