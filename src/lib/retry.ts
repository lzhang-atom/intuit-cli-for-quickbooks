import { debug } from "./debug.js";

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;

// Methods with no side effects, so replaying one can never duplicate data.
// Writes are safe to replay only when they carry an idempotency key the server
// deduplicates on — see RetryOptions.idempotent.
const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

export type RetryOptions = {
  /**
   * Marks a write as safe to replay. Set this only when the request carries an
   * idempotency key the server honors (QBO's `requestid`). Without one, a
   * write the server already committed but whose response was lost gets
   * replayed as a second transaction — a duplicate invoice, bill, or payment.
   */
  idempotent?: boolean;
};

function isRetryable(status: number): boolean {
  return status === 429 || status === 500 || status === 502 || status === 503 || status === 504;
}

function isReplayable(init?: RequestInit, options?: RetryOptions): boolean {
  if (options?.idempotent) return true;
  return SAFE_METHODS.has((init?.method || "GET").toUpperCase());
}

function getRetryDelay(attempt: number, res?: Response): number {
  // Respect Retry-After header if present
  const retryAfter = res?.headers.get("Retry-After");
  if (retryAfter) {
    const seconds = parseInt(retryAfter, 10);
    if (!isNaN(seconds)) return seconds * 1000;
  }

  // Exponential backoff: 1s, 2s, 4s
  return BASE_DELAY_MS * Math.pow(2, attempt);
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function fetchWithRetry(
  url: string,
  init?: RequestInit,
  options?: RetryOptions
): Promise<Response> {
  let lastError: Error | undefined;
  let lastResponse: Response | undefined;
  const replayable = isReplayable(init, options);

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(url, init);

      if (res.ok || !isRetryable(res.status) || attempt === MAX_RETRIES) {
        return res;
      }

      // A non-replayable write may already have been committed server-side.
      // Surface the error rather than risk duplicating the transaction.
      if (!replayable) {
        debug(`${res.status} on a non-idempotent request — not retrying (would risk a duplicate write).`);
        return res;
      }

      lastResponse = res;
      const delay = getRetryDelay(attempt, res);

      if (res.status === 429) {
        debug(`Rate limited (429). Retry-After: ${res.headers.get("Retry-After") || "not set"}`);
        console.error(`Rate limited. Retrying in ${delay / 1000}s... (attempt ${attempt + 1}/${MAX_RETRIES})`);
      } else {
        debug(`Server error ${res.status}. Response headers: Content-Type=${res.headers.get("content-type")}`);
        console.error(`Server error ${res.status}. Retrying in ${delay / 1000}s... (attempt ${attempt + 1}/${MAX_RETRIES})`);
      }

      await sleep(delay);
    } catch (err) {
      lastError = err as Error;

      if (attempt === MAX_RETRIES) break;

      // A dropped connection is exactly the case where the server may have
      // committed the write and only the response was lost. Never replay a
      // write that carries no idempotency key.
      if (!replayable) {
        debug("Network error on a non-idempotent request — not retrying (would risk a duplicate write).");
        break;
      }

      const delay = getRetryDelay(attempt);
      console.error(`Request failed. Retrying in ${delay / 1000}s... (attempt ${attempt + 1}/${MAX_RETRIES})`);
      await sleep(delay);
    }
  }

  if (lastResponse) return lastResponse;
  throw lastError || new Error("Request failed after retries");
}
