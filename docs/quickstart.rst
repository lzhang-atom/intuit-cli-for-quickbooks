==========================
QuickBooks CLI quickstart
==========================

The Intuit QuickBooks CLI lets you interact with the QuickBooks Online API directly from your terminal. Use it to browse entities, create transactions, run queries, and test webhooks — without writing integration code or configuring Postman collections.

The CLI handles OAuth 2.0 token management automatically, including silent token refresh, so you can focus on building.

|

.. container:: section-h2
   :name: prerequisites

   Prerequisites

Before you start:

.. container:: custom-list

    * Node.js 18 or later
    * An `Intuit Developer account <https://developer.intuit.com/dashboard>`_
    * An app with OAuth 2.0 credentials (`create one here </app/developer/qbo/docs/get-started/start-developing-your-app>`_)

|

.. container:: section-h2
   :name: step-1-install

   Step 1: Install the CLI

Install globally with npm:

.. container:: code-sample

    :icon:`<i class="hi page large hi-duplicate copy" data-clipboard-target="#codeblock1"></i>`

    .. code-block:: none
        :name: codeblock1
        :linenos:

        npm install -g intuit-cli

Or run without installing:

.. container:: code-sample

    :icon:`<i class="hi page large hi-duplicate copy" data-clipboard-target="#codeblock2"></i>`

    .. code-block:: none
        :name: codeblock2
        :linenos:

        npx intuit-cli --help

|

.. container:: section-h2
   :name: step-2-create-app

   Step 2: Create your app and get credentials

.. container:: ordered-list

    #. `Sign in <https://developer.intuit.com/dashboard>`_ to your developer account.
    #. Select **My Hub > App dashboard** from the upper-right corner of the toolbar.
    #. Create a new app and select the **Accounting** scope on the **Add permissions** page.
    #. Select **Keys and credentials** from the left navigation pane.
    #. Turn on the **Show credentials** switch and copy your **Client ID** and **Client secret**.

|

You'll need separate credentials for sandbox and production. The same app provides both — select **Development** for sandbox credentials, **Production** for production credentials.

|

.. container:: section-h2
   :name: step-3-configure

   Step 3: Configure your credentials

Run the interactive setup wizard:

.. container:: code-sample

    :icon:`<i class="hi page large hi-duplicate copy" data-clipboard-target="#codeblock3"></i>`

    .. code-block:: none
        :name: codeblock3
        :linenos:

        intuit auth configure

This prompts you for your Client ID and Client secret for both environments and stores them securely.

|

Alternatively, create a ``.env`` file in your project directory:

.. container:: code-sample

    :icon:`<i class="hi page large hi-duplicate copy" data-clipboard-target="#codeblock4"></i>`

    .. code-block:: none
        :name: codeblock4
        :linenos:

        INTUIT_SANDBOX_CLIENT_ID=your_sandbox_client_id
        INTUIT_SANDBOX_CLIENT_SECRET=your_sandbox_client_secret
        INTUIT_PROD_CLIENT_ID=your_production_client_id
        INTUIT_PROD_CLIENT_SECRET=your_production_client_secret

|

.. container:: section-h2
   :name: step-4-set-redirect-uri

   Step 4: Set your redirect URI

The CLI uses a local callback server to complete the OAuth 2.0 flow.

**Sandbox**

.. container:: ordered-list

    #. `Sign in <https://developer.intuit.com/dashboard>`_ to your developer account.
    #. Open your app and select **Settings** from the left navigation pane.
    #. Select the **Redirect URIs** tab, then select **Development**.
    #. Enter: ``http://localhost:9477/callback``
    #. Select **Save**.

|

**Production**

.. container:: ordered-list

    #. Select **Production** on the **Redirect URIs** tab.
    #. Enter a registered HTTPS URL — for example: ``https://yourapp.com/callback``
    #. Select **Save**.

|

.. container:: bluetip

    **Note**

    Localhost redirect URIs are not supported in production. You must register an HTTPS URL for production OAuth flows.

|

.. container:: section-h2
   :name: step-5-authenticate

   Step 5: Authenticate

**Sandbox**

.. container:: code-sample

    :icon:`<i class="hi page large hi-duplicate copy" data-clipboard-target="#codeblock5"></i>`

    .. code-block:: none
        :name: codeblock5
        :linenos:

        intuit auth login --env sandbox

This opens a browser window. Sign in with your Intuit developer account, select a sandbox company, and select **Authorize**. The CLI stores the resulting tokens automatically.

|

**Production**

.. container:: code-sample

    :icon:`<i class="hi page large hi-duplicate copy" data-clipboard-target="#codeblock6"></i>`

    .. code-block:: none
        :name: codeblock6
        :linenos:

        intuit auth login --env production --redirect-uri https://yourapp.com/callback

|

Verify the connection:

.. container:: code-sample

    :icon:`<i class="hi page large hi-duplicate copy" data-clipboard-target="#codeblock7"></i>`

    .. code-block:: none
        :name: codeblock7
        :linenos:

        intuit auth status

Expected output:

.. container:: code-sample

    .. code-block:: none
        :linenos:

        Setting        Value                          Source
        ─────────      ─────────────────────────      ──────────────────────────────
        Profile        default (active)               profiles.json
        Environment    sandbox                        profiles.json
        Realm ID       1234567890                     profiles.json
        Credentials    Configured                     INTUIT_SANDBOX_CLIENT_* env vars
        Access Token   Valid (59m remaining)          ~/.config/intuit-cli/default.tokens.enc.json
        Refresh Token  Present (101d, auto-renews)    ~/.config/intuit-cli/default.tokens.enc.json

|

.. container:: section-h2
   :name: step-6-make-first-call

   Step 6: Make your first API call

Fetch your company info:

.. container:: code-sample

    :icon:`<i class="hi page large hi-duplicate copy" data-clipboard-target="#codeblock8"></i>`

    .. code-block:: none
        :name: codeblock8
        :linenos:

        intuit company info

List customers:

.. container:: code-sample

    :icon:`<i class="hi page large hi-duplicate copy" data-clipboard-target="#codeblock9"></i>`

    .. code-block:: none
        :name: codeblock9
        :linenos:

        intuit customers list

Get JSON output for scripting or agent use:

.. container:: code-sample

    :icon:`<i class="hi page large hi-duplicate copy" data-clipboard-target="#codeblock10"></i>`

    .. code-block:: none
        :name: codeblock10
        :linenos:

        intuit customers list --json

|

.. container:: section-h2
   :name: next-steps

   Next steps

Once connected, the CLI supports the full QuickBooks Online Accounting API:

.. container:: custom-list

    * `Browse and query entities </app/developer/qbo/docs/develop/sdks-and-samples>`_ — customers, invoices, bills, payments, and more
    * `Create and update transactions </app/developer/qbo/docs/develop/basic-implementations>`_ using inline flags or JSON files
    * `Run QBO queries </app/developer/qbo/docs/learn/explore-the-quickbooks-online-api/data-queries>`_ directly from the terminal
    * `Test webhooks locally </app/developer/qbo/docs/develop/webhooks>`_ with signature verification and event replay
    * `Manage multiple companies </app/developer/qbo/docs/develop/authentication-and-authorization/oauth-2.0>`_ using named profiles

|

.. container:: bluetip

    **Use with AI agents**

    The CLI's ``--json`` flag produces structured output compatible with AI agent pipelines. Access tokens refresh silently on expiry and rate-limited requests retry automatically — no integration code required.

    .. container:: code-sample

        .. code-block:: none
            :linenos:

            intuit vendors list --json      # agent resolves vendor ID
            intuit accounts list --json     # agent resolves account ID
            intuit bills create --vendor-ref 42 --amount 1200 --expense-account-ref 7

|

.. container:: section-h2
   :name: troubleshooting

   Troubleshooting

If a command fails, add ``--debug`` to log the full HTTP request and response:

.. container:: code-sample

    :icon:`<i class="hi page large hi-duplicate copy" data-clipboard-target="#codeblock11"></i>`

    .. code-block:: none
        :name: codeblock11
        :linenos:

        intuit customers list --debug

For auth issues, check the token status and re-authenticate if needed:

.. container:: code-sample

    :icon:`<i class="hi page large hi-duplicate copy" data-clipboard-target="#codeblock12"></i>`

    .. code-block:: none
        :name: codeblock12
        :linenos:

        intuit auth status
        intuit auth login --env sandbox

For additional help, visit `Intuit Developer Support <https://help.developer.intuit.com/s/>`_.
