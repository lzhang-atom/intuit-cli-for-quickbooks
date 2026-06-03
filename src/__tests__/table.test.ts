import { describe, it, expect } from "vitest";
import { toTable } from "../lib/table.js";

describe("toTable", () => {
  it("returns empty string for empty rows", () => {
    expect(toTable([])).toBe("");
  });

  it("renders a single-row table with header and separator", () => {
    const rows = [{ Name: "Alice", Age: 30 }];
    const result = toTable(rows);
    const lines = result.split("\n");
    expect(lines).toHaveLength(3); // header, separator, data
    expect(lines[0]).toContain("Name");
    expect(lines[0]).toContain("Age");
    expect(lines[1]).toMatch(/^─+/);
    expect(lines[2]).toContain("Alice");
    expect(lines[2]).toContain("30");
  });

  it("renders multiple rows", () => {
    const rows = [
      { Id: "1", Name: "Alice" },
      { Id: "2", Name: "Bob" },
      { Id: "3", Name: "Charlie" },
    ];
    const result = toTable(rows);
    const lines = result.split("\n");
    expect(lines).toHaveLength(5); // header + separator + 3 data rows
  });

  it("truncates long values at 40 characters with ellipsis", () => {
    const longValue = "A".repeat(50);
    const rows = [{ Field: longValue }];
    const result = toTable(rows);
    const dataLine = result.split("\n")[2];
    expect(dataLine).toContain("…");
    expect(dataLine.trim().length).toBeLessThanOrEqual(40);
  });

  it("handles null and undefined values as empty strings", () => {
    const rows = [{ A: null, B: undefined, C: "ok" }];
    const result = toTable(rows as Record<string, unknown>[]);
    const dataLine = result.split("\n")[2];
    expect(dataLine).toContain("ok");
  });

  it("stringifies nested objects as JSON", () => {
    const rows = [{ Data: { nested: true } }];
    const result = toTable(rows as Record<string, unknown>[]);
    expect(result).toContain('{"nested":true}');
  });

  it("uses custom columns when provided", () => {
    const rows = [{ firstName: "Alice", lastName: "Smith", age: 30 }];
    const result = toTable(rows as Record<string, unknown>[], [
      { key: "firstName", header: "First" },
      { key: "age", header: "Age" },
    ]);
    const header = result.split("\n")[0];
    expect(header).toContain("First");
    expect(header).toContain("Age");
    expect(header).not.toContain("lastName");
  });

  it("pads columns to align values", () => {
    const rows = [
      { Name: "Al", Value: "1" },
      { Name: "Alexander", Value: "100" },
    ];
    const result = toTable(rows);
    const lines = result.split("\n");
    // All lines should have the same length (padded)
    expect(lines[0].length).toBe(lines[2].length);
    expect(lines[0].length).toBe(lines[3].length);
  });
});
