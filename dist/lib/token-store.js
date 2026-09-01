import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import crypto from "node:crypto";
import { createOAuthClient } from "./oauth.js";
import { getOrCreateKey, deleteKey } from "./keychain.js";
import { configureTls } from "./tls.js";
const TOKEN_DIR = path.join(os.homedir(), ".config", "intuit-cli");
const PROFILES_PATH = path.join(TOKEN_DIR, "profiles.json");
function tokenPath(profile) {
    return path.join(TOKEN_DIR, `${profile}.tokens.enc.json`);
}
function encrypt(plaintext, profile) {
    const key = getOrCreateKey(profile);
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
    let encrypted = cipher.update(plaintext, "utf-8", "hex");
    encrypted += cipher.final("hex");
    const tag = cipher.getAuthTag();
    return {
        iv: iv.toString("hex"),
        tag: tag.toString("hex"),
        data: encrypted
    };
}
function decrypt(payload, profile) {
    const key = getOrCreateKey(profile);
    const decipher = crypto.createDecipheriv("aes-256-gcm", key, Buffer.from(payload.iv, "hex"));
    decipher.setAuthTag(Buffer.from(payload.tag, "hex"));
    let decrypted = decipher.update(payload.data, "hex", "utf-8");
    decrypted += decipher.final("utf-8");
    return decrypted;
}
function loadProfiles() {
    try {
        const raw = fs.readFileSync(PROFILES_PATH, "utf-8");
        return JSON.parse(raw);
    }
    catch {
        return { active: "default", profiles: {} };
    }
}
function saveProfiles(config) {
    fs.mkdirSync(TOKEN_DIR, { recursive: true });
    fs.writeFileSync(PROFILES_PATH, JSON.stringify(config, null, 2), { mode: 0o600 });
}
export const profileStore = {
    getActive() {
        return process.env.INTUIT_PROFILE || loadProfiles().active;
    },
    getInfo(profile) {
        const p = profile || this.getActive();
        const config = loadProfiles();
        return config.profiles[p] || null;
    },
    setActive(profile) {
        const config = loadProfiles();
        if (!config.profiles[profile]) {
            throw new Error(`Profile "${profile}" does not exist. Run \`intuit profile list\` to see available profiles.`);
        }
        config.active = profile;
        saveProfiles(config);
    },
    add(profile, env, realmId) {
        const config = loadProfiles();
        config.profiles[profile] = { name: profile, env, realmId };
        if (Object.keys(config.profiles).length === 1) {
            config.active = profile;
        }
        saveProfiles(config);
    },
    remove(profile) {
        const config = loadProfiles();
        delete config.profiles[profile];
        if (config.active === profile) {
            const remaining = Object.keys(config.profiles);
            config.active = remaining[0] || "default";
        }
        saveProfiles(config);
        tokenStore.clear(profile);
    },
    list() {
        const config = loadProfiles();
        return Object.entries(config.profiles).map(([key, val]) => ({
            ...val,
            name: key,
            active: key === config.active
        }));
    }
};
/**
 * Intuit's documented refresh-token lifetime is 100 days, issued as
 * x_refresh_token_expires_in (8726400s ≈ 101d). Used as the assumed lifetime
 * for tokens minted before we started recording the real value.
 */
const REFRESH_TOKEN_TTL_MS = 101 * 24 * 60 * 60 * 1000;
/** Absolute refresh-token expiry from an OAuth response, falling back to the documented TTL. */
export function refreshExpiryFrom(token) {
    const seconds = token.x_refresh_token_expires_in;
    return Date.now() + (seconds && seconds > 0 ? seconds * 1000 : REFRESH_TOKEN_TTL_MS);
}
/**
 * Load a stored refresh token into an OAuth client so refresh() will actually
 * call Intuit.
 *
 * intuit-oauth computes refresh validity as createdAt + x_refresh_token_expires_in
 * (Token.js _checkExpiry). setToken defaults createdAt to now and the lifetime to
 * 0, so a token carrying only refresh_token always reads as already expired and
 * validateToken() throws "The Refresh token is invalid, please Authorize again."
 * locally — the request never reaches Intuit. Handing it the real remaining
 * lifetime keeps Intuit the authority on whether the token still works.
 */
export function primeRefreshToken(oauth, token) {
    const expiresAt = token.refresh_token_expires_at ?? Date.now() + REFRESH_TOKEN_TTL_MS;
    const remainingMs = expiresAt - Date.now();
    if (remainingMs <= 0) {
        throw new Error(`Refresh token expired on ${new Date(expiresAt).toISOString().slice(0, 10)}. Run \`intuit auth login\`.`);
    }
    oauth.setToken({
        refresh_token: token.refresh_token,
        x_refresh_token_expires_in: Math.ceil(remainingMs / 1000),
        createdAt: Date.now(),
    });
}
export const tokenStore = {
    get(profile) {
        const p = profile || profileStore.getActive();
        try {
            const raw = fs.readFileSync(tokenPath(p), "utf-8");
            const payload = JSON.parse(raw);
            const decrypted = decrypt(payload, p);
            return JSON.parse(decrypted);
        }
        catch {
            return null;
        }
    },
    set(data, profile) {
        const p = profile || profileStore.getActive();
        fs.mkdirSync(TOKEN_DIR, { recursive: true });
        const payload = encrypt(JSON.stringify(data), p);
        fs.writeFileSync(tokenPath(p), JSON.stringify(payload, null, 2), { mode: 0o600 });
    },
    clear(profile) {
        const p = profile || profileStore.getActive();
        try {
            fs.unlinkSync(tokenPath(p));
        }
        catch {
            // file doesn't exist
        }
        deleteKey(p);
    },
    async getValidToken(profile) {
        const p = profile || profileStore.getActive();
        const token = this.get(p);
        if (!token?.access_token || !token.realmId) {
            throw new Error("Not authenticated. Run `intuit auth login` first.");
        }
        if (token.expires_at && Date.now() >= token.expires_at) {
            return this.refreshToken(token, p);
        }
        return token;
    },
    async refreshToken(token, profile) {
        const p = profile || profileStore.getActive();
        if (!token.refresh_token) {
            throw new Error("Token expired and no refresh token available. Run `intuit auth login`.");
        }
        const info = profileStore.getInfo(p);
        configureTls();
        const oauth = createOAuthClient(info?.env);
        primeRefreshToken(oauth, token);
        const authResponse = await oauth.refresh();
        const refreshed = {
            access_token: authResponse.token.access_token,
            refresh_token: authResponse.token.refresh_token,
            realmId: token.realmId,
            expires_at: Date.now() + 3600 * 1000,
            refresh_token_expires_at: refreshExpiryFrom(authResponse.token),
            // Refresh tokens inherit the original token's scope set — preserve so
            // auth status / Premium checks survive auto-refresh.
            requestedScopes: token.requestedScopes,
        };
        this.set(refreshed, p);
        console.log("Token refreshed automatically.");
        return refreshed;
    }
};
