import { intuitQuery } from "../lib/intuit-api.js";
import { toCsv } from "../lib/csv.js";
import { toTable } from "../lib/table.js";
export async function companyInfo(options, profile) {
    const data = await intuitQuery("SELECT * FROM CompanyInfo", profile);
    const info = data.QueryResponse?.CompanyInfo?.[0];
    if (options.json) {
        console.log(JSON.stringify(info, null, 2));
        return;
    }
    if (options.csv) {
        console.log(toCsv([info]));
        return;
    }
    const addr = info.CompanyAddr;
    const address = addr
        ? [addr.Line1, addr.City, addr.CountrySubDivisionCode, addr.PostalCode].filter(Boolean).join(", ")
        : "";
    const rows = [
        { Field: "Company", Value: info.CompanyName },
        ...(info.LegalName && info.LegalName !== info.CompanyName ? [{ Field: "Legal Name", Value: info.LegalName }] : []),
        ...(address ? [{ Field: "Address", Value: address }] : []),
        ...(info.Email?.Address ? [{ Field: "Email", Value: info.Email.Address }] : []),
        ...(info.PrimaryPhone?.FreeFormNumber ? [{ Field: "Phone", Value: info.PrimaryPhone.FreeFormNumber }] : []),
        ...(info.FiscalYearStartMonth ? [{ Field: "Fiscal Year Start", Value: `Month ${info.FiscalYearStartMonth}` }] : []),
        { Field: "Country", Value: info.Country || "N/A" },
    ];
    console.log("");
    console.log(toTable(rows));
}
