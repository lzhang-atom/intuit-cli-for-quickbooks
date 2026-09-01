# Setup

Only needed when `intuit auth status` reports `no-credentials` or `needs-relogin`.
**The login step requires a browser and a TTY — the user must run it themselves.**
Prepare everything else, then hand them the exact command.

## 1. Install

```bash
npm install -g intuit-cli      # or: npx intuit-cli --help
```

Node 18+. Verify with `intuit --version`.

## 2. Intuit Developer app

The user needs an app at [developer.intuit.com](https://developer.intuit.com/app/developer/dashboard).
Its **Keys & credentials** tab has separate Development and Production key pairs —
different values, not interchangeable.

Register the redirect URI in the app's Settings, in the list matching the
environment:

- **Sandbox:** `http://localhost:9477/callback`
- **Production:** a registered **HTTPS** URL — localhost is rejected

Production redirect URIs may be gated behind Intuit's app-assessment
questionnaire. If the field is locked, that questionnaire is the blocker.

### Getting an HTTPS callback for production

The CLI's OAuth listener binds to `localhost:9477`, so a tunnel is the usual
answer:

```bash
ngrok http --url=https://<your-static-domain>.ngrok-free.dev 9477
```

Register `https://<your-static-domain>.ngrok-free.dev/callback` as the production
redirect URI. Free ngrok accounts get one **static** domain, so it stays valid
across restarts. Expect ngrok's "Visit Site" interstitial mid-flow — the OAuth
code passes through it intact.

## 3. Credentials

Interactive (needs a TTY):

```bash
intuit auth configure --env sandbox
intuit auth configure --env production
```

Or write `.env` directly:

```
INTUIT_SANDBOX_CLIENT_ID=...
INTUIT_SANDBOX_CLIENT_SECRET=...
INTUIT_PROD_CLIENT_ID=...
INTUIT_PROD_CLIENT_SECRET=...

# Only if the app has Premium API approval — must be set BEFORE login
INTUIT_PROD_PREMIUM_SCOPES=project-management.project
```

`auth configure` touches only the two keys for the environment you name —
replacing those lines if present, appending them if not, leaving the rest of
`.env` alone. Run it once per environment. Verify what's set without printing
secrets:

```bash
sed -E 's/=.*/=<set>/' .env
```

Other variables: `INTUIT_PROFILE` (override active profile),
`INTUIT_OAUTH_TIMEOUT_MS` (callback wait, default 600000),
`INTUIT_WEBHOOK_VERIFIER_TOKEN`, `NODE_EXTRA_CA_CERTS` (corporate proxy CA).

## 4. Login — user runs this

```bash
# sandbox
intuit auth login --profile sandbox --env sandbox

# production
intuit auth login --profile prod --env production \
  --redirect-uri https://<your-domain>/callback
```

The browser opens Intuit's consent page; the user picks the company and
approves. **On production, confirm they select the real company, not a sandbox
one.** The listener waits 10 minutes.

Then verify:

```bash
intuit auth status
intuit company info      # first real API call
```

A successful login that fails on the first API call points at app approval, not
configuration.

## 5. Profiles

Each connection is a named profile in `~/.config/intuit-cli/profiles.json`;
tokens are encrypted per profile alongside it.

```bash
intuit profile list
intuit profile switch client-a
intuit customers list --profile client-b     # one-off override
```

Keep sandbox and production in separate profiles, named so the difference is
obvious at a glance.

## Token lifetimes

Access tokens last 1 hour and refresh silently. **Refresh tokens last ~101 days
and rotate on every use**, so routine activity keeps a connection alive
indefinitely — but a profile left idle past that window needs the full browser
login again, HTTPS redirect and all.

Where the build records it, `intuit auth status` prints the refresh token's
expiry date and warns within 14 days; older builds show only a generic maximum.
Surface that warning to the user — recovering a production connection is
considerably more work than keeping one alive.

## Troubleshooting

| Symptom | Cause |
|---|---|
| `The Refresh token is invalid, please Authorize again` | On older versions, a client-side bug that never contacted Intuit. Upgrade; otherwise re-login |
| Login succeeds, first API call 403s | App lacks production approval for that API |
| `Port 9477 is already in use` | Another login is running, or a stale listener |
| Redirect URI mismatch | The registered URI must match exactly, including scheme, port, and `/callback` |
| Premium commands 403 | Scopes weren't set in `.env` before login; set them and log in again |
