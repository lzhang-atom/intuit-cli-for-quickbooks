import fs from "fs";
import { graphqlMutation, graphqlQuery } from "../lib/graphql-api.js";

// QBO requires legacyIDV2 on update — it's derived from the id (udcf_<legacy>).
// Strip the udcf_ prefix if present; otherwise treat the input as already legacy.
function deriveLegacyId(id: string): string {
  return id.startsWith("udcf_") ? id.slice("udcf_".length) : id;
}

// See custom-fields.create.ts for full mapping rationale. Update only changes
// the transactions list (category is immutable post-create per QBO server),
// so we just need the transaction-name → subtype map.
const TRANSACTION_TO_SUBTYPE: Record<string, string> = {
  "invoice":            "SALE_INVOICE",
  "estimate":           "SALE_ESTIMATE",
  "sales-receipt":      "SALE",
  "credit-memo":        "SALE_CREDIT",
  "refund-receipt":     "SALE_REFUND",
  "sales-order":        "SALE_ORDER",
  "bill":               "PURCHASE_BILL",
  "expense":            "PURCHASE",
  "check":              "PURCHASE_CHECK",
  "purchase-order":     "PURCHASE_ORDER",
  "vendor-credit":      "PURCHASE_CREDIT",
  "credit-card-credit": "PURCHASE_CREDIT_CARD_CREDIT",
};

const MUTATION = `
mutation AppFoundationsUpdateCustomFieldDefinition(
  $input: AppFoundations_CustomFieldDefinitionUpdateInput!
) {
  appFoundationsUpdateCustomFieldDefinition(input: $input) {
    id
    label
    dataType
    active
    associations {
      associatedEntity
      active
      associationCondition
      validationOptions { required }
      allowedOperations
      subAssociations {
        associatedEntity
        active
        allowedOperations
      }
    }
    dropDownOptions {
      id
      value
      active
      order
    }
  }
}`;

type SubAssoc = { associatedEntity: string; active: boolean; allowedOperations: string[] };
type Association = {
  associatedEntity: string;
  active: boolean;
  associationCondition: string;
  validationOptions: { required: boolean };
  allowedOperations: string[];
  subAssociations: SubAssoc[];
};

type UpdateInput = {
  id: string;
  legacyIDV2: string;
  label?: string;
  active?: boolean;
  associations?: Association[];
};

const FETCH_QUERY = `
query appFoundationsCustomFieldDefinitions {
  appFoundationsCustomFieldDefinitions {
    edges {
      node {
        id
        legacyIDV2
        label
        active
        associations {
          associatedEntity
          active
          associationCondition
          validationOptions { required }
          allowedOperations
          subAssociations {
            associatedEntity
            active
            allowedOperations
          }
        }
      }
    }
  }
}`;

async function fetchField(id: string, profile?: string): Promise<{ label: string; active: boolean; associations: Association[] }> {
  const data = await graphqlQuery(FETCH_QUERY, {}, "appFoundationsCustomFieldDefinitions", profile);
  const result = data.appFoundationsCustomFieldDefinitions as { edges: { node: { id: string; label: string; active: boolean; associations: Association[] } }[] };
  const node = result.edges.find((e) => e.node.id === id)?.node;
  if (!node) throw new Error(`Custom field "${id}" not found.`);
  return { label: node.label, active: node.active, associations: node.associations };
}

export async function customFieldsUpdate(
  id: string,
  options: {
    label?: string;
    active?: boolean;
    category?: string;
    dataType?: string;
    transactions?: string[];
    file?: string;
    dryRun?: boolean;
  },
  profile?: string,
) {
  if (options.dataType) {
    throw new Error(
      `Cannot change --data-type on an existing field. Data type is set at create time and is immutable. ` +
      `To change data type, deactivate this field with --active false and create a new one.`,
    );
  }
  let input: UpdateInput;

  const legacyIDV2 = deriveLegacyId(id);

  if (options.file) {
    const raw = fs.readFileSync(options.file, "utf-8");
    const parsed = JSON.parse(raw);
    input = { id, legacyIDV2, ...(parsed.input ?? parsed) };
    if (!input.id) input.id = id;
    if (!input.legacyIDV2) input.legacyIDV2 = legacyIDV2;
  } else {
    // The update mutation is a full-replace, not a partial PATCH — it requires
    // label and associations even when you're only toggling active. Fetch the
    // current state first and merge in user-specified changes on top.
    const existing = await fetchField(id, profile);
    input = {
      id,
      legacyIDV2,
      label: existing.label,
      active: existing.active,
      associations: existing.associations,
    };
    if (options.label !== undefined) input.label = options.label;
    if (options.active !== undefined) input.active = options.active;

    if (options.category) {
      // Category is immutable after the field is created — the QBO server
      // rejects cross-category changes with a confusing "mutually exclusive
      // subAssociations" error. Catch this upfront with a clearer message.
      throw new Error(
        `Cannot change --category on an existing field. Category is set at create time and is immutable. ` +
        `To change category, deactivate this field with --active false and create a new one.`,
      );
    }
    if (options.transactions && options.transactions.length > 0) {
      // Note: the update mutation behaves as upsert at the subAssociation level —
      // new transactions are added to the existing list, not replaced. To remove
      // a transaction from the field, the CLI would need to send it with
      // active: false. Today we only add.
      const existing = await fetchField(id, profile);
      const existingParents = (existing.associations || [])
        .map((a) => a.associatedEntity)
        .filter((p) => p === "/transactions/Transaction");
      if (existingParents.length === 0) {
        throw new Error(
          `Field ${id} has no /transactions/Transaction association to update. ` +
          `Add forms only works on fields that already have a transactions association.`,
        );
      }
      const unknownTxns = options.transactions.filter((t) => !TRANSACTION_TO_SUBTYPE[t]);
      if (unknownTxns.length > 0) {
        throw new Error(
          `Unknown --forms value(s): ${unknownTxns.join(", ")}. ` +
          `Valid: ${Object.keys(TRANSACTION_TO_SUBTYPE).join(", ")}.`,
        );
      }
      const newSubtypes = options.transactions.map((t) => TRANSACTION_TO_SUBTYPE[t]);

      // Keep the category-side association(s) untouched. Replace the
      // transactions-side association's subAssociations with the new list.
      // Note: server treats new subAssociations as upsert (adds, doesn't
      // replace), so partners wanting to remove a subtype today must either
      // deactivate the whole field and recreate, or use --file with explicit
      // active: false entries.
      input.associations = (existing.associations || []).map((a) => {
        if (a.associatedEntity !== "/transactions/Transaction") return a;
        return {
          ...a,
          subAssociations: newSubtypes.map((sub) => ({
            associatedEntity: sub,
            active: true,
            allowedOperations: [],
          })),
        };
      });
    }
  }

  if (options.dryRun) {
    console.log("[dry-run] GraphQL AppFoundationsUpdateCustomFieldDefinition");
    console.log(JSON.stringify({ input }, null, 2));
    return;
  }

  const data = await graphqlMutation(MUTATION, { input }, "AppFoundationsUpdateCustomFieldDefinition", profile);
  const field = data.appFoundationsUpdateCustomFieldDefinition as {
    id: string;
    label: string;
    dataType?: string;
    active: boolean;
  };
  const status = field.active ? "active" : "inactive";
  console.log(`Updated custom field [${field.id}] "${field.label}" — type: ${field.dataType || "—"}, ${status}`);
}
