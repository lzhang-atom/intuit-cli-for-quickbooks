import { intuitGet, intuitPost } from "./intuit-api.js";
/**
 * Perform a void or delete operation on a QBO entity.
 * Both operations require fetching the entity first to get the SyncToken.
 */
export async function entityOperation(apiPath, responseKey, id, operation, profile) {
    const data = await intuitGet(`${apiPath}/${id}`, profile);
    const entity = data[responseKey];
    if (!entity) {
        throw new Error(`${responseKey} ${id} not found.`);
    }
    const result = await intuitPost(`${apiPath}?operation=${operation}`, {
        Id: entity.Id,
        SyncToken: entity.SyncToken,
        sparse: true,
    }, profile);
    return result[responseKey];
}
