import crypto from "node:crypto";
import { tokenStore, profileStore, type TokenData } from "./token-store.js";
import { configureTls } from "./tls.js";
import { fetchWithRetry } from "./retry.js";
import { debug, debugRequest, debugResponse } from "./debug.js";

const BASE_URLS: Record<string, string> = {
  sandbox: "https://sandbox-quickbooks.api.intuit.com/v3/company",
  production: "https://quickbooks.api.intuit.com/v3/company"
};

// Anything that isn't a plain read mutates data and needs an idempotency key.
const WRITE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

/**
 * Attach QBO's `requestid` idempotency key to a write.
 *
 * Intuit deduplicates on (company, requestid): a repeat of the same requestid
 * returns the original response instead of performing the write a second time.
 * Without it, a create whose response is lost to a timeout or 5xx cannot be
 * retried safely — the retry books a duplicate transaction.
 *
 * The key is generated once per logical request, so every retry attempt
 * (network error, 5xx, and the 401-refresh replay) reuses the same URL and
 * therefore the same key.
 */
function withRequestId(path: string, method: string): string {
  if (!WRITE_METHODS.has(method.toUpperCase())) return path;
  if (/[?&]requestid=/i.test(path)) return path; // caller supplied one
  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}requestid=${crypto.randomUUID()}`;
}

function getBaseUrl(profile?: string): string {
  const info = profileStore.getInfo(profile);
  const env = info?.env || "sandbox";
  return BASE_URLS[env] || BASE_URLS.sandbox;
}

async function makeRequest(
  token: TokenData,
  url: string,
  init?: RequestInit,
  idempotent = false
): Promise<Response> {
  return fetchWithRetry(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${token.access_token}`,
      Accept: "application/json",
      ...init?.headers
    }
  }, { idempotent });
}

export async function intuitFetch(path: string, init?: RequestInit, profile?: string): Promise<Response> {
  configureTls();

  const p = profile || profileStore.getActive();
  let token = await tokenStore.getValidToken(p);
  const baseUrl = getBaseUrl(p);

  const method = init?.method || "GET";
  // Writes carry a requestid, which makes them safe for fetchWithRetry to replay.
  const requestPath = withRequestId(path, method);
  const isWrite = WRITE_METHODS.has(method.toUpperCase());
  const url = `${baseUrl}/${token.realmId}/${requestPath}`;

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token.access_token}`,
    Accept: "application/json",
    ...(init?.headers as Record<string, string> || {}),
  };
  debugRequest(method, url, headers, init?.body as string | undefined);

  const start = Date.now();
  let res = await makeRequest(token, url, init, isWrite);
  let bodyText = await res.text();
  debugResponse(res.status, res.statusText, res.headers, Date.now() - start, bodyText);

  if (res.status === 401 && token.refresh_token) {
    debug("Access token expired, refreshing...");
    token = await tokenStore.refreshToken(token, p);
    const start2 = Date.now();
    // Same url, so a write replays under its original requestid.
    res = await makeRequest(token, url, init, isWrite);
    bodyText = await res.text();
    debugResponse(res.status, res.statusText, res.headers, Date.now() - start2, bodyText);
  }

  if (!res.ok) {
    const intuitTid = res.headers.get("intuit_tid") || "unknown";
    let message = `${res.status} ${res.statusText}`;
    try {
      const parsed = JSON.parse(bodyText);
      const fault = parsed?.Fault?.Error?.[0];
      if (fault) {
        message = `${res.status} ${fault.Message}${fault.Detail ? ` — ${fault.Detail}` : ""}`;
      }
    } catch {
      // use default status message
    }
    throw new Error(`Intuit API error: ${message}\n  intuit_tid: ${intuitTid}`);
  }

  // Re-attach the consumed body so callers using res.json() still work without
  // a second network round-trip. node-fetch / undici don't allow re-reading a
  // consumed body, so we attach a parsed-JSON shortcut here.
  (res as unknown as { _cachedBody: string })._cachedBody = bodyText;
  return res;
}

function readCachedBody(res: Response): string {
  const cached = (res as unknown as { _cachedBody?: string })._cachedBody;
  if (cached === undefined) {
    throw new Error("intuit-api: response body was not cached — this is a CLI bug");
  }
  return cached;
}

export async function intuitGet(path: string, profile?: string) {
  const res = await intuitFetch(path, undefined, profile);
  const text = readCachedBody(res);
  return text ? JSON.parse(text) : {};
}

export async function intuitPost(entity: string, body: Record<string, unknown>, profile?: string) {
  const res = await intuitFetch(entity, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }, profile);
  const text = readCachedBody(res);
  return text ? JSON.parse(text) : {};
}

export async function intuitQuery(query: string, profile?: string) {
  const res = await intuitFetch(`query?query=${encodeURIComponent(query)}`, undefined, profile);
  const text = readCachedBody(res);
  return text ? JSON.parse(text) : {};
}

const PAGE_SIZE = 100;
const MAX_LIMIT = 500;

export type ListOptions = {
  limit: number;
  all: boolean;
  where?: string;
  orderBy?: string;
};

export async function intuitQueryPaginated(
  entity: string,
  options: ListOptions,
  profile?: string
): Promise<unknown[]> {
  const results: unknown[] = [];
  let startPosition = 1;
  const maxResults = options.all ? Infinity : Math.min(options.limit, MAX_LIMIT);

  const whereClause = options.where ? ` WHERE ${options.where}` : "";
  const orderByClause = options.orderBy ? ` ORDERBY ${options.orderBy}` : "";

  while (results.length < maxResults) {
    const batchSize = options.all ? PAGE_SIZE : Math.min(PAGE_SIZE, maxResults - results.length);
    const query = `SELECT * FROM ${entity}${whereClause}${orderByClause} STARTPOSITION ${startPosition} MAXRESULTS ${batchSize}`;
    const data = await intuitQuery(query, profile);

    const items = data.QueryResponse?.[entity] || [];
    results.push(...items);

    if (items.length < batchSize) break;
    startPosition += items.length;
  }

  return results;
}
