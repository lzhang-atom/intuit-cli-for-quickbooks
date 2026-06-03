const MAX_COL_WIDTH = 40;

function truncate(str: string, max: number): string {
  return str.length > max ? str.slice(0, max - 1) + "…" : str;
}

function flatten(val: unknown): string {
  if (val === null || val === undefined) return "";
  if (typeof val === "object") return JSON.stringify(val);
  return String(val);
}

type Column = { key: string; header: string; width: number };

/**
 * Render rows as an aligned ASCII table.
 * Auto-detects columns from first row keys if not specified.
 */
export function toTable(
  rows: Record<string, unknown>[],
  columns?: { key: string; header: string }[]
): string {
  if (rows.length === 0) return "";

  // Build column specs with widths
  const cols: Column[] = (columns || Object.keys(rows[0]).map(k => ({ key: k, header: k }))).map(c => {
    let maxWidth = c.header.length;
    for (const row of rows) {
      const len = flatten(row[c.key]).length;
      if (len > maxWidth) maxWidth = len;
    }
    return { ...c, width: Math.min(maxWidth, MAX_COL_WIDTH) };
  });

  const lines: string[] = [];

  // Header row
  const header = cols.map(c => c.header.padEnd(c.width)).join("  ");
  lines.push(header);

  // Separator
  lines.push(cols.map(c => "─".repeat(c.width)).join("  "));

  // Data rows
  for (const row of rows) {
    const line = cols.map(c => {
      const val = truncate(flatten(row[c.key]), c.width);
      return val.padEnd(c.width);
    }).join("  ");
    lines.push(line);
  }

  return lines.join("\n");
}
