import { tokenStore, profileStore, type TokenData } from "./token-store.js";
import { configureTls } from "./tls.js";
import { fetchWithRetry } from "./retry.js";
import { debug, debugRequest, debugResponse } from "./debug.js";

const GQL_URLS: Record<string, string> = {
  sandbox: "https://qb-sandbox.api.intuit.com/graphql",
  production: "https://qb.api.intuit.com/graphql"
};

function getGqlUrl(profile?: string): string {
  const info = profileStore.getInfo(profile);
  const env = info?.env || "sandbox";
  return GQL_URLS[env] || GQL_URLS.sandbox;
}

async function makeGqlRequest(token: TokenData, url: string, body: string): Promise<Response> {
  return fetchWithRetry(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token.access_token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body,
  });
}

export async function graphqlFetch(
  query: string,
  variables: Record<string, unknown>,
  operationName: string,
  profile?: string
): Promise<Record<string, unknown>> {
  configureTls();

  const p = profile || profileStore.getActive();
  let token = await tokenStore.getValidToken(p);
  const url = getGqlUrl(p);
  const bodyStr = JSON.stringify({ query, variables, operationName });

  debugRequest("POST", url, { Authorization: `Bearer ${token.access_token}`, "Content-Type": "application/json" }, bodyStr);

  const start = Date.now();
  let res = await makeGqlRequest(token, url, bodyStr);
  let bodyText = await res.text();
  debugResponse(res.status, res.statusText, res.headers, Date.now() - start, bodyText);

  if (res.status === 401 && token.refresh_token) {
    debug("Access token expired, refreshing...");
    token = await tokenStore.refreshToken(token, p);
    const start2 = Date.now();
    res = await makeGqlRequest(token, url, bodyStr);
    bodyText = await res.text();
    debugResponse(res.status, res.statusText, res.headers, Date.now() - start2, bodyText);
  }

  const intuitTid = res.headers.get("intuit_tid") || "unknown";

  // Try to parse as JSON; some failure paths return non-JSON (HTML error pages,
  // empty bodies on 5xx). Surface the raw body if so.
  let parsed: { data?: Record<string, unknown>; errors?: { message: string }[] } | null = null;
  if (bodyText) {
    try {
      parsed = JSON.parse(bodyText);
    } catch {
      // Not JSON — handled below.
    }
  }

  if (!res.ok) {
    let detail = "";
    if (parsed?.errors && parsed.errors.length > 0) {
      detail = `\n  GraphQL errors: ${parsed.errors.map(e => e.message).join("; ")}`;
    } else if (bodyText) {
      detail = `\n  body: ${bodyText}`;
    }
    throw new Error(`GraphQL request failed: ${res.status} ${res.statusText}\n  intuit_tid: ${intuitTid}${detail}`);
  }

  // HTTP 200 with errors in the body — GraphQL's partial-success / authorization
  // path. Treat it as a failure too; the caller almost never wants the partial
  // data without knowing something went wrong.
  if (parsed?.errors && parsed.errors.length > 0) {
    throw new Error(`GraphQL error: ${parsed.errors.map(e => e.message).join("; ")}\n  intuit_tid: ${intuitTid}`);
  }

  return parsed?.data || {};
}

export async function graphqlQuery(
  query: string,
  variables: Record<string, unknown>,
  operationName: string,
  profile?: string
): Promise<Record<string, unknown>> {
  return graphqlFetch(query, variables, operationName, profile);
}

export async function graphqlMutation(
  mutation: string,
  variables: Record<string, unknown>,
  operationName: string,
  profile?: string
): Promise<Record<string, unknown>> {
  return graphqlFetch(mutation, variables, operationName, profile);
}
