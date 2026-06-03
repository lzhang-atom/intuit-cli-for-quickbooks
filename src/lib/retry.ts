import { debug } from "./debug.js";

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;

function isRetryable(status: number): boolean {
  return status === 429 || status === 500 || status === 502 || status === 503 || status === 504;
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

export async function fetchWithRetry(url: string, init?: RequestInit): Promise<Response> {
  let lastError: Error | undefined;
  let lastResponse: Response | undefined;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(url, init);

      if (res.ok || !isRetryable(res.status) || attempt === MAX_RETRIES) {
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

      const delay = getRetryDelay(attempt);
      console.error(`Request failed. Retrying in ${delay / 1000}s... (attempt ${attempt + 1}/${MAX_RETRIES})`);
      await sleep(delay);
    }
  }

  if (lastResponse) return lastResponse;
  throw lastError || new Error("Request failed after retries");
}
