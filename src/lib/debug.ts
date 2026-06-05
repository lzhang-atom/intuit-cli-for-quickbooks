let enabled = false;

export function enableDebug() {
  enabled = true;
}

export function isDebug(): boolean {
  return enabled;
}

export function debug(message: string) {
  if (enabled) {
    process.stderr.write(`[DEBUG] ${message}\n`);
  }
}

// Cap printed bodies so a 5MB response doesn't blow up the terminal. 8KB is
// enough to show GraphQL error envelopes, full REST entity payloads, and the
// first chunk of any list response.
const BODY_LOG_CAP = 8192;

function formatBody(body: string): string {
  if (body.length === 0) return "(empty)";
  // Attempt pretty-print if it looks like JSON; fall back to raw.
  const trimmed = body.trimStart();
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    try {
      const parsed = JSON.parse(body);
      const pretty = JSON.stringify(parsed, null, 2);
      return pretty.length > BODY_LOG_CAP
        ? pretty.slice(0, BODY_LOG_CAP) + `\n  ... (truncated, ${pretty.length - BODY_LOG_CAP} bytes more)`
        : pretty;
    } catch {
      // Not valid JSON; fall through to raw.
    }
  }
  return body.length > BODY_LOG_CAP
    ? body.slice(0, BODY_LOG_CAP) + `... (truncated, ${body.length - BODY_LOG_CAP} bytes more)`
    : body;
}

export function debugRequest(method: string, url: string, headers: Record<string, string>, body?: string) {
  if (!enabled) return;

  const masked = { ...headers };
  if (masked.Authorization) {
    const token = masked.Authorization.replace("Bearer ", "");
    masked.Authorization = `Bearer ${token.slice(0, 6)}...${token.slice(-4)}`;
  }

  debug(`→ ${method} ${url}`);
  for (const [key, val] of Object.entries(masked)) {
    debug(`  ${key}: ${val}`);
  }
  if (body) {
    debug(`  Body:`);
    for (const line of formatBody(body).split("\n")) debug(`    ${line}`);
  }
}

export function debugResponse(status: number, statusText: string, headers: Headers, durationMs: number, body?: string) {
  if (!enabled) return;

  debug(`← ${status} ${statusText} (${durationMs}ms)`);
  const intuitTid = headers.get("intuit_tid");
  if (intuitTid) debug(`  intuit_tid: ${intuitTid}`);
  const contentType = headers.get("content-type");
  if (contentType) debug(`  Content-Type: ${contentType}`);
  const rateLimit = headers.get("x-ratelimit-remaining");
  if (rateLimit) debug(`  Rate-Limit-Remaining: ${rateLimit}`);
  if (body !== undefined) {
    debug(`  Body:`);
    for (const line of formatBody(body).split("\n")) debug(`    ${line}`);
  }
}
