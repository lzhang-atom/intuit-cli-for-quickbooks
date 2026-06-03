import fs from "fs";
import { graphqlMutation } from "../lib/graphql-api.js";
import { tokenStore } from "../lib/token-store.js";

const MUTATION = `
mutation ProjectManagementCreateProject(
  $name: String!,
  $description: String,
  $startDate: DateTime,
  $dueDate: DateTime!,
  $status: ProjectManagement_Status,
  $customer: ProjectManagement_CustomerInput,
  $account: ProjectManagement_CompanyInput!,
  $priority: Int,
  $pinned: Boolean,
  $completionRate: Decimal
) {
  projectManagementCreateProject(input: {
    name: $name,
    description: $description,
    startDate: $startDate,
    dueDate: $dueDate,
    status: $status,
    customer: $customer,
    account: $account,
    priority: $priority,
    pinned: $pinned,
    completionRate: $completionRate,
  }) {
    ... on ProjectManagement_Project {
      id
      name
      status
      dueDate
    }
  }
}`;

export async function projectsCreate(
  options: {
    name?: string;
    dueDate?: string;
    startDate?: string;
    customerId?: string;
    status?: string;
    description?: string;
    priority?: number;
    file?: string;
    dryRun?: boolean;
    idempotencyTag?: string;
  },
  profile?: string
) {
  let variables: Record<string, unknown>;

  if (options.file) {
    const raw = fs.readFileSync(options.file, "utf-8");
    variables = JSON.parse(raw);
  } else {
    if (!options.name) throw new Error("--name is required (or use --file)");
    if (!options.dueDate) throw new Error("--due-date is required (or use --file)");

    // realmId is the QBO company ID — auto-resolved from the active token
    const token = await tokenStore.getValidToken(profile);
    if (!token.realmId) throw new Error("No realmId found in token. Run 'intuit auth login' first.");

    variables = {
      name: options.name,
      dueDate: options.dueDate,
      account: { id: token.realmId },
      ...(options.startDate ? { startDate: options.startDate } : {}),
      ...(options.customerId ? { customer: { id: options.customerId } } : {}),
      ...(options.status ? { status: options.status } : { status: "OPEN" }),
      ...(options.description ? { description: options.description } : {}),
      ...(options.priority != null ? { priority: options.priority } : {}),
    };
  }

  if (options.idempotencyTag) {
    const marker = ` [via Intuit CLI · run ${options.idempotencyTag}]`;
    const existing = typeof variables.description === "string" ? variables.description : "";
    variables.description = existing ? `${existing}${marker}` : marker.trimStart();
  }

  if (options.dryRun) {
    console.log("[dry-run] GraphQL ProjectManagementCreateProject");
    console.log(JSON.stringify(variables, null, 2));
    return;
  }

  const data = await graphqlMutation(MUTATION, variables, "ProjectManagementCreateProject", profile);
  const project = data.projectManagementCreateProject as { id: string; name: string; status?: string; dueDate?: string };
  console.log(`Created project [${project.id}] ${project.name} — status: ${project.status || "OPEN"}, due: ${project.dueDate || "—"}`);
}
