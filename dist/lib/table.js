const MAX_COL_WIDTH = 40;
function truncate(str, max) {
    return str.length > max ? str.slice(0, max - 1) + "…" : str;
}
function flatten(val) {
    if (val === null || val === undefined)
        return "";
    if (typeof val === "object")
        return JSON.stringify(val);
    return String(val);
}
/**
 * Render rows as an aligned ASCII table.
 * Auto-detects columns from first row keys if not specified.
 */
export function toTable(rows, columns) {
    if (rows.length === 0)
        return "";
    // Build column specs with widths
    const cols = (columns || Object.keys(rows[0]).map(k => ({ key: k, header: k }))).map(c => {
        let maxWidth = c.header.length;
        for (const row of rows) {
            const len = flatten(row[c.key]).length;
            if (len > maxWidth)
                maxWidth = len;
        }
        return { ...c, width: Math.min(maxWidth, MAX_COL_WIDTH) };
    });
    const lines = [];
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
