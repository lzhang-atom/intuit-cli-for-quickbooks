import { graphqlQuery } from "../lib/graphql-api.js";
import { toCsv } from "../lib/csv.js";
import { toTable } from "../lib/table.js";

const QUERY = `
query projectManagementProjects(
  $first: PositiveInt!,
  $after: String,
  $filter: ProjectManagement_ProjectFilter!,
  $orderBy: [ProjectManagement_OrderBy!]
) {
  projectManagementProjects(
    first: $first,
    after: $after,
    filter: $filter,
    orderBy: $orderBy
  ) {
    edges {
      node {
        id
        name
        description
        status
        startDate
        dueDate
        completedDate
        priority
        customer { id }
        account { id }
      }
    }
    pageInfo {
      hasNextPage
      endCursor
    }
  }
}`;

type ProjectNode = {
  id: string;
  name: string;
  description?: string;
  status?: string;
  startDate?: string;
  dueDate?: string;
  completedDate?: string;
  priority?: number;
  customer?: { id: string };
  account?: { id: string };
};

export async function projectsList(
  options: {
    json?: boolean;
    csv?: boolean;
    filterStart?: string;
    filterEnd?: string;
    status?: string;
    limit?: number;
    all?: boolean;
  },
  profile?: string
) {
  const startDate = options.filterStart || "2000-01-01T00:00:00.000Z";
  const endDate = options.filterEnd || "2099-12-31T00:00:00.000Z";

  const projects: ProjectNode[] = [];
  let after: string | null = null;
  const pageSize = 100;

  do {
    const variables: Record<string, unknown> = {
      first: pageSize,
      after,
      filter: {
        dueDate: {
          between: { minDate: startDate, maxDate: endDate },
        },
        ...(options.status ? { status: { eq: options.status } } : {}),
      },
      orderBy: ["DUE_DATE_DESC"],
    };

    const data = await graphqlQuery(QUERY, variables, "projectManagementProjects", profile);
    const result = data.projectManagementProjects as {
      edges: { node: ProjectNode }[];
      pageInfo: { hasNextPage: boolean; endCursor: string };
    };

    for (const edge of result.edges) {
      projects.push(edge.node);
    }

    after = result.pageInfo.hasNextPage ? result.pageInfo.endCursor : null;

    if (!options.all && projects.length >= (options.limit || 50)) break;
  } while (after);

  const limited = options.all ? projects : projects.slice(0, options.limit || 50);

  if (options.json) {
    console.log(JSON.stringify(limited, null, 2));
    return;
  }

  if (limited.length === 0) {
    console.log("No projects found.");
    return;
  }

  if (options.csv) {
    const rows = limited.map(p => ({
      Id: p.id,
      Name: p.name,
      Status: p.status || "",
      StartDate: p.startDate || "",
      DueDate: p.dueDate || "",
      Priority: p.priority ?? "",
    }));
    console.log(toCsv(rows));
    return;
  }

  const rows = limited.map(p => ({
    Id: p.id,
    Name: p.name,
    Status: p.status || "—",
    "Due Date": p.dueDate || "—",
    Priority: p.priority ?? "—",
  }));
  console.log(`Found ${limited.length} project(s):\n`);
  console.log(toTable(rows as Record<string, unknown>[]));
}
