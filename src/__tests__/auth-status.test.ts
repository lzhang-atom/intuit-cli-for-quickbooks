import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const token = vi.hoisted(() => ({ current: {} as Record<string, unknown> | null }));

vi.mock("../lib/token-store.js", () => ({
  tokenStore: { get: vi.fn(() => token.current) },
  profileStore: {
    getActive: vi.fn(() => "prod"),
    getInfo: vi.fn(() => ({ name: "prod", env: "production", realmId: "123" })),
  },
}));

import { authStatus, type AuthStatusJson } from "../commands/auth.status.js";

const DAY_MS = 24 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;

function statusJson(overrides: Record<string, unknown>): AuthStatusJson {
  token.current = { access_token: "at", refresh_token: "rt", realmId: "123", ...overrides };
  const lines: string[] = [];
  vi.spyOn(console, "log").mockImplementation((msg) => void lines.push(String(msg)));
  authStatus("prod", { json: true });
  return JSON.parse(lines.join("\n"));
}

function statusText(overrides: Record<string, unknown>): string {
  token.current = { access_token: "at", refresh_token: "rt", realmId: "123", ...overrides };
  const lines: string[] = [];
  vi.spyOn(console, "log").mockImplementation((msg) => void lines.push(String(msg)));
  authStatus("prod");
  return lines.join("\n");
}

beforeEach(() => {
  token.current = {};
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("auth status — refresh token expiry", () => {
  it("reports the recorded expiry instead of a generic maximum", () => {
    const expiry = Date.now() + 70 * DAY_MS;
    const json = statusJson({ expires_at: Date.now() + HOUR_MS, refresh_token_expires_at: expiry });

    expect(json.refreshToken.status).toBe("present");
    expect(json.refreshToken.expiresAt).toBe(new Date(expiry).toISOString());
    expect(json.refreshToken.expiresInMs).toBeGreaterThan(69 * DAY_MS);
    expect(statusText({ expires_at: Date.now() + HOUR_MS, refresh_token_expires_at: expiry }))
      .toContain(`Valid until ${new Date(expiry).toISOString().slice(0, 10)}`);
  });

  it("does not promise an auto-refresh that would fail", () => {
    // The bug this guards: status said "will auto-refresh — no action needed"
    // while every call failed.
    const json = statusJson({
      expires_at: Date.now() - HOUR_MS,
      refresh_token_expires_at: Date.now() - DAY_MS,
    });

    expect(json.refreshToken.status).toBe("expired");
    expect(json.effectiveStatus).toBe("needs-relogin");
    expect(json.nextAction).toBe("run-auth-login");
  });

  it("flags a dead refresh token even while the access token still works", () => {
    const text = statusText({
      expires_at: Date.now() + HOUR_MS,
      refresh_token_expires_at: Date.now() - DAY_MS,
    });

    expect(text).toContain("Refresh token expired");
    expect(text).toContain("auth login --profile prod");
  });

  it("warns before expiry, while a command can still renew it", () => {
    const text = statusText({
      expires_at: Date.now() + HOUR_MS,
      refresh_token_expires_at: Date.now() + 5 * DAY_MS,
    });

    expect(text).toContain("Refresh token expires");
    expect(text).toContain("renews it automatically");
  });

  it("stays quiet when expiry is comfortably far off", () => {
    const text = statusText({
      expires_at: Date.now() + HOUR_MS,
      refresh_token_expires_at: Date.now() + 90 * DAY_MS,
    });

    expect(text).not.toContain("Refresh token expires");
  });

  it("keeps working for tokens stored before expiry was recorded", () => {
    const json = statusJson({ expires_at: Date.now() - HOUR_MS });

    expect(json.refreshToken.status).toBe("present");
    expect(json.refreshToken.expiresAt).toBeNull();
    expect(json.effectiveStatus).toBe("needs-refresh");
    expect(statusText({ expires_at: Date.now() - HOUR_MS })).toContain("expiry unrecorded");
  });
});
