import http from "node:http";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
const MAX_STORED_EVENTS = 100;
const EVENTS_DIR = path.join(os.homedir(), ".config", "intuit-cli");
const EVENTS_FILE = path.join(EVENTS_DIR, "webhook-events.json");
export function verifySignature(payload, signature, verifierToken) {
    const hash = crypto
        .createHmac("sha256", verifierToken)
        .update(payload)
        .digest("base64");
    return hash === signature;
}
function loadEvents() {
    try {
        return JSON.parse(fs.readFileSync(EVENTS_FILE, "utf-8"));
    }
    catch {
        return [];
    }
}
function saveEvents(events) {
    fs.mkdirSync(EVENTS_DIR, { recursive: true });
    fs.writeFileSync(EVENTS_FILE, JSON.stringify(events.slice(-MAX_STORED_EVENTS), null, 2));
}
export function matchesFilter(type, filters) {
    if (filters.length === 0)
        return true;
    return filters.some(f => f.toLowerCase() === type.toLowerCase());
}
export function webhooksListen(options) {
    const { port, verifierToken, events: eventFilters = [], forwardTo } = options;
    const storedEvents = loadEvents();
    let eventCount = 0;
    const server = http.createServer(async (req, res) => {
        if (req.method !== "POST") {
            res.writeHead(405);
            res.end("Method not allowed");
            return;
        }
        const chunks = [];
        for await (const chunk of req) {
            chunks.push(chunk);
        }
        const payload = Buffer.concat(chunks).toString("utf-8");
        const signature = req.headers["intuit-signature"];
        const timestamp = new Date().toISOString();
        if (!signature) {
            console.log(`\n${timestamp}  ✗ REJECTED — Missing intuit-signature header`);
            res.writeHead(401);
            res.end("Missing signature");
            return;
        }
        const valid = verifySignature(payload, signature, verifierToken);
        if (!valid) {
            console.log(`\n${timestamp}  ✗ REJECTED — Invalid signature`);
            res.writeHead(401);
            res.end("Invalid signature");
            return;
        }
        // Store every verified payload
        const event = { timestamp, payload, signatureValid: true };
        storedEvents.push(event);
        saveEvents(storedEvents);
        try {
            const cloudEvents = JSON.parse(payload);
            for (const ce of cloudEvents) {
                const type = ce.type || "";
                if (!matchesFilter(type, eventFilters))
                    continue;
                eventCount++;
                console.log(`\n#${eventCount}  ${timestamp}  ✓ ${type}`);
                console.log(`  ${JSON.stringify(ce, null, 2)}`);
                if (forwardTo) {
                    try {
                        const start = Date.now();
                        const fwdRes = await fetch(forwardTo, {
                            method: "POST",
                            headers: { "Content-Type": "application/json", "intuit-signature": signature },
                            body: payload,
                        });
                        const ms = Date.now() - start;
                        console.log(`  → Forwarded to ${forwardTo} [${fwdRes.status}] (${ms}ms)`);
                    }
                    catch (err) {
                        const msg = err instanceof Error ? err.message : String(err);
                        console.log(`  → Forward failed: ${msg}`);
                    }
                }
            }
        }
        catch {
            console.log(`\n${timestamp}  ✓ VERIFIED (could not parse payload body)`);
            console.log(`  ${payload}`);
        }
        res.writeHead(200);
        res.end("OK");
    });
    server.on("error", (err) => {
        if (err.code === "EADDRINUSE") {
            console.error(`Error: Port ${port} is already in use.`);
            process.exit(1);
        }
        throw err;
    });
    server.listen(port, "0.0.0.0", () => {
        console.log(`\nWebhook listener running at http://localhost:${port}/`);
        console.log(`Verifying signatures with provided token.`);
        console.log(`Payload format: CloudEvents v1.0`);
        if (eventFilters.length > 0) {
            console.log(`Filtering: ${eventFilters.join(", ")}`);
        }
        if (forwardTo) {
            console.log(`Forwarding to: ${forwardTo}`);
        }
        console.log(`Events stored at: ${EVENTS_FILE}`);
        console.log(`\n⚠ QuickBooks requires a public HTTPS URL — localhost won't receive events directly.`);
        console.log(`  Run a tunnel in another terminal to expose this port:\n`);
        console.log(`    ngrok http ${port}`);
        console.log(`    npx localtunnel --port ${port}`);
        console.log(`    ssh -R 80:localhost:${port} nokey@localhost.run`);
        console.log(`\n  Then paste the HTTPS URL in your app's Webhooks settings at https://developer.intuit.com`);
        console.log(`\n  Run 'intuit webhooks guide' for full setup instructions.`);
        console.log(`\nWaiting for events...`);
    });
}
