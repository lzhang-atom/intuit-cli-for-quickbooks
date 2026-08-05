import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("../lib/token-store.js", () => ({
  tokenStore: {
    getValidToken: vi.fn(async () => ({
      access_token: "at",
      refresh_token: "rt",
      realmId: "123",
    })),
    refreshToken: vi.fn(),
  },
  profileStore: {
    getActive: vi.fn(() => "default"),
    getInfo: vi.fn(() => ({ name: "default", env: "sandbox", realmId: "123" })),
  },
}));

vi.mock("../lib/tls.js", () => ({ configureTls: vi.fn() }));

import { intuitGet, intuitPost } from "../lib/intuit-api.js";
import { fetchWithRetry } from "../lib/retry.js";

function jsonResponse(status: number, body: unknown = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    statusText: `Status ${status}`,
    headers: new Headers({ "Content-Type": "application/json" }),
  });
}

function requestedUrls(spy: ReturnType<typeof vi.spyOn>): string[] {
  return spy.mock.calls.map((call) => String(call[0]));
}

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("requestid idempotency key", () => {
  it("attaches a requestid to writes", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(jsonResponse(200, { Invoice: { Id: "1" } }));

    await intuitPost("invoice", { Line: [] });

    const url = requestedUrls(fetchSpy)[0];
    expect(url).toMatch(/[?&]requestid=[0-9a-f-]{36}/);
  });

  it("does not attach a requestid to reads", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(jsonResponse(200, { Invoice: { Id: "1" } }));

    await intuitGet("invoice/1");

    expect(requestedUrls(fetchSpy)[0]).not.toContain("requestid=");
  });

  it("preserves an existing query parameter such as operation=void", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(jsonResponse(200, { Invoice: { Id: "1" } }));

    await intuitPost("invoice?operation=void", { Id: "1", SyncToken: "0" });

    const url = requestedUrls(fetchSpy)[0];
    expect(url).toContain("operation=void");
    expect(url).toMatch(/[?&]requestid=/);
  });

  it("reuses one requestid across retries so the write is deduplicated", async () => {
    vi.useFakeTimers();
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(jsonResponse(503))
      .mockResolvedValueOnce(jsonResponse(200, { Invoice: { Id: "1" } }));

    const promise = intuitPost("invoice", { Line: [] });
    await vi.runAllTimersAsync();
    await promise;

    const urls = requestedUrls(fetchSpy);
    expect(urls).toHaveLength(2);
    expect(urls[0]).toBe(urls[1]);
    vi.useRealTimers();
  });

  it("generates a distinct requestid per logical write", async () => {
    // A fresh Response per call — a body can only be read once.
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockImplementation(async () => jsonResponse(200, { Invoice: { Id: "1" } }));

    await intuitPost("invoice", { Line: [] });
    await intuitPost("invoice", { Line: [] });

    const [first, second] = requestedUrls(fetchSpy);
    expect(first).not.toBe(second);
  });
});

describe("fetchWithRetry replay safety", () => {
  it("retries a GET on 503", async () => {
    vi.useFakeTimers();
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(jsonResponse(503))
      .mockResolvedValueOnce(jsonResponse(200));

    const promise = fetchWithRetry("https://example.com/api");
    await vi.runAllTimersAsync();
    const res = await promise;

    expect(res.status).toBe(200);
    expect(fetchSpy).toHaveBeenCalledTimes(2);
    vi.useRealTimers();
  });

  it("does not retry an unkeyed POST on 503", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse(503));

    const res = await fetchWithRetry("https://example.com/api", { method: "POST" });

    expect(res.status).toBe(503);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it("does not replay an unkeyed POST after a dropped connection", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockRejectedValue(new Error("ECONNRESET"));

    await expect(
      fetchWithRetry("https://example.com/api", { method: "POST" })
    ).rejects.toThrow("ECONNRESET");
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it("retries a POST that is explicitly marked idempotent", async () => {
    vi.useFakeTimers();
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(jsonResponse(503))
      .mockResolvedValueOnce(jsonResponse(200));

    const promise = fetchWithRetry(
      "https://example.com/api?requestid=abc",
      { method: "POST" },
      { idempotent: true }
    );
    await vi.runAllTimersAsync();
    const res = await promise;

    expect(res.status).toBe(200);
    expect(fetchSpy).toHaveBeenCalledTimes(2);
    vi.useRealTimers();
  });
});
