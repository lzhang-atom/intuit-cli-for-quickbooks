export function toCsv(rows) {
    if (rows.length === 0)
        return "";
    const headers = Object.keys(rows[0]);
    const escape = (val) => {
        const str = val === null || val === undefined ? "" : typeof val === "object" ? JSON.stringify(val) : String(val);
        return str.includes(",") || str.includes('"') || str.includes("\n") ? `"${str.replace(/"/g, '""')}"` : str;
    };
    const lines = [headers.join(",")];
    for (const row of rows) {
        lines.push(headers.map(h => escape(row[h])).join(","));
    }
    return lines.join("\n");
}
