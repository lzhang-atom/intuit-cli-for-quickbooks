import { graphqlQuery } from "../lib/graphql-api.js";
import { toCsv } from "../lib/csv.js";
import { toTable } from "../lib/table.js";
const QUERY = `
query ActiveCustomDimensionDefinitionsQuery {
  appFoundationsActiveCustomDimensionDefinitions(
    first: 100
    after: null
    last: null
    before: null
  ) {
    edges {
      node {
        id
        label
        active
      }
    }
  }
}`;
export async function dimensionsList(options, profile) {
    const data = await graphqlQuery(QUERY, {}, "ActiveCustomDimensionDefinitionsQuery", profile);
    const result = data.appFoundationsActiveCustomDimensionDefinitions;
    const dims = result.edges.map(e => e.node);
    if (options.json) {
        console.log(JSON.stringify(dims, null, 2));
        return;
    }
    if (dims.length === 0) {
        console.log("No dimension definitions found.");
        return;
    }
    if (options.csv) {
        console.log(toCsv(dims.map(d => ({ Id: d.id, Label: d.label, Active: String(d.active ?? "") }))));
        return;
    }
    const rows = dims.map(d => ({ Id: d.id, Label: d.label, Active: d.active ? "Yes" : "No" }));
    console.log(`Found ${dims.length} dimension definition(s):\n`);
    console.log(toTable(rows));
}
