import { describe, it, expect } from "vitest";
import { toCsv } from "../lib/csv.js";

describe("toCsv", () => {
  it("returns empty string for empty rows", () => {
    expect(toCsv([])).toBe("");
  });

  it("produces header row from first object keys", () => {
    const rows = [{ Id: "1", Name: "Alice" }];
    const result = toCsv(rows);
    const lines = result.split("\n");
    expect(lines[0]).toBe("Id,Name");
  });

  it("renders values in correct order", () => {
    const rows = [{ Id: "1", Name: "Alice", Balance: 100 }];
    const result = toCsv(rows);
    const lines = result.split("\n");
    expect(lines[1]).toBe("1,Alice,100");
  });

  it("handles multiple rows", () => {
    const rows = [
      { A: "1", B: "2" },
      { A: "3", B: "4" },
    ];
    const result = toCsv(rows);
    const lines = result.split("\n");
    expect(lines).toHaveLength(3); // header + 2 data
    expect(lines[1]).toBe("1,2");
    expect(lines[2]).toBe("3,4");
  });

  it("quotes values containing commas", () => {
    const rows = [{ Name: "Doe, John" }];
    const result = toCsv(rows);
    const lines = result.split("\n");
    expect(lines[1]).toBe('"Doe, John"');
  });

  it("escapes double quotes inside values", () => {
    const rows = [{ Note: 'He said "hello"' }];
    const result = toCsv(rows);
    const lines = result.split("\n");
    expect(lines[1]).toBe('"He said ""hello"""');
  });

  it("quotes values containing newlines", () => {
    const rows = [{ Note: "line1\nline2" }];
    const result = toCsv(rows);
    expect(result).toContain('"line1\nline2"');
  });

  it("renders null and undefined as empty strings", () => {
    const rows = [{ A: null, B: undefined, C: "ok" }];
    const result = toCsv(rows as Record<string, unknown>[]);
    const lines = result.split("\n");
    expect(lines[1]).toBe(",,ok");
  });

  it("serializes nested objects as JSON strings", () => {
    const rows = [{ Addr: { Line1: "123 Main" } }];
    const result = toCsv(rows as Record<string, unknown>[]);
    const lines = result.split("\n");
    // JSON contains commas, so it should be quoted
    expect(lines[1]).toContain('"');
    expect(lines[1]).toContain("123 Main");
  });
});
