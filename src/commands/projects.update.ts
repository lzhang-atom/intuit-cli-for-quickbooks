import fs from "fs";
import { graphqlMutation } from "../lib/graphql-api.js";

const MUTATION = `
mutation projectManagementUpdateProject(
  $id: ID!,
  $name: String,
  $description: String,
  $status: ProjectManagement_Status,
  $startDate: DateTime,
  $dueDate: DateTime,
  $customer: ProjectManagement_CustomerInput,
  $priority: Int,
  $completionRate: Decimal,
  $pinned: Boolean
) {
  projectManagementUpdateProject(input: {
    id: $id,
    name: $name,
    description: $description,
    status: $status,
    startDate: $startDate,
    dueDate: $dueDate,
    customer: $customer,
    priority: $priority,
    completionRate: $completionRate,
    pinned: $pinned
  }) {
    ... on ProjectManagement_Project {
      id
      name
      status
      dueDate
    }
  }
}`;

export async function projectsUpdate(
  id: string,
  options: {
    name?: string;
    description?: string;
    status?: string;
    startDate?: string;
    dueDate?: string;
    customerId?: string;
    priority?: number;
    completionRate?: number;
    pinned?: boolean;
    file?: string;
  },
  profile?: string
) {
  let variables: Record<string, unknown>;

  if (options.file) {
    const raw = fs.readFileSync(options.file, "utf-8");
    variables = { id, ...JSON.parse(raw) };
  } else {
    variables = {
      id,
      ...(options.name ? { name: options.name } : {}),
      ...(options.description ? { description: options.description } : {}),
      ...(options.status ? { status: options.status } : {}),
      ...(options.startDate ? { startDate: options.startDate } : {}),
      ...(options.dueDate ? { dueDate: options.dueDate } : {}),
      ...(options.customerId ? { customer: { id: options.customerId } } : {}),
      ...(options.priority != null ? { priority: options.priority } : {}),
      ...(options.completionRate != null ? { completionRate: options.completionRate } : {}),
      ...(options.pinned != null ? { pinned: options.pinned } : {}),
    };
  }

  const data = await graphqlMutation(MUTATION, variables, "projectManagementUpdateProject", profile);
  const project = data.projectManagementUpdateProject as { id: string; name: string; status?: string; dueDate?: string };
  console.log(`Updated project [${project.id}] ${project.name} — status: ${project.status || "—"}, due: ${project.dueDate || "—"}`);
}
