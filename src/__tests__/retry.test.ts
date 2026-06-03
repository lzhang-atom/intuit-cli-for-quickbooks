import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchWithRetry } from "../lib/retry.js";

// Suppress console.error from retry logging during tests
beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
});

function mockResponse(status: number, headers?: Record<string, string>): Response {
  const h = new Headers(headers);
  return new Response(null, { status, statusText: `Status ${status}`, headers: h });
}

describe("fetchWithRetry", () => {
  it("returns immediately on 200 OK", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(mockResponse(200));
    const res = await fetchWithRetry("https://example.com/api");
    expect(res.status).toBe(200);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    fetchSpy.mockRestore();
  });

  it("returns immediately on 400 (non-retryable)", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(mockResponse(400));
    const res = await fetchWithRetry("https://example.com/api");
    expect(res.status).toBe(400);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    fetchSpy.mockRestore();
  });

  it("returns immediately on 404 (non-retryable)", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(mockResponse(404));
    const res = await fetchWithRetry("https://example.com/api");
    expect(res.status).toBe(404);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    fetchSpy.mockRestore();
  });

  it("retries on 429 and eventually returns the last response", async () => {
    vi.useFakeTimers();
    const fetchSpy = vi.spyOn(globalThis, "fetch")
      .mockResolvedValue(mockResponse(429));

    const promise = fetchWithRetry("https://example.com/api");

    // Advance through all retry delays
    for (let i = 0; i < 4; i++) {
      await vi.advanceTimersByTimeAsync(10000);
    }

    const res = await promise;
    expect(res.status).toBe(429);
    expect(fetchSpy).toHaveBeenCalledTimes(4); // initial + 3 retries
    fetchSpy.mockRestore();
    vi.useRealTimers();
  });

  it("retries on 500 and succeeds on second attempt", async () => {
    vi.useFakeTimers();
    const fetchSpy = vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(mockResponse(500))
      .mockResolvedValueOnce(mockResponse(200));

    const promise = fetchWithRetry("https://example.com/api");
    await vi.advanceTimersByTimeAsync(2000);

    const res = await promise;
    expect(res.status).toBe(200);
    expect(fetchSpy).toHaveBeenCalledTimes(2);
    fetchSpy.mockRestore();
    vi.useRealTimers();
  });

  it("retries on 502, 503, 504", async () => {
    vi.useFakeTimers();
    const fetchSpy = vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(mockResponse(502))
      .mockResolvedValueOnce(mockResponse(503))
      .mockResolvedValueOnce(mockResponse(504))
      .mockResolvedValueOnce(mockResponse(200));

    const promise = fetchWithRetry("https://example.com/api");
    for (let i = 0; i < 4; i++) {
      await vi.advanceTimersByTimeAsync(10000);
    }

    const res = await promise;
    expect(res.status).toBe(200);
    expect(fetchSpy).toHaveBeenCalledTimes(4);
    fetchSpy.mockRestore();
    vi.useRealTimers();
  });

  it("retries on network error and succeeds", async () => {
    vi.useFakeTimers();
    const fetchSpy = vi.spyOn(globalThis, "fetch")
      .mockRejectedValueOnce(new Error("ECONNREFUSED"))
      .mockResolvedValueOnce(mockResponse(200));

    const promise = fetchWithRetry("https://example.com/api");
    await vi.advanceTimersByTimeAsync(2000);

    const res = await promise;
    expect(res.status).toBe(200);
    expect(fetchSpy).toHaveBeenCalledTimes(2);
    fetchSpy.mockRestore();
    vi.useRealTimers();
  });

  it("throws after all retries exhausted on network errors", async () => {
    // Use real timers with a fast mock to avoid unhandled rejection timing issues
    let callCount = 0;
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation(async () => {
      callCount++;
      throw new Error("ECONNREFUSED");
    });

    // Patch sleep to resolve instantly
    const originalSetTimeout = globalThis.setTimeout;
    vi.spyOn(globalThis, "setTimeout").mockImplementation((fn: () => void) => {
      fn();
      return 0 as unknown as ReturnType<typeof setTimeout>;
    });

    await expect(fetchWithRetry("https://example.com/api")).rejects.toThrow("ECONNREFUSED");
    expect(callCount).toBe(4); // initial + 3 retries

    fetchSpy.mockRestore();
    vi.mocked(globalThis.setTimeout).mockRestore();
  });
});
