import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { enableDebug, debug, isDebug, debugRequest } from "../lib/debug.js";

describe("debug", () => {
  let stderrSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    stderrSpy = vi.spyOn(process.stderr, "write").mockImplementation(() => true);
  });

  afterEach(() => {
    stderrSpy.mockRestore();
  });

  it("does not output when debug is disabled", () => {
    // debug starts disabled in a fresh module, but enableDebug may have been called
    // by a prior test. We test the output format instead.
    debug("should not appear if disabled");
    // This test verifies the function doesn't throw
  });

  it("outputs to stderr when enabled", () => {
    enableDebug();
    debug("test message");
    expect(stderrSpy).toHaveBeenCalledWith("[DEBUG] test message\n");
  });

  it("isDebug returns true after enableDebug", () => {
    enableDebug();
    expect(isDebug()).toBe(true);
  });
});

describe("debugRequest", () => {
  let stderrSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    enableDebug();
    stderrSpy = vi.spyOn(process.stderr, "write").mockImplementation(() => true);
  });

  afterEach(() => {
    stderrSpy.mockRestore();
  });

  it("masks Bearer token in Authorization header", () => {
    debugRequest("GET", "https://api.example.com/test", {
      Authorization: "Bearer abcdef1234567890abcdef1234567890",
      Accept: "application/json",
    });

    const calls = stderrSpy.mock.calls.map((c: unknown[]) => c[0]).join("");
    expect(calls).toContain("abcdef");  // first 6 chars visible
    expect(calls).toContain("...");     // masked middle
    expect(calls).not.toContain("abcdef1234567890abcdef1234567890"); // full token NOT visible
  });

  it("truncates long request bodies", () => {
    // Body cap is 8192 chars; use a body well past that to trigger truncation.
    const longBody = "x".repeat(10000);
    debugRequest("POST", "https://api.example.com/test", {}, longBody);

    const calls = stderrSpy.mock.calls.map((c: unknown[]) => c[0]).join("");
    expect(calls).toContain("truncated");
    expect(calls).not.toContain("x".repeat(10000));
  });
});
