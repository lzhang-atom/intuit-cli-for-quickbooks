import { graphqlQuery } from "../lib/graphql-api.js";
import { toCsv } from "../lib/csv.js";
import { toTable } from "../lib/table.js";
const QUERY = `
query appFoundationsCustomFieldDefinitions {
  appFoundationsCustomFieldDefinitions {
    edges {
      node {
        id
        legacyIDV2
        label
        dataType
        active
        associations {
          associatedEntity
          active
          associationCondition
        }
        dropDownOptions {
          id
          value
          active
        }
      }
    }
  }
}`;
export async function customFieldsList(options, profile) {
    const data = await graphqlQuery(QUERY, {}, "appFoundationsCustomFieldDefinitions", profile);
    const result = data.appFoundationsCustomFieldDefinitions;
    const fields = result.edges.map(e => e.node);
    if (options.json) {
        console.log(JSON.stringify(fields, null, 2));
        return;
    }
    if (fields.length === 0) {
        console.log("No custom field definitions found.");
        return;
    }
    if (options.csv) {
        const rows = fields.map(f => ({
            Id: f.id,
            LegacyIdV2: f.legacyIDV2 || "",
            Label: f.label,
            DataType: f.dataType || "",
            Active: String(f.active ?? ""),
            Entities: (f.associations || []).map(a => a.associatedEntity).join("|"),
        }));
        console.log(toCsv(rows));
        return;
    }
    const rows = fields.map(f => ({
        Id: f.id,
        Label: f.label,
        Type: f.dataType || "—",
        Active: f.active ? "Yes" : "No",
        Entities: (f.associations || []).filter(a => a.active).map(a => a.associatedEntity).join(", ") || "—",
    }));
    console.log(`Found ${fields.length} custom field definition(s):\n`);
    console.log(toTable(rows));
}
