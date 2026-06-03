import { graphqlQuery } from "../lib/graphql-api.js";
import { toTable } from "../lib/table.js";

const QUERY = `
query projectManagementProject($id: ID!) {
  projectManagementProject(id: $id) {
    id
    name
    description
    status
    startDate
    dueDate
    completedDate
    priority
    pinned
    completionRate
    customer { id }
    account { id }
  }
}`;

export async function projectsGet(id: string, options: { json?: boolean }, profile?: string) {
  const data = await graphqlQuery(QUERY, { id }, "projectManagementProject", profile);
  const project = data.projectManagementProject as Record<string, unknown>;

  if (!project) {
    throw new Error(`Project ${id} not found.`);
  }

  if (options.json) {
    console.log(JSON.stringify(project, null, 2));
    return;
  }

  const customer = project.customer as { id?: string } | undefined;
  const account = project.account as { id?: string } | undefined;

  const rows = [
    { Field: "Id", Value: String(project.id ?? "") },
    { Field: "Name", Value: String(project.name ?? "") },
    { Field: "Description", Value: String(project.description ?? "—") },
    { Field: "Status", Value: String(project.status ?? "—") },
    { Field: "Start Date", Value: String(project.startDate ?? "—") },
    { Field: "Due Date", Value: String(project.dueDate ?? "—") },
    { Field: "Completed Date", Value: String(project.completedDate ?? "—") },
    { Field: "Priority", Value: project.priority != null ? String(project.priority) : "—" },
    { Field: "Completion Rate", Value: project.completionRate != null ? `${project.completionRate}%` : "—" },
    { Field: "Pinned", Value: project.pinned != null ? String(project.pinned) : "—" },
    { Field: "Customer Id", Value: customer?.id ?? "—" },
    { Field: "Account Id", Value: account?.id ?? "—" },
  ];

  console.log("");
  console.log(toTable(rows));
}
