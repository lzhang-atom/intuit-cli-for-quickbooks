import fs from "node:fs";
import { intuitPost } from "../lib/intuit-api.js";

export async function employeesCreate(options: { file?: string; displayName?: string; givenName?: string; familyName?: string; email?: string }, profile?: string) {
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
  } else if (options.givenName && options.familyName) {
    body = {
      GivenName: options.givenName,
      FamilyName: options.familyName,
      DisplayName: options.displayName || `${options.givenName} ${options.familyName}`,
    };
    if (options.email) body.PrimaryEmailAddr = { Address: options.email };
  } else {
    throw new Error("Provide --given-name and --family-name for a quick create, or --file for full control (address, SSN, hire date, etc.).");
  }

  const data = await intuitPost("employee", body, profile);
  const employee = data.Employee;
  console.log(`Created employee [${employee.Id}] ${employee.DisplayName}`);
}
