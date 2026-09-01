# Command reference

## Entity / verb matrix

| Entity | list | get | create | update | void | delete |
|---|---|---|---|---|---|---|
| `customers` | ✓ | ✓ | ✓ | ✓ | — | — |
| `vendors` | ✓ | ✓ | ✓ | ✓ | — | — |
| `employees` | ✓ | ✓ | ✓ | ✓ | — | — |
| `items` | ✓ | ✓ | ✓ | ✓ | — | — |
| `accounts` | ✓ | ✓ | — | — | — | — |
| `invoices` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `payments` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `estimates` | ✓ | ✓ | ✓ | ✓ | — | ✓ |
| `salesreceipts` | ✓ | ✓ | ✓ | ✓ | — | ✓ |
| `creditmemos` | ✓ | ✓ | ✓ | ✓ | — | ✓ |
| `bills` | ✓ | ✓ | ✓ | — | — | ✓ |
| `billpayments` | ✓ | ✓ | ✓ | ✓ | — | ✓ |
| `purchases` | ✓ | ✓ | ✓ | ✓ | — | ✓ |
| `deposits` | ✓ | ✓ | ✓ | ✓ | — | ✓ |

`accounts` is read-only — the chart of accounts is not editable through this CLI.

Other command groups: `auth`, `profile`, `company info|preferences`, `query`,
`webhooks guide|listen|replay`, and the Premium APIs `projects`, `custom-fields`,
`dimensions` (see *Premium APIs* below).

## Flag support is uneven — check before you rely on it

`--dry-run` and `--idempotency-tag` exist **only** on:

- `customers create`
- `invoices create`
- `vendors create`
- `projects create` (`--dry-run` also on `projects delete` / `projects attach`)
- `custom-fields create` / `update` / `attach`
- `dimensions attach`

Every other write — including all `update`, `void`, and `delete` — has neither.
For those, stage the payload in a file, show it to the user, and confirm before
running.

Universal on `list`: `--where`, `--order-by`, `--limit <n>` (default 100, max 500),
`--all`, `--json`, `--csv`.
Universal on `get`: `--json`, `--csv`.
Universal everywhere: `--profile <name>`.
Global: `--debug` dumps full HTTP request/response to stderr.

## Payload files

`create` and `update` accept `-f/--file <path>` holding a raw QBO entity body as
JSON — not a wrapper object. The repo's `examples/` directory has a template per
entity. An invoice line:

```json
{
  "CustomerRef": { "value": "42" },
  "Line": [
    {
      "Amount": 2400.00,
      "Description": "Consulting services — March 2026",
      "DetailType": "SalesItemLineDetail",
      "SalesItemLineDetail": {
        "ItemRef": { "value": "1" },
        "Qty": 20,
        "UnitPrice": 120
      }
    }
  ]
}
```

Shorthand flags cover the simple case only: `--customer-ref`, `--amount`,
`--item-ref` build a one-line invoice. Anything with multiple lines,
descriptions, quantities, terms, or tax needs `--file`.

`update` requires the entity's current `SyncToken` for optimistic concurrency —
`get` it first. A stale token returns a `400`.

## Query syntax

`--where` takes a QBO SQL fragment; `intuit query` takes a whole statement.

| Operator | Example |
|---|---|
| `=` `!=` `>` `<` `>=` `<=` | `--where "Balance > 0"` |
| `LIKE` | `--where "DisplayName LIKE '%Acme%'"` |
| `IN` | `--where "Id IN ('1','2','3')"` |
| `AND` | `--where "Balance > 0 AND Active = true"` |

Rules that bite:

- **String values need single quotes**, including numeric IDs: `CustomerRef = '42'`.
- **`OR` is not supported.** Run separate queries and merge.
- **Not every field is queryable.** `Deposit.TotalAmt`, for instance, is not —
  `QueryValidationError: property 'TotalAmt' is not queryable`. Fall back to
  fetching a date range and filtering the JSON locally.
- **Fields differ per entity.** `JournalEntry` and `Transfer` have no `TotalAmt`
  at all. Ask for `Id, TxnDate` and inspect one record to learn the shape.
- `SELECT *` is allowed and usually the fastest way to see available fields.
- Pagination in raw `query` uses `STARTPOSITION n MAXRESULTS m`; typed `list`
  commands handle it via `--all`.

## Entity relationships worth knowing

- An **Invoice** carries `CustomerRef`, `Line[]`, `TotalAmt`, `Balance`, `DueDate`.
  `Balance` of 0 means paid or voided; the invoice itself has no status field.
- A **Payment** links to invoices through `Line[].LinkedTxn[]` with
  `{TxnId, TxnType: "Invoice"}`. Its `UnappliedAmt` is money received but not yet
  applied to any invoice.
- A Payment's `DepositToAccountRef` names the account the money lands in. Omit it
  and QuickBooks applies the company's default, commonly **Undeposited Funds** —
  which holds money recorded but not yet deposited. Set it explicitly when the
  destination matters, and read the account back rather than assuming.
- **Customer.Balance** is total open AR for that customer across all invoices.
- **Bills** are payables; **BillPayments** settle them, linking the same way
  Payments link to Invoices.
- **Purchase** covers card/cash expenses; **Deposit** covers money in that isn't
  a customer payment.

## Premium APIs

`projects`, `custom-fields`, and `dimensions` hit Intuit's GraphQL IES endpoints
and require both app approval and opt-in scopes set **before login**:

```bash
# .env
INTUIT_PROD_PREMIUM_SCOPES=project-management.project app-foundations.custom-field-definitions
```

Scopes are baked into the token at login, so changing them requires a fresh
`auth login`. Without approval, requests return `403`.

## Webhooks

`intuit webhooks listen --verifier-token <token>` starts a **local** listener for
development; it is not a hosted endpoint. `webhooks replay` shows recently
captured events. Signature verification is automatic.
