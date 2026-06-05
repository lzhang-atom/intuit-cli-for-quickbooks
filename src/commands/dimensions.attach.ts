import fs from "fs";
import { intuitGet, intuitPost } from "../lib/intuit-api.js";

const SUPPORTED_ENTITIES: Record<string, { apiPath: string; responseKey: string }> = {
  invoice:      { apiPath: "invoice",      responseKey: "Invoice" },
  bill:         { apiPath: "bill",         responseKey: "Bill" },
  purchase:     { apiPath: "purchase",     responseKey: "Purchase" },
  estimate:     { apiPath: "estimate",     responseKey: "Estimate" },
  salesreceipt: { apiPath: "salesreceipt", responseKey: "SalesReceipt" },
};

type LineItem = Record<string, unknown>;
type DimInput = { lineNum?: number; definitionId: string; valueId: string };

// QBO transactions can contain non-item line types (SubTotal, Group summary,
// DescriptionOnly footers) that carry no LineNum and can't hold dimensions.
// Filter those out before any per-line operation.
function isAttachableLine(line: LineItem): boolean {
  const detailType = line.DetailType as string | undefined;
  if (!detailType) return false;
  return detailType === "SalesItemLineDetail"
    || detailType === "ItemBasedExpenseLineDetail"
    || detailType === "AccountBasedExpenseLineDetail";
}

function attachDimensionToLine(line: LineItem, definitionId: string, valueId: string): LineItem {
  const existing = (line.CustomExtensions as Record<string, unknown>[] | undefined) || [];

  // Find existing DIMENSION extension, or create a new one
  let dimExt = existing.find(e => e.ExtensionType === "DIMENSION") as Record<string, unknown> | undefined;
  const assocValues = dimExt
    ? [...(dimExt.AssociatedValues as { Key: string; Value: string }[])]
    : [];

  // Replace or add the value for this definition
  const idx = assocValues.findIndex(av => av.Key === definitionId);
  if (idx >= 0) assocValues[idx] = { Key: definitionId, Value: valueId };
  else assocValues.push({ Key: definitionId, Value: valueId });

  if (dimExt) {
    dimExt = { ...dimExt, AssociatedValues: assocValues };
    const extIdx = existing.findIndex(e => e.ExtensionType === "DIMENSION");
    existing[extIdx] = dimExt;
  } else {
    existing.push({ ExtensionType: "DIMENSION", AssociatedValues: assocValues });
  }

  return { ...line, CustomExtensions: existing };
}

export async function dimensionsAttach(
  options: {
    definitionId?: string;
    valueId?: string;
    entity: string;
    entityId: string;
    file?: string;
    dryRun?: boolean;
  },
  profile?: string
) {
  const entityDef = SUPPORTED_ENTITIES[options.entity.toLowerCase()];
  if (!entityDef) {
    throw new Error(
      `Unsupported entity "${options.entity}". Supported: ${Object.keys(SUPPORTED_ENTITIES).join(", ")}`
    );
  }

  // Resolve inputs — flags (all lines) or file (per line)
  let inputs: DimInput[];
  const perLine = !!options.file;

  if (options.file) {
    const raw = fs.readFileSync(options.file, "utf-8");
    inputs = JSON.parse(raw) as DimInput[];
  } else {
    if (!options.definitionId) throw new Error("--definition-id is required (or use --file for per-line control)");
    if (!options.valueId) throw new Error("--value-id is required (or use --file for per-line control)");
    inputs = [{ definitionId: options.definitionId, valueId: options.valueId }];
  }

  // Fetch the transaction
  const data = await intuitGet(`${entityDef.apiPath}/${options.entityId}`, profile);
  const txn = data[entityDef.responseKey] as Record<string, unknown>;
  if (!txn) throw new Error(`${entityDef.responseKey} ${options.entityId} not found.`);

  const allLines = (txn.Line as LineItem[]) || [];
  const lines = allLines.filter(isAttachableLine);
  const skippedCount = allLines.length - lines.length;
  const docNum = txn.DocNumber ? ` #${txn.DocNumber}` : "";
  const totalAmt = txn.TotalAmt ? ` — $${txn.TotalAmt}` : "";

  if (lines.length === 0) {
    throw new Error(`${entityDef.responseKey} ${options.entityId} has no attachable line items.`);
  }

  // Determine which lines to touch
  const targetLines = perLine
    ? lines.filter(l => inputs.some(inp => inp.lineNum == null || inp.lineNum === Number(l.LineNum)))
    : lines;

  if (options.dryRun) {
    if (!perLine) {
      console.log(`\nDimension to attach: definition [${options.definitionId}]  →  value [${options.valueId}]`);
      const skipNote = skippedCount > 0 ? ` (${skippedCount} non-item line(s) skipped)` : "";
      console.log(`\nWill attach to ALL ${targetLines.length} attachable line(s)${skipNote} on ${options.entity}${docNum}${totalAmt} [${options.entityId}]:\n`);
      for (const l of targetLines) {
        const desc = l.Description ? ` — ${l.Description}` : "";
        const amt = l.Amount != null ? `  $${l.Amount}` : "";
        console.log(`  Line ${l.LineNum}${desc}${amt}`);
      }
      console.log(`\nFor different dimensions per line, use --file instead:`);
      console.log(`  File format: [{ "lineNum": 1, "definitionId": "<id>", "valueId": "<id>" }, ...]`);
    } else {
      console.log(`\nDimensions to attach (per line) on ${options.entity}${docNum}${totalAmt} [${options.entityId}]:\n`);
      for (const inp of inputs) {
        const line = lines.find(l => Number(l.LineNum) === inp.lineNum);
        const desc = line?.Description ? ` — ${line.Description}` : "";
        const amt = line?.Amount != null ? `  $${line.Amount}` : "";
        console.log(`  Line ${inp.lineNum ?? "(all)"}${desc}${amt}  →  definition [${inp.definitionId}] value [${inp.valueId}]`);
      }
    }
    console.log(`\nRun without --dry-run to apply.`);
    return;
  }

  // Apply dimension to lines. Operate on the full list (allLines) so non-item
  // lines pass through unchanged — we just skip attaching to them. This
  // preserves SubTotal/Group lines exactly as QBO returned them.
  const updatedLines = allLines.map(line => {
    if (!isAttachableLine(line)) return line;
    if (!perLine) {
      return attachDimensionToLine(line, inputs[0].definitionId, inputs[0].valueId);
    }
    const matching = inputs.filter(inp => inp.lineNum == null || inp.lineNum === Number(line.LineNum));
    let updated = line;
    for (const inp of matching) {
      updated = attachDimensionToLine(updated, inp.definitionId, inp.valueId);
    }
    return updated;
  });

  const body: Record<string, unknown> = {
    Line: updatedLines,
    Id: txn.Id,
    SyncToken: txn.SyncToken,
    sparse: true,
  };

  const result = await intuitPost(entityDef.apiPath, body, profile);
  const updated = result[entityDef.responseKey] as Record<string, unknown>;
  const lineCount = perLine ? inputs.length : targetLines.length;
  console.log(`Attached dimension(s) to ${lineCount} line(s) on ${options.entity} [${updated.Id}]${docNum}${totalAmt}`);
}
