import { intuitQuery } from "../lib/intuit-api.js";
export async function queryRun(query, profile) {
    return intuitQuery(query, profile);
}
