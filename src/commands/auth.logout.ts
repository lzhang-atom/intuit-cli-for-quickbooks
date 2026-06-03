import { tokenStore, profileStore } from "../lib/token-store.js";

export function authLogout(profile?: string) {
  const p = profile || profileStore.getActive();
  const token = tokenStore.get(p);

  if (!token?.access_token) {
    console.log(`Not authenticated (profile: ${p}). Nothing to do.`);
    return;
  }

  tokenStore.clear(p);
  profileStore.remove(p);
  console.log(`Logged out and removed profile "${p}".`);
}
