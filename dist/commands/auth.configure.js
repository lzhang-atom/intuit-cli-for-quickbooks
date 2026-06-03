import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";
const DEVELOPER_DASHBOARD_URL = "https://developer.intuit.com/app/developer/dashboard";
const APP_SETTINGS_URL = "https://developer.intuit.com/appdetail/settings";
const ENV_FILE = path.resolve(process.cwd(), ".env");
function prompt(rl, question) {
    return new Promise((resolve) => rl.question(question, resolve));
}
function envVarNames(env) {
    const isProd = env === "production";
    return {
        idKey: isProd ? "INTUIT_PROD_CLIENT_ID" : "INTUIT_SANDBOX_CLIENT_ID",
        secretKey: isProd ? "INTUIT_PROD_CLIENT_SECRET" : "INTUIT_SANDBOX_CLIENT_SECRET",
    };
}
function readEnvVar(content, key) {
    const match = content.match(new RegExp(`^${key}=(.+)$`, "m"));
    return match?.[1]?.trim() || "";
}
function setEnvVar(content, key, value) {
    const pattern = new RegExp(`^${key}=.*$`, "m");
    if (pattern.test(content)) {
        return content.replace(pattern, `${key}=${value}`);
    }
    return content.trimEnd() + `\n${key}=${value}\n`;
}
export async function authConfigure(envArg) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    let env;
    if (envArg) {
        env = envArg;
    }
    else {
        console.log("\nWhich environment are you configuring?\n");
        console.log("  1. Sandbox (development/testing)");
        console.log("  2. Production (live data)\n");
        const choice = (await prompt(rl, "Environment (1/2): ")).trim();
        if (choice === "2" || choice.toLowerCase() === "production") {
            env = "production";
        }
        else {
            env = "sandbox";
        }
    }
    const isProd = env === "production";
    const label = isProd ? "Production" : "Sandbox";
    // Intuit Developer Portal uses "Development" for sandbox keys and
    // "Production" for production keys, even though the CLI flag is --env sandbox.
    const portalSection = isProd ? "Production" : "Development";
    const { idKey, secretKey } = envVarNames(env);
    const existing = fs.existsSync(ENV_FILE);
    let currentId = "";
    let currentSecret = "";
    if (existing) {
        const content = fs.readFileSync(ENV_FILE, "utf-8");
        currentId = readEnvVar(content, idKey);
        currentSecret = readEnvVar(content, secretKey);
    }
    console.log(`\n── Intuit QuickBooks CLI Setup (${label}) ──\n`);
    console.log("Step 1: Create or select your app");
    console.log(`  → ${DEVELOPER_DASHBOARD_URL}\n`);
    console.log(`Step 2: Go to Keys & credentials → ${portalSection} section`);
    console.log(`  Copy the Client ID and Client Secret from the "${portalSection}" tab\n`);
    if (isProd) {
        console.log("  Note: Production keys require app review and approval from Intuit.\n");
    }
    console.log("Step 3: Add a Redirect URI in your app settings");
    console.log(`  → ${APP_SETTINGS_URL}`);
    if (isProd) {
        console.log("  Production requires a registered HTTPS URL (localhost is not supported)\n");
    }
    else {
        console.log("  Add: http://localhost:9477/callback\n");
    }
    try {
        const idHint = currentId ? ` (current: ${currentId.slice(0, 8)}..., press Enter to keep)` : "";
        const secretHint = currentSecret ? " (current: ****, press Enter to keep)" : "";
        const clientId = (await prompt(rl, `${label} Client ID${idHint}: `)).trim();
        const clientSecret = (await prompt(rl, `${label} Client Secret${secretHint}: `)).trim();
        if (!clientId && !currentId) {
            console.error("\nError: Client ID is required.");
            process.exit(1);
        }
        if (!clientSecret && !currentSecret) {
            console.error("\nError: Client Secret is required.");
            process.exit(1);
        }
        const finalId = clientId || currentId;
        const finalSecret = clientSecret || currentSecret;
        let envContent = existing ? fs.readFileSync(ENV_FILE, "utf-8") : "";
        envContent = setEnvVar(envContent, idKey, finalId);
        envContent = setEnvVar(envContent, secretKey, finalSecret);
        fs.writeFileSync(ENV_FILE, envContent, { mode: 0o600 });
        console.log(`\n.env ${existing ? "updated" : "created"} at ${ENV_FILE}`);
        console.log(`  ${idKey}=${finalId.slice(0, 8)}...`);
        console.log(`  ${secretKey}=****`);
        const nextEnv = isProd ? "production" : "sandbox";
        console.log(`\nNext step: run \`intuit auth login --env ${nextEnv}\` to connect your QuickBooks company.`);
        if (!isProd) {
            console.log(`\nTo configure production credentials later, run: \`intuit auth configure --env production\``);
        }
    }
    finally {
        rl.close();
    }
}
