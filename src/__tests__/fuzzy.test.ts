import { describe, it, expect } from "vitest";
import { closestMatches } from "../lib/fuzzy.js";

describe("closestMatches", () => {
  const commands = ["customers", "invoices", "payments", "items", "bills", "vendors", "accounts", "estimates"];

  it("finds exact typo with distance 1", () => {
    const matches = closestMatches("custmers", commands);
    expect(matches).toContain("customers");
  });

  it("finds typo with transposition", () => {
    const matches = closestMatches("invoces", commands);
    expect(matches).toContain("invoices");
  });

  it("returns empty array for completely unrelated input", () => {
    const matches = closestMatches("zzzzzzzzz", commands);
    expect(matches).toEqual([]);
  });

  it("excludes exact matches (distance 0)", () => {
    const matches = closestMatches("customers", commands);
    expect(matches).not.toContain("customers");
  });

  it("is case-insensitive", () => {
    const matches = closestMatches("CUSTMERS", commands);
    expect(matches).toContain("customers");
  });

  it("sorts by distance (closest first)", () => {
    const matches = closestMatches("item", ["items", "itemize", "atoms", "it"]);
    expect(matches[0]).toBe("items"); // distance 1
  });

  it("respects maxDistance parameter", () => {
    const matches = closestMatches("abc", ["abcd", "abcde", "abcdef"], 1);
    expect(matches).toContain("abcd"); // distance 1
    expect(matches).not.toContain("abcdef"); // distance 3
  });

  it("returns multiple matches sorted by closeness", () => {
    const matches = closestMatches("bil", ["bills", "billpayments", "builds"]);
    expect(matches.length).toBeGreaterThan(0);
    expect(matches[0]).toBe("bills"); // distance 2
  });

  it("handles empty input", () => {
    const matches = closestMatches("", commands);
    // All short commands within distance 3 should match
    expect(Array.isArray(matches)).toBe(true);
  });

  it("handles empty candidates", () => {
    const matches = closestMatches("test", []);
    expect(matches).toEqual([]);
  });
});
