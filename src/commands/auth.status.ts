import { tokenStore, profileStore } from "../lib/token-store.js";

/**
 * Effective auth state. Partners building tooling on top of the CLI should
 * read this single field rather than inspecting access/refresh independently.
 */
export type EffectiveStatus =
  | "ready"            // access token valid; safe to issue API calls
  | "needs-refresh"    // access expired but refresh present; CLI will auto-refresh
  | "needs-relogin"    // refresh missing or invalid; user must re-authenticate
  | "no-credentials";  // no token in storage at all

export type AuthStatusJson = {
  profile: string;
  active: boolean;
  authenticated: boolean;
  env: string | null;
  realmId: string | null;
  effectiveStatus: EffectiveStatus;
  accessToken: {
    status: "valid" | "expired" | "unknown" | "missing";
    expiresAt: string | null;
    expiresInMs: number | null;
  };
  refreshToken: {
    status: "present" | "missing";
  };
  /** What to do next, if anything. Stable enum a tool can switch on. */
  nextAction: "none" | "auto-refresh-on-next-call" | "run-auth-login";
};

export function authStatus(profile?: string, options: { json?: boolean } = {}) {
  const envProfile = process.env.INTUIT_PROFILE;
  const active = profileStore.getActive();
  const p = profile || active;
  const token = tokenStore.get(p);
  const info = profileStore.getInfo(p);
  const isActive = p === active;

  // Derive the unified state once; both JSON and human paths use it.
  const state = computeState(token, info?.env);

  if (options.json) {
    const json: AuthStatusJson = {
      profile: p,
      active: isActive,
      authenticated: !!token?.access_token,
      env: info?.env ?? null,
      realmId: token?.realmId ?? null,
      effectiveStatus: state.effectiveStatus,
      accessToken: {
        status: state.accessStatus,
        expiresAt: token?.expires_at ? new Date(token.expires_at).toISOString() : null,
        expiresInMs: token?.expires_at ? token.expires_at - Date.now() : null,
      },
      refreshToken: {
        status: token?.refresh_token ? "present" : "missing",
      },
      nextAction: state.nextAction,
    };
    console.log(JSON.stringify(json, null, 2));
    return;
  }

  // Not authenticated at all → short, clear output.
  if (!token?.access_token) {
    console.log(`Not authenticated (profile: ${p}). Run \`intuit auth login --profile ${p}\` to connect.`);
    return;
  }

  // Determine provenance for each value
  const profileSource = profile
    ? "--profile flag"
    : envProfile
      ? "INTUIT_PROFILE env var"
      : "profiles.json";

  const isProd = info?.env === "production";
  const hasEnvCreds = isProd
    ? !!(process.env.INTUIT_PROD_CLIENT_ID && process.env.INTUIT_PROD_CLIENT_SECRET)
    : !!(process.env.INTUIT_SANDBOX_CLIENT_ID && process.env.INTUIT_SANDBOX_CLIENT_SECRET);
  const hasLegacyCreds = !!(process.env.INTUIT_CLIENT_ID && process.env.INTUIT_CLIENT_SECRET);

  const credsSource = hasEnvCreds
    ? `INTUIT_${isProd ? "PROD" : "SANDBOX"}_CLIENT_* env vars`
    : hasLegacyCreds
      ? "INTUIT_CLIENT_* env vars"
      : ".env file";

  // Human-formatted access-token status with explicit relationship to refresh
  let accessTokenLabel: string;
  if (state.accessStatus === "unknown") {
    accessTokenLabel = "Unknown (no expiry recorded)";
  } else if (state.accessStatus === "valid") {
    const mins = Math.round(((token.expires_at ?? 0) - Date.now()) / 60000);
    accessTokenLabel = `Valid (${mins}m remaining)`;
  } else {
    // expired
    accessTokenLabel = token.refresh_token
      ? "Expired (will auto-refresh on next call)"
      : "Expired (no refresh token; re-login required)";
  }

  const refreshTokenLabel = token.refresh_token
    ? "Present (rotates on each use, ~101d max)"
    : "Missing";

  const rows = [
    { key: "Profile", value: `${p}${isActive ? " (active)" : ""}`, from: profileSource },
    { key: "Environment", value: info?.env || "unknown", from: "profiles.json" },
    { key: "Realm ID", value: token.realmId || "unknown", from: "profiles.json" },
    { key: "Credentials", value: hasEnvCreds || hasLegacyCreds ? "Configured" : "Not found", from: credsSource },
    { key: "Access Token", value: accessTokenLabel, from: `~/.config/intuit-cli/${p}.tokens.enc.json` },
    { key: "Refresh Token", value: refreshTokenLabel, from: `~/.config/intuit-cli/${p}.tokens.enc.json` },
  ];

  const maxKey = Math.max(...rows.map(r => r.key.length));
  const maxVal = Math.max(...rows.map(r => r.value.length));

  console.log("");
  console.log(`${"Setting".padEnd(maxKey)}  ${"Value".padEnd(maxVal)}  Source`);
  console.log(`${"─".repeat(maxKey)}  ${"─".repeat(maxVal)}  ${"─".repeat(30)}`);
  for (const r of rows) {
    console.log(`${r.key.padEnd(maxKey)}  ${r.value.padEnd(maxVal)}  ${r.from}`);
  }

  // Effective status — single line summary that's the actual answer to
  // "is auth ready?" Don't bury it in a table cell; print it explicitly.
  console.log("");
  console.log(`Status: ${effectiveStatusLabel(state.effectiveStatus)}`);
  if (state.nextAction !== "none") {
    console.log(nextActionGuidance(state.nextAction, p));
  }

  if (isProd) {
    console.log(`\n⚠  Production environment — changes affect live QuickBooks data.`);
  }
  if (!isActive) {
    console.log(`\nThis is not the active profile. Run \`intuit profile switch ${p}\` to make it active.`);
  }
}

function computeState(
  token: { access_token?: string; refresh_token?: string; expires_at?: number } | null | undefined,
  _env: string | undefined,
): {
  accessStatus: "valid" | "expired" | "unknown" | "missing";
  effectiveStatus: EffectiveStatus;
  nextAction: "none" | "auto-refresh-on-next-call" | "run-auth-login";
} {
  if (!token?.access_token) {
    return { accessStatus: "missing", effectiveStatus: "no-credentials", nextAction: "run-auth-login" };
  }
  const accessStatus = !token.expires_at
    ? "unknown"
    : Date.now() >= token.expires_at ? "expired" : "valid";

  if (accessStatus === "valid" || accessStatus === "unknown") {
    return { accessStatus, effectiveStatus: "ready", nextAction: "none" };
  }
  // expired
  if (token.refresh_token) {
    return {
      accessStatus,
      effectiveStatus: "needs-refresh",
      nextAction: "auto-refresh-on-next-call",
    };
  }
  return { accessStatus, effectiveStatus: "needs-relogin", nextAction: "run-auth-login" };
}

function effectiveStatusLabel(s: EffectiveStatus): string {
  switch (s) {
    case "ready": return "ready (access token valid)";
    case "needs-refresh": return "needs-refresh (access expired; CLI will auto-refresh on next call)";
    case "needs-relogin": return "needs-relogin (no usable refresh token)";
    case "no-credentials": return "no-credentials (run auth login)";
  }
}

function nextActionGuidance(action: "auto-refresh-on-next-call" | "run-auth-login", p: string): string {
  switch (action) {
    case "auto-refresh-on-next-call":
      return "         Next API call will trigger an automatic refresh — no action needed.";
    case "run-auth-login":
      return `         Run \`intuit auth login --profile ${p}\` to re-authenticate.`;
  }
}
