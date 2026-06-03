import { intuitQuery } from "../lib/intuit-api.js";

export async function queryRun(query: string, profile?: string) {
  return intuitQuery(query, profile);
}
