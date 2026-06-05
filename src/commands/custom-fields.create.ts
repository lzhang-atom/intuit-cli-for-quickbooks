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

// Category names mirror the singular categories the QBO UI presents:
// "Customer", "Vendor", "Project", "Transaction". Each maps to the API's
// parent associatedEntity path. For category=transaction, the user must also
// supply --form to pick which form types the field appears on (matches the
// UI's second-step form picker).
const CATEGORY_TO_PARENT_ENTITY: Record<string, string> = {
  customer:    "/network/Contact",
  vendor:      "/network/Contact",
  project:     "/work/Project",
  transaction: "/transactions/Transaction",
};

// Subtypes for non-transaction categories are fixed.
const CATEGORY_FIXED_SUBTYPE: Record<string, string> = {
  customer: "CUSTOMER",
  vendor:   "VENDOR",
  project:  "PROJECT",
};

// Friendly transaction names (matching QBO UI labels) → API subtype enum.
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

const VALID_DATA_TYPES = new Set(["STRING", "NUMBER", "DATE", "BOOLEAN", "STRING_LIST"]);

type SubAssociation = { associatedEntity: string; active: boolean; allowedOperations: string[] };
type Association = {
  associatedEntity: string;
  active: boolean;
  associationCondition: string;
  validationOptions: { required: boolean };
  allowedOperations: string[];
  subAssociations: SubAssociation[];
};
type CustomFieldInput = {
  label: string;
  dataType: string;
  active?: boolean;
  associations?: Association[];
  dropDownOptions?: Array<{ value: string; active: boolean }>;
};

export async function customFieldsCreate(
  options: {
    label?: string;
    dataType?: string;
    category?: string;
    transactions?: string[];
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
    // Collect all required-flag issues at once so the user sees the full picture
    // in one error instead of fixing flags one at a time.
    const missing: string[] = [];
    if (!options.label) missing.push("--label <text>");
    if (!options.dataType) missing.push("--data-type <STRING|NUMBER|DATE|BOOLEAN|STRING_LIST>");
    if (!options.category && !options.entity) {
      missing.push("--category <customer|vendor|project|transaction>");
    }
    if (!options.transactions || options.transactions.length === 0) {
      missing.push("--forms <form> (repeatable)");
    }
    if (missing.length > 0) {
      const formList = Object.keys(TRANSACTION_TO_SUBTYPE).join(", ");
      throw new Error(
        `Missing required flag(s):\n  ${missing.join("\n  ")}\n\n` +
        `Valid --forms values: ${formList}\n` +
        `Optional: --option (for STRING_LIST dropdown values).\n` +
        `Or use --file <path> with the full GraphQL input.\n\n` +
        `Example:\n` +
        `  intuit custom-fields create --label "PO Number" --data-type STRING \\\n` +
        `    --category transaction --forms invoice,estimate`,
      );
    }

    const dataType = options.dataType!.toUpperCase();
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

    // Resolve category. Mirrors the UI's single radio-button picker — required.
    const category = (options.category ?? options.entity)!.trim();
    if (options.entity) {
      console.error("[note] --entity is deprecated; use --category (one of: customer, vendor, project, transaction).");
    }

    const parentEntity = CATEGORY_TO_PARENT_ENTITY[category];
    if (!parentEntity) {
      throw new Error(
        `Unknown --category "${category}". Valid: ${Object.keys(CATEGORY_TO_PARENT_ENTITY).join(", ")}. ` +
        `For raw control over associatedEntity and subAssociations, use --file.`,
      );
    }

    // --transactions presence was validated upfront with the other required
    // flags; here we just check the values are recognized.
    const unknownTxns = options.transactions!.filter((t) => !TRANSACTION_TO_SUBTYPE[t]);
    if (unknownTxns.length > 0) {
      throw new Error(
        `Unknown --forms value(s): ${unknownTxns.join(", ")}. ` +
        `Valid: ${Object.keys(TRANSACTION_TO_SUBTYPE).join(", ")}.`,
      );
    }
    const transactionSubtypes = options.transactions!.map((t) => TRANSACTION_TO_SUBTYPE[t]);

    const associations: Association[] = [];

    // For customer/vendor/project, add the category-specific association first.
    if (category !== "transaction") {
      associations.push({
        associatedEntity: parentEntity,
        active: true,
        associationCondition: "INCLUDED",
        validationOptions: { required: false },
        allowedOperations: [],
        subAssociations: [{
          associatedEntity: CATEGORY_FIXED_SUBTYPE[category],
          active: true,
          allowedOperations: [],
        }],
      });
    }

    // Every field gets a /transactions/Transaction association with the
    // chosen form subtypes — true even for category=customer/vendor/project,
    // matching what the QBO UI generates.
    associations.push({
      associatedEntity: "/transactions/Transaction",
      active: true,
      associationCondition: "INCLUDED",
      validationOptions: { required: false },
      allowedOperations: [],
      subAssociations: transactionSubtypes.map((sub) => ({
        associatedEntity: sub,
        active: true,
        allowedOperations: [],
      })),
    });

    input = {
      label: options.label!,
      dataType,
      active: true,
      associations,
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
