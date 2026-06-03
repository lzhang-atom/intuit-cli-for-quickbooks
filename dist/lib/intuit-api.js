import { tokenStore, profileStore } from "./token-store.js";
import { configureTls } from "./tls.js";
import { fetchWithRetry } from "./retry.js";
import { debug, debugRequest, debugResponse } from "./debug.js";
const BASE_URLS = {
    sandbox: "https://sandbox-quickbooks.api.intuit.com/v3/company",
    production: "https://quickbooks.api.intuit.com/v3/company"
};
function getBaseUrl(profile) {
    const info = profileStore.getInfo(profile);
    const env = info?.env || "sandbox";
    return BASE_URLS[env] || BASE_URLS.sandbox;
}
async function makeRequest(token, url, init) {
    return fetchWithRetry(url, {
        ...init,
        headers: {
            Authorization: `Bearer ${token.access_token}`,
            Accept: "application/json",
            ...init?.headers
        }
    });
}
export async function intuitFetch(path, init, profile) {
    configureTls();
    const p = profile || profileStore.getActive();
    let token = await tokenStore.getValidToken(p);
    const baseUrl = getBaseUrl(p);
    const url = `${baseUrl}/${token.realmId}/${path}`;
    const method = init?.method || "GET";
    const headers = {
        Authorization: `Bearer ${token.access_token}`,
        Accept: "application/json",
        ...(init?.headers || {}),
    };
    debugRequest(method, url, headers, init?.body);
    const start = Date.now();
    let res = await makeRequest(token, url, init);
    debugResponse(res.status, res.statusText, res.headers, Date.now() - start);
    if (res.status === 401 && token.refresh_token) {
        debug("Access token expired, refreshing...");
        token = await tokenStore.refreshToken(token, p);
        const start2 = Date.now();
        res = await makeRequest(token, url, init);
        debugResponse(res.status, res.statusText, res.headers, Date.now() - start2);
    }
    if (!res.ok) {
        const intuitTid = res.headers.get("intuit_tid") || "unknown";
        const body = await res.text();
        let message = `${res.status} ${res.statusText}`;
        try {
            const parsed = JSON.parse(body);
            const fault = parsed?.Fault?.Error?.[0];
            if (fault) {
                message = `${res.status} ${fault.Message}${fault.Detail ? ` — ${fault.Detail}` : ""}`;
            }
        }
        catch {
            // use default status message
        }
        debug(`API error response body: ${body}`);
        throw new Error(`Intuit API error: ${message}\n  intuit_tid: ${intuitTid}`);
    }
    return res;
}
export async function intuitGet(path, profile) {
    const res = await intuitFetch(path, undefined, profile);
    return res.json();
}
export async function intuitPost(entity, body, profile) {
    const res = await intuitFetch(entity, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    }, profile);
    return res.json();
}
export async function intuitQuery(query, profile) {
    const res = await intuitFetch(`query?query=${encodeURIComponent(query)}`, undefined, profile);
    return res.json();
}
const PAGE_SIZE = 100;
const MAX_LIMIT = 500;
export async function intuitQueryPaginated(entity, options, profile) {
    const results = [];
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
        if (items.length < batchSize)
            break;
        startPosition += items.length;
    }
    return results;
}
