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
    debug(`  Body: ${body.length > 500 ? body.slice(0, 500) + "..." : body}`);
  }
}

export function debugResponse(status: number, statusText: string, headers: Headers, durationMs: number) {
  if (!enabled) return;

  debug(`← ${status} ${statusText} (${durationMs}ms)`);
  const intuitTid = headers.get("intuit_tid");
  if (intuitTid) debug(`  intuit_tid: ${intuitTid}`);
  const contentType = headers.get("content-type");
  if (contentType) debug(`  Content-Type: ${contentType}`);
  const rateLimit = headers.get("x-ratelimit-remaining");
  if (rateLimit) debug(`  Rate-Limit-Remaining: ${rateLimit}`);
}
