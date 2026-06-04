import fs from "node:fs";
import { intuitPost } from "../lib/intuit-api.js";

export async function itemsCreate(options: { file?: string; name?: string; type?: string; incomeAccountRef?: string; expenseAccountRef?: string }, profile?: string) {
  let body: Record<string, unknown>;

  if (options.file) {
    let raw: string;
    try {
      raw = fs.readFileSync(options.file, "utf-8");
    } catch {
      throw new Error(`Cannot read file: ${options.file}`);
    }
    try {
      body = JSON.parse(raw);
    } catch {
      throw new Error(`Invalid JSON in ${options.file}. Check the file format and try again.`);
    }
  } else if (options.name) {
    const type = options.type || "Service";
    if (type === "Group") {
      throw new Error("Group items cannot be created via the QuickBooks Online API. Create them in the QuickBooks UI instead.");
    }
    if (!["Service", "NonInventory", "Inventory", "Category"].includes(type)) {
      throw new Error("--type must be Service, NonInventory, Inventory, or Category.");
    }

    body = { Name: options.name, Type: type };

    if (type === "Category") {
      if (options.incomeAccountRef || options.expenseAccountRef) {
        throw new Error("Category items cannot have income or expense accounts. Remove --income-account-ref and --expense-account-ref.");
      }
    } else if (type === "Inventory") {
      const missing: string[] = [];
      if (!options.incomeAccountRef) missing.push("--income-account-ref");
      if (!options.expenseAccountRef) missing.push("--expense-account-ref");
      if (missing.length > 0) {
        throw new Error(
          `Inventory items require ${missing.join(" and ")}. ` +
          `Find IDs with: intuit accounts list --where \"AccountType = 'Income'\" (for income) ` +
          `and intuit accounts list --where \"AccountType = 'Cost of Goods Sold'\" (for expense). ` +
          `Inventory also requires an asset account — pass it via --file using AssetAccountRef.`,
        );
      }
      body.IncomeAccountRef = { value: options.incomeAccountRef };
      body.ExpenseAccountRef = { value: options.expenseAccountRef };
      body.AssetAccountRef = { value: options.expenseAccountRef };
      body.TrackQtyOnHand = true;
      body.QtyOnHand = 0;
      body.InvStartDate = new Date().toISOString().split("T")[0];
    } else if (type === "Service") {
      const missing: string[] = [];
      if (!options.incomeAccountRef) missing.push("--income-account-ref");
      if (!options.expenseAccountRef) missing.push("--expense-account-ref");
      if (missing.length > 0) {
        throw new Error(
          `Service items require ${missing.join(" and ")}. ` +
          `Find IDs with: intuit accounts list --where \"AccountType = 'Income'\" (for income) ` +
          `and intuit accounts list --where \"AccountType = 'Expense'\" (for expense).`,
        );
      }
      body.IncomeAccountRef = { value: options.incomeAccountRef };
      body.ExpenseAccountRef = { value: options.expenseAccountRef };
    } else {
      // NonInventory
      if (!options.expenseAccountRef) {
        throw new Error(
          "NonInventory items require --expense-account-ref. " +
          "Find one with: intuit accounts list --where \"AccountType = 'Expense'\". " +
          "Pass --income-account-ref too if you sell this item.",
        );
      }
      body.ExpenseAccountRef = { value: options.expenseAccountRef };
      if (options.incomeAccountRef) body.IncomeAccountRef = { value: options.incomeAccountRef };
    }
  } else {
    throw new Error("Provide --name for a quick create, or --file for full control (inventory tracking, SKU, unit price, etc.).");
  }

  const data = await intuitPost("item", body, profile);
  const item = data.Item;
  console.log(`Created item [${item.Id}] ${item.Name} (${item.Type})`);
}
