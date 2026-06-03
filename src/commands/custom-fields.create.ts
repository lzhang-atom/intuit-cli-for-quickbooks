import fs from "fs";
import { graphqlMutation } from "../lib/graphql-api.js";

// Schema requires a single $input typed as
// AppFoundations_CustomFieldDefinitionCreateInput! — not flat variables.
//
// Selection set returns the full association tree and dropdown options so
// callers using --file with richer payloads see what was actually written.
const MUTATION = `
mutation appFoundationsCreateCustomFieldDefinition(
  $input: AppFoundations_CustomFieldDefinitionCreateInput!
) {
  appFoundationsCreateCustomFieldDefinition(input: $input) {
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
}`;

// Map partner-friendly scope aliases to the path values the API stores.
// Pass-through preserves any other path (e.g., /inventory/Item) without
// requiring a CLI release.
const SCOPE_ALIASES: Record<string, string> = {
  transactions: "/transactions/Transaction",
  contacts: "/network/Contact",
  projects: "/work/Project",
};

function resolveScope(value: string): string {
  return SCOPE_ALIASES[value] ?? value;
}

const VALID_DATA_TYPES = new Set(["STRING", "NUMBER", "DATE", "BOOLEAN", "STRING_LIST"]);

type CustomFieldInput = {
  label: string;
  dataType: string;
  active?: boolean;
  associations?: Array<{
    associatedEntity: string;
    active: boolean;
    associationCondition: string;
  }>;
  dropDownOptions?: Array<{ value: string; active: boolean }>;
};

export async function customFieldsCreate(
  options: {
    label?: string;
    dataType?: string;
    scope?: string[];
    options?: string[];
    entity?: string;
    file?: string;
    dryRun?: boolean;
    idempotencyTag?: string;
  },
  profile?: string,
) {
  let input: CustomFieldInput;

  if (options.file) {
    const raw = fs.readFileSync(options.file, "utf-8");
    const parsed = JSON.parse(raw);
    // Two file shapes: { "input": {...} } verbatim, or bare input object.
    input = parsed.input ?? parsed;
  } else {
    if (!options.label) throw new Error("--label is required (or use --file)");
    if (!options.dataType) throw new Error("--data-type is required (or use --file)");

    const dataType = options.dataType.toUpperCase();
    if (!VALID_DATA_TYPES.has(dataType)) {
      throw new Error(`Invalid --data-type "${options.dataType}". Valid: ${[...VALID_DATA_TYPES].join(", ")}.`);
    }

    // Validate flag pairing for dropdown fields.
    const isList = dataType === "STRING_LIST";
    if (isList && (!options.options || options.options.length === 0)) {
      throw new Error("--data-type STRING_LIST requires at least one --option value.");
    }
    if (!isList && options.options && options.options.length > 0) {
      throw new Error("--option can only be used with --data-type STRING_LIST.");
    }

    // Resolve scope. Sources, in order of precedence:
    //   1. --scope (preferred; supports aliases + raw paths, repeatable)
    //   2. --entity (deprecated; raw passthrough for back-compat)
    //   3. default: transactions
    let associatedEntities: string[];
    if (options.scope && options.scope.length > 0) {
      associatedEntities = options.scope.map((s) => resolveScope(s.trim())).filter(Boolean);
    } else if (options.entity) {
      console.error("[note] --entity is deprecated; use --scope (e.g. --scope transactions). The raw value will continue to work.");
      associatedEntities = [options.entity];
    } else {
      associatedEntities = [SCOPE_ALIASES.transactions];
    }

    input = {
      label: options.label,
      dataType,
      active: true,
      associations: associatedEntities.map((associatedEntity) => ({
        associatedEntity,
        active: true,
        associationCondition: "INCLUDED",
      })),
    };

    if (isList && options.options) {
      input.dropDownOptions = options.options.map((value) => ({
        value,
        active: true,
      }));
    }
  }

  // The label must stay pristine; --idempotency-tag is accepted for command
  // symmetry but never applied to a GraphQL field.
  if (options.idempotencyTag && !options.dryRun) {
    console.error(`[note] --idempotency-tag "${options.idempotencyTag}" recorded but not applied (CustomFieldDefinition has no taggable field).`);
  }

  if (options.dryRun) {
    console.log("[dry-run] GraphQL appFoundationsCreateCustomFieldDefinition");
    if (options.idempotencyTag) console.log(`[dry-run] idempotency-tag: ${options.idempotencyTag} (not applied to payload)`);
    console.log(JSON.stringify({ input }, null, 2));
    return;
  }

  const data = await graphqlMutation(MUTATION, { input }, "appFoundationsCreateCustomFieldDefinition", profile);
  const field = data.appFoundationsCreateCustomFieldDefinition as {
    id: string;
    legacyIDV2?: string;
    label: string;
    dataType?: string;
  };
  console.log(`Created custom field [${field.id}] "${field.label}" — type: ${field.dataType || "—"}, legacyIDV2: ${field.legacyIDV2 || "—"}`);
}
