# Intuit QuickBooks CLI

> Agent-ready by design, deterministic by default. JSON-first. Auth handled. Composable with Claude, OpenAI, LangChain, MCP hosts, or your own orchestrator.

`intuit-cli` is a structured-output CLI for the QuickBooks Online API, designed equally for developer keystrokes and autonomous AI agents. Every command emits parseable `--json` on demand. OAuth tokens refresh silently. Rate limits retry automatically. Errors carry trace IDs ready for support escalation. There is no integration code to write — just `intuit <noun> <verb>` and pipe it.

## What it does

### 🔐 Auth, handled
OAuth 2.0 with encrypted token storage, silent refresh on expiry, multi-realm profiles. Sign in once; agents run for weeks.

### 📚 Browse 17 entity types
Customers · Vendors · Invoices · Estimates · Payments · Bills · Bill Payments · Sales Receipts · Credit Memos · Deposits · Purchases · Items · Accounts · Employees · **Projects** · **Custom Fields** · **Dimensions** *(IES Premium APIs)*

### 🔎 Inspect anything
`intuit <entity> get <id> --json` returns the full record — IDs, sync tokens, audit context.

### ✍️ Create and update
Quick flags for one-shot writes (`--display-name`, `--amount`, `--due-date`) or full-fidelity JSON files for everything else.

### 🤖 Agent-grade write safety
- `--dry-run` previews the request body without sending it
- `--idempotency-tag <run-id>` writes a partner-supplied marker into entity Notes for full audit traceability

### 🔍 Query and listen
- QBO Query Language for ad-hoc filters: `intuit customers list --where "Balance > 0"`
- Local webhook server with signature verification and event replay
- Multi-realm profiles for partners managing dozens of customers

### 🛠 Debug-friendly
`--debug` logs every HTTP request and response with timing and `intuit_tid` for support escalation.

---

## Why it's agent-ready

| What agents need | What the CLI does |
|---|---|
| Structured output | `--json` on every read; stable schemas |
| Silent token management | OAuth refresh happens inside the CLI; agents never see expired tokens |
| Resilience to flakiness | 429s and 5xx retried with backoff automatically |
| Deterministic invocation | Verb-noun grammar, same args produce same request |
| Audit traceability | `--idempotency-tag` + `intuit_tid` on every error |
| Safe previews | `--dry-run` on writes for plan-then-execute flows |

**No SDK to choose. No framework to adopt.** Pipe `intuit ...` into whatever agent runtime you're already using — Claude Agent SDK, OpenAI Agents, Google Gemini, LangChain, MCP, or a shell script.

## Install

```bash
npm install -g intuit-cli
```

Or try without installing:

```bash
npx intuit-cli --help
```

<details>
<summary>Install from source</summary>

```bash
git clone https://github.com/intuit/intuit-cli.git
cd intuit-cli
npm install
npm run build
npm link
```
</details>

## Prerequisites

- Node.js 18+
- An Intuit Developer app with OAuth 2.0 credentials ([create one here](https://developer.intuit.com/app/developer/dashboard))
- Redirect URI configured in your app's settings:
  - **Sandbox:** `http://localhost:9477/callback`
  - **Production:** A registered HTTPS URL (e.g. `https://yourapp.com/callback`) — localhost is not supported

<details>
<summary>Credential setup</summary>

Run `intuit auth configure` for interactive setup, or create a `.env` file manually:

```
INTUIT_SANDBOX_CLIENT_ID=your_sandbox_client_id
INTUIT_SANDBOX_CLIENT_SECRET=your_sandbox_client_secret
INTUIT_PROD_CLIENT_ID=your_production_client_id
INTUIT_PROD_CLIENT_SECRET=your_production_client_secret
```

Sandbox and Production use separate Client IDs and Secrets.
</details>

## Quickstart

```bash
intuit auth configure                  # interactive credential setup
intuit auth login --env sandbox        # opens browser for OAuth
intuit auth status                     # verify connection
intuit customers list --json           # first call
```

For a step-by-step walkthrough including portal setup, see [`docs/quickstart.rst`](docs/quickstart.rst).

## For AI agents

The CLI is a usable agent tool surface as-is. Pipe `intuit ...` into any agent runtime — Claude Agent SDK, OpenAI Agents, LangChain, an MCP host, or a shell script. No SDK to learn beyond the CLI grammar itself.

### Example: autonomous AP workflow

```bash
intuit vendors list --json                      # agent resolves vendor Id
intuit accounts list --json                     # agent resolves expense account Id
intuit bills create --vendor-ref 42 --amount 1200 --expense-account-ref 7 --idempotency-tag run-b3a7
# Created bill [98] — $1200.00
```

### Plan-then-execute write safety

Both `--dry-run` and `--idempotency-tag` are supported on every create command. Use them together for plan-then-approve flows:

```bash
intuit customers create --display-name "Acme" --email a@b.com --dry-run --idempotency-tag run-b3a7
# (prints request body, no write performed)

intuit customers create --display-name "Acme" --email a@b.com --idempotency-tag run-b3a7
# Created customer [42] Acme   ← Notes field tagged "[via Intuit CLI · run run-b3a7]"
```

After the run, search QBO for `[via Intuit CLI · run <id>]` to find every entity an agent created. Audit, rollback, or filter as needed.

### Error handling

Every error is human-formatted on stderr and includes an `intuit_tid` trace ID. The CLI's exit code is `1` for any failure. Common patterns:

- `401 Unauthorized` → token expired and refresh failed; re-run `auth login`
- `429 Too Many Requests` → rate limited; the CLI retries automatically with backoff
- `404 Not Found` → entity ID doesn't exist on this realm
- `400` with `Fault.Error` → validation failure; the message identifies the bad field

### Event-driven agents

Pair with `intuit webhooks listen` to react to QBO events. Verified signatures and event replay are built in.

```bash
intuit webhooks listen --verifier-token <token> --events qbo.customer.created.v1
```

## Authentication

Each connection is a named **profile**. The first login creates `default` automatically. Access tokens auto-refresh; refresh tokens last 101 days.

```bash
intuit auth login --profile client-a --env sandbox
intuit auth login --profile prod --env production --redirect-uri https://yourapp.com/callback
intuit auth status --profile client-a --json   # machine-readable status
intuit profile list
intuit profile switch client-a
intuit customers list --profile client-b       # one-off override
```

See [Intuit's sandbox documentation](https://developer.intuit.com/app/developer/qbo/docs/develop/sandboxes) for setting up test companies.

## Commands at a glance

The full grammar is `intuit <noun> <verb> [args] [flags]`. List commands support `--where`, `--order-by`, `--limit`, `--all`, `--json`, `--csv`. Create commands support `--dry-run` and `--idempotency-tag` on supported entities.

```bash
# Browse with filters
intuit customers list --where "Balance > 0" --order-by "DisplayName ASC" --json
intuit invoices list --all --csv > invoices.csv

# Inspect a single entity
intuit invoices get 123 --json

# Write — inline flags or --file for full payloads (see examples/)
intuit customers create --display-name "Acme Corp" --email a@b.com
intuit invoices create --file examples/invoice.json --idempotency-tag run-b3a7

# Update is sparse — only the fields you supply change
intuit customers update 42 --email new@acme.com

# Void (accounting-correct, balance zeroed) vs delete (permanent)
intuit invoices void 123
intuit invoices delete 123

# Raw QBO query
intuit query "SELECT * FROM Customer MAXRESULTS 10"

# Debug any command
intuit customers list --debug
```

See the [Command reference](#command-reference) below for the full table. Sample JSON payloads live in [`examples/`](examples/).

### Shell completions

```bash
eval "$(intuit completions bash)"   # add to ~/.bashrc
eval "$(intuit completions zsh)"    # add to ~/.zshrc
```

## Command reference

| Command | Description |
|---------|-------------|
| **Auth & Profiles** | |
| `auth configure` | Set up OAuth credentials interactively |
| `auth login` | Authenticate with QuickBooks (`--profile`, `--env`, `--redirect-uri`) |
| `auth status` | Check token status and config provenance |
| `auth refresh` | Manually refresh access token |
| `auth logout` | Clear tokens and remove profile |
| `profile list` | List all configured profiles |
| `profile switch <name>` | Switch active profile |
| `profile remove <name>` | Remove a profile |
| **Entities** | All support `get <id>`. List commands support `--where`, `--order-by`, `--limit`, `--all`, `--json`, `--csv` |
| `customers list/get/create/update` | Customers (`--display-name`, `--email`, `--phone`, `--file`) |
| `invoices list/get/create/update/void/delete` | Invoices (`--customer-ref`, `--amount`, `--item-ref`, `--file`) |
| `payments list/get/create/update/void/delete` | Payments (`--customer-ref`, `--amount`, `--file`) |
| `estimates list/get/create/update/delete` | Estimates (`--customer-ref`, `--amount`, `--item-ref`, `--file`) |
| `salesreceipts list/get/create/update/delete` | Sales receipts (`--customer-ref`, `--amount`, `--item-ref`, `--file`) |
| `creditmemos list/get/create/update/delete` | Credit memos (`--customer-ref`, `--amount`, `--item-ref`, `--file`) |
| `purchases list/get/create/update/delete` | Purchases/expenses (`--account-ref`, `--expense-account-ref`, `--amount`, `--payment-type`, `--file`) |
| `employees list/get/create/update` | Employees (`--given-name`, `--family-name`, `--email`, `--file`) |
| `billpayments list/get/create/update/delete` | Bill payments (`--vendor-ref`, `--amount`, `--pay-type`, `--bank-account-ref`, `--cc-account-ref`, `--file`) |
| `deposits list/get/create/update/delete` | Deposits (`--account-ref`, `--line-account-ref`, `--amount`, `--file`) |
| `bills list/get/create/delete` | Bills (`--vendor-ref`, `--expense-account-ref`, `--amount`, `--file`) |
| `vendors list/get/create/update` | Vendors (`--display-name`, `--email`, `--phone`, `--file`) |
| `items list/get/create/update` | Items (`--name`, `--type`, `--income-account-ref`, `--expense-account-ref`, `--file`) |
| `accounts list/get` | Chart of accounts |
| `company info` | Company details (`--json`, `--csv`) |
| **Webhooks** | |
| `webhooks guide` | Show webhook setup instructions |
| `webhooks listen` | Capture events locally (`--port`, `--verifier-token`, `--events`, `--forward-to`) |
| `webhooks replay` | Show recent events (`--last`, `--json`) |
| **Other** | |
| `query <statement>` | Run a raw QBO query |
| `completions bash/zsh` | Generate shell completions |

**Global flags:** `--debug` (verbose HTTP logging), `--help`, `--version`

Use `--help` on any command for details: `intuit invoices create --help`

## Security

- Tokens are encrypted with **AES-256-GCM** and stored at `~/.config/intuit-cli/`
- Encryption keys are kept in your **OS keychain** (macOS Keychain, Windows Credential Manager, or Linux Secret Service)
- Token files are created with `0600` permissions (owner read/write only)
- Access tokens auto-refresh using the refresh token — no credentials stored in plaintext

## Rate limits

The QuickBooks Online API enforces per-realm limits (500 requests/min, 10 concurrent). The CLI retries 429 responses with exponential backoff automatically. See [Intuit's throttling documentation](https://developer.intuit.com/app/developer/qbo/docs/learn/rest-api-features#limits-and-throttles).

## Query syntax (`--where` and `--order-by`)

The `--where` flag uses [QBO query language](https://developer.intuit.com/app/developer/qbo/docs/learn/explore-the-quickbooks-online-api/data-queries) syntax. String values must be single-quoted.

| Operator | Example |
|----------|---------|
| `=` | `--where "Balance = 0"` |
| `!=` | `--where "Active != false"` |
| `>` / `<` | `--where "Balance > 100"` |
| `LIKE` | `--where "DisplayName LIKE '%Acme%'"` |
| `IN` | `--where "Id IN ('1', '2', '3')"` |
| Combined | `--where "Balance > 0 AND Active = true"` |

The `--order-by` flag takes a field name and optional direction:

```bash
intuit customers list --order-by "DisplayName ASC"
intuit invoices list --order-by "DueDate DESC"
```

## Environment variables

| Variable | Description |
|----------|-------------|
| `INTUIT_SANDBOX_CLIENT_ID` | Sandbox OAuth Client ID |
| `INTUIT_SANDBOX_CLIENT_SECRET` | Sandbox OAuth Client Secret |
| `INTUIT_PROD_CLIENT_ID` | Production OAuth Client ID |
| `INTUIT_PROD_CLIENT_SECRET` | Production OAuth Client Secret |
| `INTUIT_PROFILE` | Override the active profile (useful in CI/CD, scripts, and agentic workflows) |
| `INTUIT_WEBHOOK_VERIFIER_TOKEN` | Default verifier token for `webhooks listen` |
| `NODE_EXTRA_CA_CERTS` | Path to custom CA bundle (for corporate proxies) |

## Troubleshooting

| Error | Cause | Fix |
|-------|-------|-----|
| `Missing sandbox credentials` | No Client ID/Secret configured | Run `intuit auth configure --env sandbox` |
| `401 Unauthorized` | Access token expired and refresh failed | Run `intuit auth login` to re-authenticate |
| `403 Forbidden` | App lacks required OAuth scopes | Check your app's scopes at developer.intuit.com |
| `429 Rate limited` | Too many requests per minute | CLI retries automatically; reduce request volume if persistent |
| `ECONNREFUSED` | Can't reach Intuit API servers | Check network/proxy; set `NODE_EXTRA_CA_CERTS` for corporate proxies |
| `Port 9477 is already in use` | Another process on the OAuth callback port | Kill the process or wait for the prior login to complete |
| `OAuth callback timed out` | Browser auth not completed within 2 minutes | Retry `intuit auth login`; ensure redirect URI matches your app config |

Use `--debug` to see the full HTTP request/response for any command. The `intuit_tid` value in error output can be shared with Intuit support for troubleshooting.

## Uninstall

```bash
intuit auth logout                                          # clear tokens
rm -rf ~/.config/intuit-cli                                 # remove all CLI data
security delete-generic-password -s intuit-cli 2>/dev/null  # macOS keychain cleanup
```

## Development

```bash
npm run dev -- auth login
npm run dev -- customers list
```

## License

Apache 2.0 — see [LICENSE](LICENSE)
