import OAuthClient from "intuit-oauth";
export function getCredentials(env) {
    const isProd = env === "production";
    const clientId = isProd
        ? (process.env.INTUIT_PROD_CLIENT_ID || process.env.INTUIT_CLIENT_ID)
        : (process.env.INTUIT_SANDBOX_CLIENT_ID || process.env.INTUIT_CLIENT_ID);
    const clientSecret = isProd
        ? (process.env.INTUIT_PROD_CLIENT_SECRET || process.env.INTUIT_CLIENT_SECRET)
        : (process.env.INTUIT_SANDBOX_CLIENT_SECRET || process.env.INTUIT_CLIENT_SECRET);
    if (!clientId || !clientSecret) {
        const label = isProd ? "production" : "sandbox";
        throw new Error(`Missing ${label} credentials. Run \`intuit auth configure --env ${label}\` to set them up.`);
    }
    return { clientId, clientSecret };
}
export function createOAuthClient(env, redirectUri) {
    const environment = env === "production" ? "production" : "sandbox";
    const { clientId, clientSecret } = getCredentials(env);
    return new OAuthClient({
        clientId,
        clientSecret,
        environment,
        redirectUri: redirectUri || "http://localhost:9477/callback",
        logging: false
    });
}
