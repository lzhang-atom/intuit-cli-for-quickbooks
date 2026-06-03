import { intuitGet } from "../lib/intuit-api.js";
import { toCsv } from "../lib/csv.js";
import { toTable } from "../lib/table.js";

export async function companyPreferences(options: { json?: boolean; csv?: boolean }, profile?: string) {
  const data = await intuitGet("preferences", profile);
  const prefs = data.Preferences;

  if (options.json) {
    console.log(JSON.stringify(prefs, null, 2));
    return;
  }

  if (options.csv) {
    console.log(toCsv([prefs]));
    return;
  }

  const other = prefs.OtherPrefs?.NameValue as { Name: string; Value: string }[] | undefined;
  const otherMap: Record<string, string> = {};
  for (const nv of other || []) {
    otherMap[nv.Name] = nv.Value;
  }

  const accounting = prefs.AccountingInfoPrefs || {};
  const salesForms = prefs.SalesFormsPrefs || {};

  const rows = [
    { Setting: "Projects Enabled", Value: otherMap["ProjectsEnabled"] ?? "N/A" },
    { Setting: "Time Tracking Enabled", Value: otherMap["TimeTrackingEnabled"] ?? "N/A" },
    { Setting: "Fiscal Year Start", Value: accounting.FirstMonthOfFiscalYear ?? "N/A" },
    { Setting: "Tax Year Start", Value: accounting.FirstMonthOfIncomeTaxYear ?? "N/A" },
    { Setting: "Accounting Method", Value: accounting.BookCloseDate ? "Accrual" : (salesForms.DefaultTerms?.value ?? "N/A") },
    { Setting: "Custom Fields Enabled", Value: salesForms.UsingProgressInvoicing != null ? String(salesForms.UsingProgressInvoicing) : "N/A" },
    { Setting: "Multi-currency", Value: prefs.CurrencyPrefs?.MultiCurrencyEnabled != null ? String(prefs.CurrencyPrefs.MultiCurrencyEnabled) : "N/A" },
  ];

  console.log("");
  console.log(toTable(rows));
}
