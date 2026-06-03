import { profileStore } from "../lib/token-store.js";
export function profileList() {
    const profiles = profileStore.list();
    if (profiles.length === 0) {
        console.log("No profiles configured. Run `intuit auth login` to create one.");
        return;
    }
    console.log("Profiles:\n");
    for (const p of profiles) {
        const marker = p.active ? " (active)" : "";
        const realm = p.realmId ? ` — Realm: ${p.realmId}` : "";
        console.log(`  ${p.name} [${p.env}]${marker}${realm}`);
    }
}
export function profileSwitch(name) {
    profileStore.setActive(name);
    console.log(`Switched to profile "${name}".`);
}
export function profileRemove(name) {
    profileStore.remove(name);
    console.log(`Removed profile "${name}".`);
}
