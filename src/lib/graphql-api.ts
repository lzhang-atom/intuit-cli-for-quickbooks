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
  debugResponse(res.status, res.statusText, res.headers, Date.now() - start);

  if (res.status === 401 && token.refresh_token) {
    debug("Access token expired, refreshing...");
    token = await tokenStore.refreshToken(token, p);
    const start2 = Date.now();
    res = await makeGqlRequest(token, url, bodyStr);
    debugResponse(res.status, res.statusText, res.headers, Date.now() - start2);
  }

  if (!res.ok) {
    const intuitTid = res.headers.get("intuit_tid") || "unknown";
    let detail = "";
    try {
      const errBody = await res.text();
      if (errBody) {
        try {
          const parsed = JSON.parse(errBody) as { errors?: { message: string }[] };
          if (parsed.errors && parsed.errors.length > 0) {
            detail = `\n  GraphQL errors: ${parsed.errors.map(e => e.message).join("; ")}`;
          } else {
            detail = `\n  body: ${errBody}`;
          }
        } catch {
          detail = `\n  body: ${errBody}`;
        }
      }
    } catch {
      // ignore body-read failures
    }
    throw new Error(`GraphQL request failed: ${res.status} ${res.statusText}\n  intuit_tid: ${intuitTid}${detail}`);
  }

  const json = await res.json() as { data?: Record<string, unknown>; errors?: { message: string }[] };

  if (json.errors && json.errors.length > 0) {
    const intuitTid = res.headers.get("intuit_tid") || "unknown";
    throw new Error(`GraphQL error: ${json.errors.map(e => e.message).join("; ")}\n  intuit_tid: ${intuitTid}`);
  }

  return json.data || {};
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
