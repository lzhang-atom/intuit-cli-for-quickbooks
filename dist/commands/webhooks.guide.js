export function webhooksGuide() {
    console.log(`
Webhook Setup Guide
====================

QuickBooks Online webhooks use the CloudEvents v1.0 payload format.
The CLI provides a local listener for capturing and debugging events during development.

Step 1: Get your verifier token
  Go to https://developer.intuit.com → your app → Webhooks settings.
  Copy the Verifier Token.

Step 2: Start the local listener
  intuit webhooks listen --verifier-token <your-token>
  intuit webhooks listen --verifier-token <your-token> --events qbo.invoice.created.v1,qbo.customer.updated.v1

Step 3: Expose the listener with a tunnel
  Use any HTTPS tunnel tool your network allows:
    ngrok http 8080
    npx localtunnel --port 8080
    ssh -R 80:localhost:8080 nokey@localhost.run

Step 4: Register in the Intuit Developer Portal
  Webhook URL:     https://<your-tunnel-url>/
  Verifier Token:  (already set in your app)
  Select the entities and events you want to receive.

Step 5: Trigger events
  Make changes in your QuickBooks sandbox (create a customer, update an invoice).
  The CLI will log each verified event with its full CloudEvents payload.

  CloudEvents payload example:
    [
      {
        "specversion": "1.0",
        "id": "88cd52aa-33b6-...",
        "type": "qbo.account.created.v1",
        "intuitentityid": "1234",
        "intuitaccountid": "310687",
        "time": "2025-09-10T21:31:25Z",
        "data": {}
      }
    ]

Step 6: Replay events
  intuit webhooks replay --last 5
  Replays the last 5 captured payloads.

For production, point the webhook URL to your real HTTPS backend.
The CLI listener is for local debugging only.
`);
}
