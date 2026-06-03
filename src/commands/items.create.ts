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
    if (!["Service", "NonInventory", "Inventory", "Category"].includes(type)) {
      throw new Error("--type must be Service, NonInventory, Inventory, or Category.");
    }

    body = { Name: options.name, Type: type };

    if (type === "Category") {
      // Category only needs Name and Type
    } else if (type === "Inventory") {
      if (!options.incomeAccountRef || !options.expenseAccountRef) {
        throw new Error("Inventory items require --income-account-ref and --expense-account-ref.");
      }
      body.IncomeAccountRef = { value: options.incomeAccountRef };
      body.ExpenseAccountRef = { value: options.expenseAccountRef };
      body.AssetAccountRef = { value: options.expenseAccountRef };
      body.TrackQtyOnHand = true;
      body.QtyOnHand = 0;
      body.InvStartDate = new Date().toISOString().split("T")[0];
    } else {
      // Service or NonInventory
      if (options.incomeAccountRef) body.IncomeAccountRef = { value: options.incomeAccountRef };
      if (options.expenseAccountRef) body.ExpenseAccountRef = { value: options.expenseAccountRef };
    }
  } else {
    throw new Error("Provide --name for a quick create, or --file for full control (inventory tracking, SKU, unit price, etc.).");
  }

  const data = await intuitPost("item", body, profile);
  const item = data.Item;
  console.log(`Created item [${item.Id}] ${item.Name} (${item.Type})`);
}
