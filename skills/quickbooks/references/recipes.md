# Recipes

Worked patterns. Each assumes `intuit auth status` already reported a usable state.

## Who owes money (AR aging)

```bash
intuit customers list --where "Balance > 0" --order-by "Balance DESC"
intuit invoices list --where "Balance > 0" --order-by "DueDate ASC" --all
```

Compare `DueDate` against today to bucket overdue. A customer's `Balance` is the
sum of their open invoices — if the two disagree, look for unapplied payments or
credit memos.

## Everything about one customer

```bash
intuit customers list --limit 500 | grep -i acme        # find the ID; no search flag exists
intuit invoices list --where "CustomerRef = '42'" --order-by "TxnDate DESC"
intuit payments list --where "CustomerRef = '42'" --order-by "TxnDate DESC"
intuit invoices get 1042 --json                          # line items live in JSON only
```

## Invoice a client for the period — the careful version

The failure mode here is billing twice. Work in this order.

```bash
# 1. Has this period already been invoiced? Look wider than you think you need.
intuit invoices list --where "CustomerRef = '42'" --order-by "TxnDate DESC" --limit 10

# 2. Derive the rate from history rather than recalling it.
intuit invoices get <recent-id> --json     # read Qty and UnitPrice off the line
```

If prior invoice totals divide evenly by a single rate, that's the rate. Confirm
it with the user before using it.

```bash
# 3. Stage the payload.
cat > /tmp/invoice.json <<'JSON'
{
  "CustomerRef": { "value": "42" },
  "SalesTermRef": { "value": "3" },
  "Line": [{
    "Amount": 2400.00,
    "Description": "Consulting services — March 2026",
    "DetailType": "SalesItemLineDetail",
    "SalesItemLineDetail": {
      "ItemRef": { "value": "1" }, "Qty": 20, "UnitPrice": 120
    }
  }]
}
JSON

# 4. Preview, show the user, then create.
intuit invoices create --file /tmp/invoice.json --dry-run
intuit invoices create --file /tmp/invoice.json --idempotency-tag run-b3a7
```

Copy `SalesTermRef`, item refs, and description wording from the previous
invoice so the new one matches the client's expectations.

## Record a payment against an invoice

`payments create` has **no** `--dry-run`. Stage the file, show it, get an explicit
yes, then run it.

```bash
cat > /tmp/payment.json <<'JSON'
{
  "CustomerRef": { "value": "42" },
  "TotalAmt": 2400.00,
  "Line": [{
    "Amount": 2400.00,
    "LinkedTxn": [{ "TxnId": "1042", "TxnType": "Invoice" }]
  }]
}
JSON

intuit payments create --file /tmp/payment.json
intuit invoices get 1042 --json | grep -i balance     # confirm it went to 0
```

Add `DepositToAccountRef` to land it in a bank account; omit it and the money
sits in Undeposited Funds.

## Did a payment arrive?

You can answer "is it recorded in the books" — **not** "did money hit the bank."
The bank feed is not exposed by this API.

```bash
intuit query "SELECT * FROM Payment WHERE TotalAmt = '2400'"
intuit query "SELECT * FROM Deposit WHERE TxnDate >= '2026-08-01'"
intuit query "SELECT Id, TxnDate FROM JournalEntry WHERE TxnDate >= '2026-08-01'"
```

Also check how current the books are — if the newest `MetaData.CreateTime` across
transactions is weeks old, absence of a payment says more about bookkeeping lag
than about whether the client paid. Report that distinction explicitly.

## Expenses and payables

```bash
intuit bills list --where "Balance > 0" --order-by "DueDate ASC"
intuit purchases list --order-by "TxnDate DESC" --limit 20
intuit accounts list                                    # balances per account
intuit vendors list --where "Balance > 0"
```

`purchases` are card/cash expenses; `bills` are invoices owed to vendors,
settled by `billpayments`.

## Export

```bash
intuit invoices list --all --csv > invoices.csv
intuit customers list --all --json > customers.json
```

`--all` auto-paginates. For anything the typed commands don't cover, pipe
`intuit query` output through `jq` or a small script.

## Fixing a mistake

```bash
intuit invoices void 1042     # zeroes the balance, keeps the audit trail
intuit invoices delete 1042   # destroys the record — only when explicitly asked
```

Neither has `--dry-run`, and both are effectively irreversible in production.
Confirm the ID by reading the record first:

```bash
intuit invoices get 1042
```
