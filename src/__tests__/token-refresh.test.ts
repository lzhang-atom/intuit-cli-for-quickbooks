import { describe, it, expect } from "vitest";
import Token from "intuit-oauth/src/access-token/Token.js";

import { primeRefreshToken, refreshExpiryFrom } from "../lib/token-store.js";

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Stand-in for OAuthClient that records what setToken received and answers the
 * same validity question intuit-oauth's validateToken() asks before refreshing.
 */
function fakeClient() {
  const client = {
    token: undefined as Record<string, unknown> | undefined,
    setToken(t: Record<string, unknown>) {
      this.token = t;
    },
    refreshTokenValid() {
      return new Token(this.token).isRefreshTokenValid();
    },
  };
  return client as typeof client & Parameters<typeof primeRefreshToken>[0];
}

describe("primeRefreshToken", () => {
  it("hands intuit-oauth a lifetime that survives its own validity check", () => {
    const client = fakeClient();
    primeRefreshToken(client, {
      refresh_token: "rt",
      refresh_token_expires_at: Date.now() + 74 * DAY_MS,
    });

    // The bug this guards: setToken({refresh_token}) alone leaves the lifetime
    // at 0, so refresh() throws locally and never calls Intuit.
    expect(client.refreshTokenValid()).toBe(true);
    expect(client.token?.refresh_token).toBe("rt");
    expect(client.token?.x_refresh_token_expires_in).toBeGreaterThan(70 * 24 * 3600);
  });

  it("assumes the documented lifetime for tokens stored before we recorded it", () => {
    const client = fakeClient();
    primeRefreshToken(client, { refresh_token: "legacy" });

    expect(client.refreshTokenValid()).toBe(true);
  });

  it("refuses a token whose recorded expiry has passed", () => {
    const client = fakeClient();
    expect(() =>
      primeRefreshToken(client, {
        refresh_token: "rt",
        refresh_token_expires_at: Date.now() - DAY_MS,
      })
    ).toThrow(/Refresh token expired/);
  });
});

describe("refreshExpiryFrom", () => {
  it("uses the lifetime Intuit returns", () => {
    const expiry = refreshExpiryFrom({ x_refresh_token_expires_in: 8726400 });
    expect(Math.round((expiry - Date.now()) / DAY_MS)).toBe(101);
  });

  it("falls back to the documented lifetime when the field is absent", () => {
    const expiry = refreshExpiryFrom({});
    expect(Math.round((expiry - Date.now()) / DAY_MS)).toBe(101);
  });
});
