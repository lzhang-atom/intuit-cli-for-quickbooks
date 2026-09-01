import { tokenStore, profileStore } from "../lib/token-store.js";
// Map known Premium scope strings back to friendly names for display.
const PREMIUM_SCOPE_TO_LABEL = {
    "project-management.project": "projects",
    "app-foundations.custom-field-definitions": "custom-fields",
    "app-foundations.custom-dimensions.read": "dimensions",
};
/** Warn this far ahead of refresh-token expiry — past it, only a browser re-login recovers. */
const REFRESH_EXPIRY_WARN_MS = 14 * 24 * 60 * 60 * 1000;
/**
 * A refresh token past its expiry is dead weight: auto-refresh will fail and
 * only `auth login` recovers. Status must say so rather than reporting the
 * token as present.
 */
function computeRefreshState(token) {
    if (!token?.refresh_token)
        return { status: "missing", expiresAt: null };
    const expiresAt = token.refresh_token_expires_at;
    if (expiresAt && Date.now() >= expiresAt)
        return { status: "expired", expiresAt };
    return { status: "present", expiresAt: expiresAt ?? null };
}
function isoDay(ms) {
    return new Date(ms).toISOString().slice(0, 10);
}
function classifyScopes(requestedScopes) {
    if (!requestedScopes || requestedScopes.length === 0)
        return { requested: [], premium: [] };
    const premium = requestedScopes
        .filter((s) => PREMIUM_SCOPE_TO_LABEL[s] !== undefined)
        .map((s) => PREMIUM_SCOPE_TO_LABEL[s]);
    return { requested: requestedScopes, premium };
}
export function authStatus(profile, options = {}) {
    const envProfile = process.env.INTUIT_PROFILE;
    const active = profileStore.getActive();
    const p = profile || active;
    const token = tokenStore.get(p);
    const info = profileStore.getInfo(p);
    const isActive = p === active;
    // Derive the unified state once; both JSON and human paths use it.
    const refresh = computeRefreshState(token);
    const state = computeState(token, refresh);
    const scopeInfo = classifyScopes(token?.requestedScopes);
    if (options.json) {
        const json = {
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
                status: refresh.status,
                expiresAt: refresh.expiresAt ? new Date(refresh.expiresAt).toISOString() : null,
                expiresInMs: refresh.expiresAt ? refresh.expiresAt - Date.now() : null,
            },
            requestedScopes: scopeInfo.requested.length > 0 ? scopeInfo.requested : null,
            premiumScopes: scopeInfo.premium,
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
    let accessTokenLabel;
    if (state.accessStatus === "unknown") {
        accessTokenLabel = "Unknown (no expiry recorded)";
    }
    else if (state.accessStatus === "valid") {
        const mins = Math.round(((token.expires_at ?? 0) - Date.now()) / 60000);
        accessTokenLabel = `Valid (${mins}m remaining)`;
    }
    else {
        // expired
        accessTokenLabel = refresh.status === "present"
            ? "Expired (will auto-refresh on next call)"
            : "Expired (no usable refresh token; re-login required)";
    }
    let refreshTokenLabel;
    if (refresh.status === "missing") {
        refreshTokenLabel = "Missing";
    }
    else if (refresh.status === "expired") {
        refreshTokenLabel = `Expired ${isoDay(refresh.expiresAt)} (re-login required)`;
    }
    else if (refresh.expiresAt) {
        const days = Math.floor((refresh.expiresAt - Date.now()) / 86_400_000);
        refreshTokenLabel = `Valid until ${isoDay(refresh.expiresAt)} (${days}d; rotates on each use)`;
    }
    else {
        refreshTokenLabel = "Present (expiry unrecorded; ~101d max, rotates on each use)";
    }
    const scopesLabel = scopeInfo.requested.length === 0
        ? "Unknown (token was issued before scope tracking)"
        : scopeInfo.premium.length === 0
            ? "standard (no Premium APIs)"
            : `standard + Premium: ${scopeInfo.premium.join(", ")}`;
    const rows = [
        { key: "Profile", value: `${p}${isActive ? " (active)" : ""}`, from: profileSource },
        { key: "Environment", value: info?.env || "unknown", from: "profiles.json" },
        { key: "Realm ID", value: token.realmId || "unknown", from: "profiles.json" },
        { key: "Credentials", value: hasEnvCreds || hasLegacyCreds ? "Configured" : "Not found", from: credsSource },
        { key: "Access Token", value: accessTokenLabel, from: `~/.config/intuit-cli/${p}.tokens.enc.json` },
        { key: "Refresh Token", value: refreshTokenLabel, from: `~/.config/intuit-cli/${p}.tokens.enc.json` },
        { key: "Scopes", value: scopesLabel, from: `~/.config/intuit-cli/${p}.tokens.enc.json` },
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
    // The refresh token is the only thing standing between the CLI and a browser
    // re-login, and it dies silently. Surface it while it can still be renewed.
    if (refresh.status === "expired") {
        console.log(`\n⚠  Refresh token expired ${isoDay(refresh.expiresAt)} — run \`intuit auth login --profile ${p}\` to reconnect.`);
    }
    else if (refresh.expiresAt && refresh.expiresAt - Date.now() < REFRESH_EXPIRY_WARN_MS) {
        const days = Math.floor((refresh.expiresAt - Date.now()) / 86_400_000);
        console.log(`\n⚠  Refresh token expires ${isoDay(refresh.expiresAt)} (${days}d). Any command run before then renews it automatically.`);
    }
    if (isProd) {
        console.log(`\n⚠  Production environment — changes affect live QuickBooks data.`);
    }
    if (!isActive) {
        console.log(`\nThis is not the active profile. Run \`intuit profile switch ${p}\` to make it active.`);
    }
}
function computeState(token, refresh) {
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
    if (refresh.status === "present") {
        return {
            accessStatus,
            effectiveStatus: "needs-refresh",
            nextAction: "auto-refresh-on-next-call",
        };
    }
    return { accessStatus, effectiveStatus: "needs-relogin", nextAction: "run-auth-login" };
}
function effectiveStatusLabel(s) {
    switch (s) {
        case "ready": return "ready (access token valid)";
        case "needs-refresh": return "needs-refresh (access expired; CLI will auto-refresh on next call)";
        case "needs-relogin": return "needs-relogin (no usable refresh token)";
        case "no-credentials": return "no-credentials (run auth login)";
    }
}
function nextActionGuidance(action, p) {
    switch (action) {
        case "auto-refresh-on-next-call":
            return "         Next API call will trigger an automatic refresh — no action needed.";
        case "run-auth-login":
            return `         Run \`intuit auth login --profile ${p}\` to re-authenticate.`;
    }
}
