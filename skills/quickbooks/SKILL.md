---
name: quickbooks
description: Read and write QuickBooks Online accounting data through the intuit-cli command-line tool — invoices, customers, payments, bills, vendors, expenses, deposits, estimates, and the chart of accounts. Use when the user asks about QuickBooks or QBO, their books, invoicing a client, accounts receivable or payable, what a customer owes, recording a payment or expense, or wants to query, export, or create accounting records.
---

# QuickBooks Online via intuit-cli

`intuit-cli` wraps the QuickBooks Online Accounting API. Every command emits structured
output, OAuth refreshes silently, and rate limits retry on their own.

**These are real books.** A production profile writes to a business's live financial
records, where a mistake becomes an accounting correction rather than an undo. Read
before you write, and never invent a number that can be looked up.

## Start every session by checking auth

```bash
intuit auth status --json
```

Switch on `effectiveStatus`:

| Value | Meaning | What to do |
|---|---|---|
| `ready` | Access token valid | Proceed |
| `needs-refresh` | Access expired, refresh usable | Proceed — the next call refreshes automatically |
| `needs-relogin` | No usable refresh token | Stop. The user must run `intuit auth login` themselves (it needs a browser) |
| `no-credentials` | Nothing stored | Stop. See `references/setup.md` |

Also read `env`. If it is `production`, say so before any write. If
`refreshToken.expiresAt` is present, check it — past that date only a browser
re-login recovers the connection, and for production that also needs an HTTPS
redirect URI. Builds that predate that field report the refresh token as present
with no expiry, so treat its absence as unknown rather than as safe.

## The grammar

```
intuit <entity> <verb> [args] [--json|--csv] [--profile <name>]
```

Verbs are `list`, `get <id>`, `create`, `update <id>`, and — on some entities —
`void <id>` and `delete <id>`. Every `list` accepts `--where`, `--order-by`,
`--limit` (max 500), `--all`, `--json`, `--csv`. Every `get` accepts `--json` and `--csv`.

Use `--json` whenever you intend to parse the result; the default table view
truncates long values and omits line items.

For anything the typed commands don't reach, drop to raw QBO SQL:

```bash
intuit query "SELECT * FROM Deposit WHERE TxnDate >= '2026-08-01'"
```

`query` always returns raw JSON and has no `--json` flag. Full entity and verb
matrix, plus query syntax and its sharp edges, are in `references/commands.md`.

## Reading

```bash
intuit customers list --where "Balance > 0" --order-by "Balance DESC"
intuit invoices list --where "CustomerRef = '42'" --order-by "TxnDate DESC" --limit 5
intuit invoices get 1042 --json          # line items appear only in JSON
intuit accounts list                    # chart of accounts with balances
```

Resolve names to IDs first — `--where` clauses take IDs, not display names, and
`list` has no text-search flag. Get the ID from `customers list` or a `LIKE` query.

## Writing

Follow this sequence. Skipping step 1 is how an agent bills a client twice for
work that was already invoiced.

**1. Read what already exists.** Before creating anything, query for it. A monthly
invoice, a payment for a bill, an expense — check whether it is already recorded,
covering a wider date range than you think you need.

**2. Derive numbers from the books, not from memory.** Rates, balances, and prior
amounts are all queryable. If a figure can't be derived, ask rather than assume.

**3. Preview.** `--dry-run` prints the exact request body without sending. It is
supported on `customers create`, `invoices create`, `vendors create`, all
`projects` writes, `custom-fields` create/update/attach, and `dimensions attach`
— **and nowhere else**. For every other write (payments, bills, estimates,
deposits, purchases, sales receipts, credit memos, items, employees, bill
payments, and all `update`/`void`/`delete`), write the payload to a JSON file,
show it to the user, and get explicit confirmation before running the command.

**4. Confirm amounts with the user** before any production write.

**5. Tag it.** `--idempotency-tag <run-id>` appends `[via Intuit CLI · run <id>]`
to the entity's note field, so every record an agent created can be found later.
Same support list as `--dry-run`.

```bash
intuit invoices create --file /tmp/invoice.json --dry-run
intuit invoices create --file /tmp/invoice.json --idempotency-tag run-b3a7
```

`--file` takes a raw QBO entity body. `examples/*.json` in the repo has a
starting shape for each entity. Simple single-line invoices can skip the file:
`--customer-ref 42 --amount 2400 --item-ref 1`.

### What idempotency does and does not protect

Writes carry a QBO `requestid`, so Intuit deduplicates an identical call that
gets retried, and the CLI never replays an unkeyed write. This makes network
retries safe. **It does not stop a second, genuinely new invoice for work that
was already billed** — only step 1 does.

### Prefer `void` over `delete`

`invoices void` and `payments void` zero the balance while preserving the audit
trail. `delete` destroys the record. Void unless the user explicitly asks to delete.

## What this CLI cannot see

The Accounting API exposes **recorded** transactions only. The bank feed — the
"For Review" queue that QuickBooks' *Match* button works against — has no
endpoint here. You can report that no recorded transaction matches a given
amount; you cannot determine whether money has actually landed in the bank. Say
which of the two you checked, and point the user at their bank or the QBO
Banking tab for the other.

Payroll, reports (P&L, balance sheet), and attachments are likewise out of scope.

## Errors

Every failure exits `1` and prints an `intuit_tid` trace ID on stderr.

| Error | Meaning | Action |
|---|---|---|
| `401` | Refresh failed | Check `auth status`; may need re-login |
| `403` | Missing OAuth scope | Premium APIs need `INTUIT_<env>_PREMIUM_SCOPES` set at login time |
| `404` | ID not on this realm | Verify the ID, and that the right profile is active |
| `429` | Rate limited | Already retried with backoff; don't loop |
| `400` + `Fault.Error` | Validation | The message names the bad field |

`Property X not found for Entity Y` from `query` means that field isn't queryable
on that entity — not that the record is missing. Reach for a different filter.

## References

- `references/commands.md` — full entity/verb matrix, query syntax, flag support
- `references/setup.md` — install, OAuth credentials, sandbox vs production, profiles
- `references/recipes.md` — worked multi-step tasks (AR aging, invoice a client, reconcile a payment)
