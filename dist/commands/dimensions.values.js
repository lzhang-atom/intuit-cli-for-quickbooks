import { graphqlQuery } from "../lib/graphql-api.js";
import { toCsv } from "../lib/csv.js";
import { toTable } from "../lib/table.js";
const QUERY = `
query GetActiveCustomDimensionValues(
  $first: Int,
  $after: String,
  $filters: AppFoundations_ActiveCustomDimensionValuesFilterBy!
) {
  appFoundationsActiveCustomDimensionValues(
    first: $first
    after: $after
    filters: $filters
  ) {
    edges {
      node {
        id
        definitionId
        label
        active
        parentId
        fullyQualifiedLabel
        level
      }
    }
    pageInfo {
      hasNextPage
      endCursor
    }
    totalCount
  }
}`;
export async function dimensionsValues(definitionId, options, profile) {
    const values = [];
    let after = null;
    do {
        const data = await graphqlQuery(QUERY, { first: 100, after, filters: { definitionId, parentId: null } }, "GetActiveCustomDimensionValues", profile);
        const result = data.appFoundationsActiveCustomDimensionValues;
        for (const edge of result.edges)
            values.push(edge.node);
        after = result.pageInfo.hasNextPage ? result.pageInfo.endCursor : null;
    } while (after);
    if (options.json) {
        console.log(JSON.stringify(values, null, 2));
        return;
    }
    if (values.length === 0) {
        console.log("No dimension values found.");
        return;
    }
    if (options.csv) {
        console.log(toCsv(values.map(v => ({
            Id: v.id,
            Label: v.label,
            FullLabel: v.fullyQualifiedLabel || "",
            Level: String(v.level ?? ""),
            Active: String(v.active ?? ""),
        }))));
        return;
    }
    const rows = values.map(v => ({
        Id: v.id,
        Label: v.label,
        "Full Label": v.fullyQualifiedLabel || v.label,
        Level: v.level ?? "—",
        Active: v.active ? "Yes" : "No",
    }));
    console.log(`Found ${values.length} value(s) for dimension ${definitionId}:\n`);
    console.log(toTable(rows));
}
