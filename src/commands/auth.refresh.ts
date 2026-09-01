import { createOAuthClient } from "../lib/oauth.js";
import { tokenStore, profileStore, primeRefreshToken, refreshExpiryFrom } from "../lib/token-store.js";
import { configureTls } from "../lib/tls.js";

export async function authRefresh(profile?: string) {
  configureTls();

  const p = profile || profileStore.getActive();
  const token = tokenStore.get(p);
  if (!token?.refresh_token) {
    throw new Error("No refresh token found. Run `intuit auth login` first.");
  }

  const info = profileStore.getInfo(p);
  const oauth = createOAuthClient(info?.env);
  primeRefreshToken(oauth, token);

  const authResponse = await oauth.refresh();
  tokenStore.set({
    access_token: authResponse.token.access_token,
    refresh_token: authResponse.token.refresh_token,
    realmId: token.realmId,
    expires_at: Date.now() + 3600 * 1000,
    refresh_token_expires_at: refreshExpiryFrom(authResponse.token),
    requestedScopes: token.requestedScopes,
  }, p);

  console.log(`Token refreshed successfully. (Profile: ${p})`);
}
