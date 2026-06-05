#!/usr/bin/env node
import "dotenv/config";
import { Command } from "commander";
import { authConfigure } from "./commands/auth.configure.js";
import { authLogin } from "./commands/auth.login.js";
import { authLogout } from "./commands/auth.logout.js";
import { authRefresh } from "./commands/auth.refresh.js";
import { authStatus } from "./commands/auth.status.js";
import { customersList } from "./commands/customers.list.js";
import { customersCreate } from "./commands/customers.create.js";
import { customersGet } from "./commands/customers.get.js";
import { customersUpdate } from "./commands/customers.update.js";
import { invoicesList } from "./commands/invoices.list.js";
import { invoicesCreate } from "./commands/invoices.create.js";
import { invoicesGet } from "./commands/invoices.get.js";
import { invoicesVoid } from "./commands/invoices.void.js";
import { invoicesDelete } from "./commands/invoices.delete.js";
import { invoicesUpdate } from "./commands/invoices.update.js";
import { paymentsList } from "./commands/payments.list.js";
import { paymentsCreate } from "./commands/payments.create.js";
import { paymentsGet } from "./commands/payments.get.js";
import { paymentsVoid } from "./commands/payments.void.js";
import { paymentsDelete } from "./commands/payments.delete.js";
import { paymentsUpdate } from "./commands/payments.update.js";
import { itemsList } from "./commands/items.list.js";
import { itemsCreate } from "./commands/items.create.js";
import { itemsGet } from "./commands/items.get.js";
import { itemsUpdate } from "./commands/items.update.js";
import { billsList } from "./commands/bills.list.js";
import { billsCreate } from "./commands/bills.create.js";
import { billsGet } from "./commands/bills.get.js";
import { billsDelete } from "./commands/bills.delete.js";
import { vendorsList } from "./commands/vendors.list.js";
import { vendorsCreate } from "./commands/vendors.create.js";
import { vendorsGet } from "./commands/vendors.get.js";
import { vendorsUpdate } from "./commands/vendors.update.js";
import { accountsList } from "./commands/accounts.list.js";
import { accountsGet } from "./commands/accounts.get.js";
import { estimatesList } from "./commands/estimates.list.js";
import { estimatesCreate } from "./commands/estimates.create.js";
import { estimatesGet } from "./commands/estimates.get.js";
import { estimatesDelete } from "./commands/estimates.delete.js";
import { estimatesUpdate } from "./commands/estimates.update.js";
import { salesreceiptsList } from "./commands/salesreceipts.list.js";
import { salesreceiptsCreate } from "./commands/salesreceipts.create.js";
import { salesreceiptsGet } from "./commands/salesreceipts.get.js";
import { salesreceiptsDelete } from "./commands/salesreceipts.delete.js";
import { salesreceiptsUpdate } from "./commands/salesreceipts.update.js";
import { creditmemosList } from "./commands/creditmemos.list.js";
import { creditmemosCreate } from "./commands/creditmemos.create.js";
import { creditmemosGet } from "./commands/creditmemos.get.js";
import { creditmemosDelete } from "./commands/creditmemos.delete.js";
import { creditmemosUpdate } from "./commands/creditmemos.update.js";
import { purchasesList } from "./commands/purchases.list.js";
import { purchasesCreate } from "./commands/purchases.create.js";
import { purchasesGet } from "./commands/purchases.get.js";
import { purchasesDelete } from "./commands/purchases.delete.js";
import { purchasesUpdate } from "./commands/purchases.update.js";
import { employeesList } from "./commands/employees.list.js";
import { employeesCreate } from "./commands/employees.create.js";
import { employeesGet } from "./commands/employees.get.js";
import { employeesUpdate } from "./commands/employees.update.js";
import { billpaymentsList } from "./commands/billpayments.list.js";
import { billpaymentsCreate } from "./commands/billpayments.create.js";
import { billpaymentsGet } from "./commands/billpayments.get.js";
import { billpaymentsDelete } from "./commands/billpayments.delete.js";
import { billpaymentsUpdate } from "./commands/billpayments.update.js";
import { depositsList } from "./commands/deposits.list.js";
import { depositsCreate } from "./commands/deposits.create.js";
import { depositsGet } from "./commands/deposits.get.js";
import { depositsDelete } from "./commands/deposits.delete.js";
import { depositsUpdate } from "./commands/deposits.update.js";
import { companyInfo } from "./commands/company.info.js";
import { companyPreferences } from "./commands/company.preferences.js";
import { projectsList } from "./commands/projects.list.js";
import { projectsGet } from "./commands/projects.get.js";
import { projectsCreate } from "./commands/projects.create.js";
import { projectsUpdate } from "./commands/projects.update.js";
import { projectsDelete } from "./commands/projects.delete.js";
import { customFieldsList } from "./commands/custom-fields.list.js";
import { customFieldsCreate } from "./commands/custom-fields.create.js";
import { customFieldsUpdate } from "./commands/custom-fields.update.js";
import { customFieldsAttach } from "./commands/custom-fields.attach.js";
import { dimensionsList } from "./commands/dimensions.list.js";
import { dimensionsValues } from "./commands/dimensions.values.js";
import { dimensionsAttach } from "./commands/dimensions.attach.js";
import { projectsAttach } from "./commands/projects.attach.js";
import { webhooksGuide } from "./commands/webhooks.guide.js";
import { webhooksListen } from "./commands/webhooks.listen.js";
import { webhooksReplay } from "./commands/webhooks.replay.js";
import { profileList, profileSwitch, profileRemove } from "./commands/profile.js";
import { queryRun } from "./commands/query.run.js";
import { enableDebug } from "./lib/debug.js";
import { closestMatches } from "./lib/fuzzy.js";
import { completionsBash, completionsZsh, generateCompletions } from "./commands/completions.js";
function handleError(err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`Error: ${message}`);
    process.exit(1);
}
function validateEnv(env) {
    const isProd = env === "production";
    const hasEnvSpecific = isProd
        ? (process.env.INTUIT_PROD_CLIENT_ID && process.env.INTUIT_PROD_CLIENT_SECRET)
        : (process.env.INTUIT_SANDBOX_CLIENT_ID && process.env.INTUIT_SANDBOX_CLIENT_SECRET);
    const hasLegacy = process.env.INTUIT_CLIENT_ID && process.env.INTUIT_CLIENT_SECRET;
    if (!hasEnvSpecific && !hasLegacy) {
        const label = isProd ? "production" : "sandbox";
        console.error(`Error: Missing ${label} credentials.`);
        console.error(`Run \`intuit auth configure --env ${label}\` to set them up.`);
        process.exit(1);
    }
}
const program = new Command();
program
    .name("intuit")
    .description("CLI for Intuit QuickBooks Online APIs")
    .version("0.1.0")
    .option("--debug", "Show verbose HTTP request/response details (output to stderr)")
    .hook("preAction", () => {
    if (program.opts().debug)
        enableDebug();
});
// Auth commands
const auth = program.command("auth").description("Authentication commands");
auth.command("configure").description("Set up OAuth credentials from the Intuit Developer portal")
    .option("-e, --env <environment>", "Environment (sandbox or production)")
    .action(async (options) => {
    await authConfigure(options.env).catch(handleError);
});
auth.command("login").description("Login via Intuit OAuth")
    .option("-p, --profile <name>", "A local name for this QuickBooks connection", "default")
    .option("-e, --env <environment>", "Environment (sandbox or production)")
    .option("-r, --redirect-uri <uri>", "Redirect URI (required for production)")
    .option("-s, --scopes <scopes>", "Space-separated Premium API scopes to add (e.g. 'project-management.project app-foundations.custom-field-definitions')")
    .action(async (options) => {
    const env = options.env || process.env.INTUIT_ENV || "";
    if (!env) {
        if (!process.stdin.isTTY) {
            console.error("Error: --env is required in non-interactive mode.");
            console.error("Use --env sandbox or --env production, or set INTUIT_ENV.");
            process.exit(1);
        }
        console.error("Error: --env is required. Use --env sandbox or --env production, or set INTUIT_ENV.");
        process.exit(1);
    }
    validateEnv(env);
    const extraScopes = options.scopes ? options.scopes.split(/\s+/).filter(Boolean) : [];
    await authLogin(options.profile, env, options.redirectUri, extraScopes).catch(handleError);
});
auth.command("status").description("Check auth status")
    .option("-p, --profile <name>", "Profile to check")
    .option("--json", "Output machine-readable JSON instead of the formatted table")
    .action((options) => {
    authStatus(options.profile, { json: !!options.json });
});
auth.command("logout").description("Logout and clear tokens")
    .option("-p, --profile <name>", "Profile to logout")
    .action((options) => {
    authLogout(options.profile);
});
auth.command("refresh").description("Refresh access token")
    .option("-p, --profile <name>", "Profile to refresh")
    .action(async (options) => {
    await authRefresh(options.profile).catch(handleError);
});
// Profile commands
const profile = program.command("profile").description("Manage connection profiles");
profile.command("list").description("List all profiles").action(() => {
    profileList();
});
profile.command("switch")
    .argument("<name>", "Profile name to switch to")
    .description("Switch active profile")
    .action((name) => {
    try {
        profileSwitch(name);
    }
    catch (err) {
        handleError(err);
    }
});
profile.command("remove")
    .argument("<name>", "Profile name to remove")
    .description("Remove a profile")
    .action((name) => {
    try {
        profileRemove(name);
    }
    catch (err) {
        handleError(err);
    }
});
// Entity commands
const customers = program.command("customers").description("Customer commands");
customers.command("list").description("List customers")
    .option("-p, --profile <name>", "Profile to use")
    .option("-l, --limit <n>", "Max results (default 100, max 500)", "100")
    .option("-a, --all", "Fetch all results (auto-paginate)")
    .option("-w, --where <clause>", "Filter expression (e.g. \"Balance > 0\")")
    .option("--order-by <field>", "Sort results (e.g. \"DisplayName ASC\")")
    .option("--json", "Output raw JSON")
    .option("--csv", "Output as CSV")
    .action(async (options) => {
    await customersList({
        limit: parseInt(options.limit, 10),
        all: !!options.all,
        where: options.where,
        orderBy: options.orderBy,
        json: !!options.json,
        csv: !!options.csv,
    }, options.profile).catch(handleError);
});
customers.command("create").description("Create a customer")
    .option("-p, --profile <name>", "Profile to use")
    .option("-n, --display-name <name>", "Customer display name")
    .option("--email <email>", "Customer email")
    .option("--phone <phone>", "Customer phone")
    .option("-f, --file <path>", "JSON file with full payload (addresses, tax info, custom fields, etc.)")
    .option("--dry-run", "Preview the request body without making changes")
    .option("--idempotency-tag <value>", "Attribution marker appended to Notes (for agent/audit traceability)")
    .action(async (options) => {
    await customersCreate({
        file: options.file,
        displayName: options.displayName,
        email: options.email,
        phone: options.phone,
        dryRun: !!options.dryRun,
        idempotencyTag: options.idempotencyTag,
    }, options.profile).catch(handleError);
});
customers.command("get").description("Get a customer by ID")
    .argument("<id>", "Customer ID")
    .option("-p, --profile <name>", "Profile to use")
    .option("--json", "Output raw JSON")
    .option("--csv", "Output as CSV")
    .action(async (id, options) => {
    await customersGet(id, { json: !!options.json, csv: !!options.csv }, options.profile).catch(handleError);
});
customers.command("update").description("Update a customer")
    .argument("<id>", "Customer ID to update")
    .option("-p, --profile <name>", "Profile to use")
    .option("-n, --display-name <name>", "Customer display name")
    .option("--email <email>", "Customer email")
    .option("--phone <phone>", "Customer phone")
    .option("-f, --file <path>", "JSON file with fields to update")
    .action(async (id, options) => {
    await customersUpdate(id, { file: options.file, displayName: options.displayName, email: options.email, phone: options.phone }, options.profile).catch(handleError);
});
const invoices = program.command("invoices").description("Invoice commands");
invoices.command("list").description("List invoices")
    .option("-p, --profile <name>", "Profile to use")
    .option("-l, --limit <n>", "Max results (default 100, max 500)", "100")
    .option("-a, --all", "Fetch all results (auto-paginate)")
    .option("-w, --where <clause>", "Filter expression (e.g. \"Balance > 0\")")
    .option("--order-by <field>", "Sort results (e.g. \"DueDate DESC\")")
    .option("--json", "Output raw JSON")
    .option("--csv", "Output as CSV")
    .action(async (options) => {
    await invoicesList({
        limit: parseInt(options.limit, 10),
        all: !!options.all,
        where: options.where,
        orderBy: options.orderBy,
        json: !!options.json,
        csv: !!options.csv,
    }, options.profile).catch(handleError);
});
invoices.command("create").description("Create an invoice")
    .option("-p, --profile <name>", "Profile to use")
    .option("-c, --customer-ref <id>", "Customer ID")
    .option("--amount <amount>", "Line item amount")
    .option("--item-ref <id>", "Item ID (default: 1)")
    .option("-f, --file <path>", "JSON file with full payload (multi-line items, descriptions, tax, etc.)")
    .option("--dry-run", "Preview the request body without making changes")
    .option("--idempotency-tag <value>", "Attribution marker appended to PrivateNote (for agent/audit traceability)")
    .action(async (options) => {
    await invoicesCreate({
        file: options.file,
        customerRef: options.customerRef,
        amount: options.amount,
        itemRef: options.itemRef,
        dryRun: !!options.dryRun,
        idempotencyTag: options.idempotencyTag,
    }, options.profile).catch(handleError);
});
invoices.command("get").description("Get an invoice by ID")
    .argument("<id>", "Invoice ID")
    .option("-p, --profile <name>", "Profile to use")
    .option("--json", "Output raw JSON")
    .option("--csv", "Output as CSV")
    .action(async (id, options) => {
    await invoicesGet(id, { json: !!options.json, csv: !!options.csv }, options.profile).catch(handleError);
});
invoices.command("update").description("Update an invoice")
    .argument("<id>", "Invoice ID to update")
    .option("-p, --profile <name>", "Profile to use")
    .option("-c, --customer-ref <id>", "Customer ID")
    .option("--amount <amount>", "Line item amount")
    .option("--item-ref <id>", "Item ID")
    .option("-f, --file <path>", "JSON file with fields to update")
    .action(async (id, options) => {
    await invoicesUpdate(id, { file: options.file, customerRef: options.customerRef, amount: options.amount, itemRef: options.itemRef }, options.profile).catch(handleError);
});
invoices.command("void").description("Void an invoice (zeroes balance, accounting-correct)")
    .argument("<id>", "Invoice ID to void")
    .option("-p, --profile <name>", "Profile to use")
    .action(async (id, options) => {
    await invoicesVoid(id, options.profile).catch(handleError);
});
invoices.command("delete").description("Delete an invoice")
    .argument("<id>", "Invoice ID to delete")
    .option("-p, --profile <name>", "Profile to use")
    .action(async (id, options) => {
    await invoicesDelete(id, options.profile).catch(handleError);
});
const payments = program.command("payments").description("Payment commands");
payments.command("list").description("List payments")
    .option("-p, --profile <name>", "Profile to use")
    .option("-l, --limit <n>", "Max results (default 100, max 500)", "100")
    .option("-a, --all", "Fetch all results (auto-paginate)")
    .option("-w, --where <clause>", "Filter expression (e.g. \"TotalAmt > '100'\")")
    .option("--order-by <field>", "Sort results (e.g. \"TxnDate DESC\")")
    .option("--json", "Output raw JSON")
    .option("--csv", "Output as CSV")
    .action(async (options) => {
    await paymentsList({
        limit: parseInt(options.limit, 10),
        all: !!options.all,
        where: options.where,
        orderBy: options.orderBy,
        json: !!options.json,
        csv: !!options.csv,
    }, options.profile).catch(handleError);
});
payments.command("create").description("Create a payment")
    .option("-p, --profile <name>", "Profile to use")
    .option("-c, --customer-ref <id>", "Customer ID")
    .option("--amount <amount>", "Payment amount")
    .option("-f, --file <path>", "JSON file with full payload (linked invoices, payment method, memo, etc.)")
    .action(async (options) => {
    await paymentsCreate({
        file: options.file,
        customerRef: options.customerRef,
        amount: options.amount,
    }, options.profile).catch(handleError);
});
payments.command("get").description("Get a payment by ID")
    .argument("<id>", "Payment ID")
    .option("-p, --profile <name>", "Profile to use")
    .option("--json", "Output raw JSON")
    .option("--csv", "Output as CSV")
    .action(async (id, options) => {
    await paymentsGet(id, { json: !!options.json, csv: !!options.csv }, options.profile).catch(handleError);
});
payments.command("update").description("Update a payment")
    .argument("<id>", "Payment ID to update")
    .option("-p, --profile <name>", "Profile to use")
    .option("-c, --customer-ref <id>", "Customer ID")
    .option("--amount <amount>", "Payment amount")
    .option("-f, --file <path>", "JSON file with fields to update")
    .action(async (id, options) => {
    await paymentsUpdate(id, { file: options.file, customerRef: options.customerRef, amount: options.amount }, options.profile).catch(handleError);
});
payments.command("void").description("Void a payment")
    .argument("<id>", "Payment ID to void")
    .option("-p, --profile <name>", "Profile to use")
    .action(async (id, options) => {
    await paymentsVoid(id, options.profile).catch(handleError);
});
payments.command("delete").description("Delete a payment")
    .argument("<id>", "Payment ID to delete")
    .option("-p, --profile <name>", "Profile to use")
    .action(async (id, options) => {
    await paymentsDelete(id, options.profile).catch(handleError);
});
const items = program.command("items").description("Item (product/service) commands");
items.command("list").description("List items")
    .option("-p, --profile <name>", "Profile to use")
    .option("-l, --limit <n>", "Max results (default 100, max 500)", "100")
    .option("-a, --all", "Fetch all results (auto-paginate)")
    .option("-w, --where <clause>", "Filter expression (e.g. \"Type = 'Service'\")")
    .option("--order-by <field>", "Sort results (e.g. \"Name ASC\")")
    .option("--json", "Output raw JSON")
    .option("--csv", "Output as CSV")
    .action(async (options) => {
    await itemsList({
        limit: parseInt(options.limit, 10),
        all: !!options.all,
        where: options.where,
        orderBy: options.orderBy,
        json: !!options.json,
        csv: !!options.csv,
    }, options.profile).catch(handleError);
});
items.command("create").description("Create an item (product or service)")
    .option("-p, --profile <name>", "Profile to use")
    .option("-n, --name <name>", "Item name")
    .option("--type <type>", "Item type: Service, NonInventory, Inventory, or Category (Group not supported by API)", "Service")
    .option("--income-account-ref <id>", "Income account ID (required for Service and Inventory; recommended for NonInventory if sold)")
    .option("--expense-account-ref <id>", "Expense or COGS account ID (required for Service, NonInventory, and Inventory)")
    .option("-f, --file <path>", "JSON file with full payload (inventory tracking, SKU, unit price, etc.)")
    .action(async (options) => {
    await itemsCreate({
        file: options.file,
        name: options.name,
        type: options.type,
        incomeAccountRef: options.incomeAccountRef,
        expenseAccountRef: options.expenseAccountRef,
    }, options.profile).catch(handleError);
});
items.command("get").description("Get an item by ID")
    .argument("<id>", "Item ID")
    .option("-p, --profile <name>", "Profile to use")
    .option("--json", "Output raw JSON")
    .option("--csv", "Output as CSV")
    .action(async (id, options) => {
    await itemsGet(id, { json: !!options.json, csv: !!options.csv }, options.profile).catch(handleError);
});
items.command("update").description("Update an item")
    .argument("<id>", "Item ID to update")
    .option("-p, --profile <name>", "Profile to use")
    .option("-n, --name <name>", "Item name")
    .option("--type <type>", "Item type: Service, NonInventory, Inventory, or Category")
    .option("-f, --file <path>", "JSON file with fields to update")
    .action(async (id, options) => {
    await itemsUpdate(id, { file: options.file, name: options.name, type: options.type }, options.profile).catch(handleError);
});
const bills = program.command("bills").description("Bill commands");
bills.command("list").description("List bills")
    .option("-p, --profile <name>", "Profile to use")
    .option("-l, --limit <n>", "Max results (default 100, max 500)", "100")
    .option("-a, --all", "Fetch all results (auto-paginate)")
    .option("-w, --where <clause>", "Filter expression (e.g. \"Balance > 0\")")
    .option("--order-by <field>", "Sort results (e.g. \"DueDate DESC\")")
    .option("--json", "Output raw JSON")
    .option("--csv", "Output as CSV")
    .action(async (options) => {
    await billsList({
        limit: parseInt(options.limit, 10),
        all: !!options.all,
        where: options.where,
        orderBy: options.orderBy,
        json: !!options.json,
        csv: !!options.csv,
    }, options.profile).catch(handleError);
});
bills.command("create").description("Create a bill")
    .option("-p, --profile <name>", "Profile to use")
    .option("--vendor-ref <id>", "Vendor ID")
    .option("--expense-account-ref <id>", "Expense account ID")
    .option("--amount <amount>", "Bill amount")
    .option("-f, --file <path>", "JSON file with full payload (multiple lines, terms, memo, etc.)")
    .action(async (options) => {
    await billsCreate({
        file: options.file,
        vendorRef: options.vendorRef,
        expenseAccountRef: options.expenseAccountRef,
        amount: options.amount,
    }, options.profile).catch(handleError);
});
bills.command("get").description("Get a bill by ID")
    .argument("<id>", "Bill ID")
    .option("-p, --profile <name>", "Profile to use")
    .option("--json", "Output raw JSON")
    .option("--csv", "Output as CSV")
    .action(async (id, options) => {
    await billsGet(id, { json: !!options.json, csv: !!options.csv }, options.profile).catch(handleError);
});
bills.command("delete").description("Delete a bill")
    .argument("<id>", "Bill ID to delete")
    .option("-p, --profile <name>", "Profile to use")
    .action(async (id, options) => {
    await billsDelete(id, options.profile).catch(handleError);
});
const vendors = program.command("vendors").description("Vendor commands");
vendors.command("list").description("List vendors")
    .option("-p, --profile <name>", "Profile to use")
    .option("-l, --limit <n>", "Max results (default 100, max 500)", "100")
    .option("-a, --all", "Fetch all results (auto-paginate)")
    .option("-w, --where <clause>", "Filter expression (e.g. \"DisplayName LIKE '%Acme%'\")")
    .option("--order-by <field>", "Sort results (e.g. \"DisplayName ASC\")")
    .option("--json", "Output raw JSON")
    .option("--csv", "Output as CSV")
    .action(async (options) => {
    await vendorsList({
        limit: parseInt(options.limit, 10),
        all: !!options.all,
        where: options.where,
        orderBy: options.orderBy,
        json: !!options.json,
        csv: !!options.csv,
    }, options.profile).catch(handleError);
});
vendors.command("create").description("Create a vendor")
    .option("-p, --profile <name>", "Profile to use")
    .option("-n, --display-name <name>", "Vendor display name")
    .option("--email <email>", "Vendor email")
    .option("--phone <phone>", "Vendor phone")
    .option("-f, --file <path>", "JSON file with full payload (addresses, tax info, payment terms, etc.)")
    .option("--dry-run", "Preview the request body without making changes")
    .option("--idempotency-tag <value>", "Attribution marker appended to Notes (for agent/audit traceability)")
    .action(async (options) => {
    await vendorsCreate({
        file: options.file,
        displayName: options.displayName,
        email: options.email,
        phone: options.phone,
        dryRun: !!options.dryRun,
        idempotencyTag: options.idempotencyTag,
    }, options.profile).catch(handleError);
});
vendors.command("get").description("Get a vendor by ID")
    .argument("<id>", "Vendor ID")
    .option("-p, --profile <name>", "Profile to use")
    .option("--json", "Output raw JSON")
    .option("--csv", "Output as CSV")
    .action(async (id, options) => {
    await vendorsGet(id, { json: !!options.json, csv: !!options.csv }, options.profile).catch(handleError);
});
vendors.command("update").description("Update a vendor")
    .argument("<id>", "Vendor ID to update")
    .option("-p, --profile <name>", "Profile to use")
    .option("-n, --display-name <name>", "Vendor display name")
    .option("--email <email>", "Vendor email")
    .option("--phone <phone>", "Vendor phone")
    .option("-f, --file <path>", "JSON file with fields to update")
    .action(async (id, options) => {
    await vendorsUpdate(id, { file: options.file, displayName: options.displayName, email: options.email, phone: options.phone }, options.profile).catch(handleError);
});
const accounts = program.command("accounts").description("Chart of accounts commands");
accounts.command("list").description("List accounts")
    .option("-p, --profile <name>", "Profile to use")
    .option("-l, --limit <n>", "Max results (default 100, max 500)", "100")
    .option("-a, --all", "Fetch all results (auto-paginate)")
    .option("-w, --where <clause>", "Filter expression (e.g. \"AccountType = 'Expense'\")")
    .option("--order-by <field>", "Sort results (e.g. \"Name ASC\")")
    .option("--json", "Output raw JSON")
    .option("--csv", "Output as CSV")
    .action(async (options) => {
    await accountsList({
        limit: parseInt(options.limit, 10),
        all: !!options.all,
        where: options.where,
        orderBy: options.orderBy,
        json: !!options.json,
        csv: !!options.csv,
    }, options.profile).catch(handleError);
});
accounts.command("get").description("Get an account by ID")
    .argument("<id>", "Account ID")
    .option("-p, --profile <name>", "Profile to use")
    .option("--json", "Output raw JSON")
    .option("--csv", "Output as CSV")
    .action(async (id, options) => {
    await accountsGet(id, { json: !!options.json, csv: !!options.csv }, options.profile).catch(handleError);
});
const estimates = program.command("estimates").description("Estimate commands");
estimates.command("list").description("List estimates")
    .option("-p, --profile <name>", "Profile to use")
    .option("-l, --limit <n>", "Max results (default 100, max 500)", "100")
    .option("-a, --all", "Fetch all results (auto-paginate)")
    .option("-w, --where <clause>", "Filter expression (e.g. \"TxnStatus = 'Pending'\")")
    .option("--order-by <field>", "Sort results (e.g. \"TxnDate DESC\")")
    .option("--json", "Output raw JSON")
    .option("--csv", "Output as CSV")
    .action(async (options) => {
    await estimatesList({
        limit: parseInt(options.limit, 10),
        all: !!options.all,
        where: options.where,
        orderBy: options.orderBy,
        json: !!options.json,
        csv: !!options.csv,
    }, options.profile).catch(handleError);
});
estimates.command("create").description("Create an estimate")
    .option("-p, --profile <name>", "Profile to use")
    .option("-c, --customer-ref <id>", "Customer ID")
    .option("--amount <amount>", "Line item amount")
    .option("--item-ref <id>", "Item ID (default: 1)")
    .option("-f, --file <path>", "JSON file with full payload (multi-line items, descriptions, tax, etc.)")
    .action(async (options) => {
    await estimatesCreate({
        file: options.file,
        customerRef: options.customerRef,
        amount: options.amount,
        itemRef: options.itemRef,
    }, options.profile).catch(handleError);
});
estimates.command("get").description("Get an estimate by ID")
    .argument("<id>", "Estimate ID")
    .option("-p, --profile <name>", "Profile to use")
    .option("--json", "Output raw JSON")
    .option("--csv", "Output as CSV")
    .action(async (id, options) => {
    await estimatesGet(id, { json: !!options.json, csv: !!options.csv }, options.profile).catch(handleError);
});
estimates.command("update").description("Update an estimate")
    .argument("<id>", "Estimate ID to update")
    .option("-p, --profile <name>", "Profile to use")
    .option("-c, --customer-ref <id>", "Customer ID")
    .option("--amount <amount>", "Line item amount")
    .option("--item-ref <id>", "Item ID")
    .option("-f, --file <path>", "JSON file with fields to update")
    .action(async (id, options) => {
    await estimatesUpdate(id, { file: options.file, customerRef: options.customerRef, amount: options.amount, itemRef: options.itemRef }, options.profile).catch(handleError);
});
estimates.command("delete").description("Delete an estimate")
    .argument("<id>", "Estimate ID to delete")
    .option("-p, --profile <name>", "Profile to use")
    .action(async (id, options) => {
    await estimatesDelete(id, options.profile).catch(handleError);
});
const salesreceipts = program.command("salesreceipts").description("Sales receipt commands");
salesreceipts.command("list").description("List sales receipts")
    .option("-p, --profile <name>", "Profile to use")
    .option("-l, --limit <n>", "Max results (default 100, max 500)", "100")
    .option("-a, --all", "Fetch all results (auto-paginate)")
    .option("-w, --where <clause>", "Filter expression (e.g. \"TotalAmt > '100'\")")
    .option("--order-by <field>", "Sort results (e.g. \"TxnDate DESC\")")
    .option("--json", "Output raw JSON")
    .option("--csv", "Output as CSV")
    .action(async (options) => {
    await salesreceiptsList({
        limit: parseInt(options.limit, 10),
        all: !!options.all,
        where: options.where,
        orderBy: options.orderBy,
        json: !!options.json,
        csv: !!options.csv,
    }, options.profile).catch(handleError);
});
salesreceipts.command("create").description("Create a sales receipt")
    .option("-p, --profile <name>", "Profile to use")
    .option("-c, --customer-ref <id>", "Customer ID")
    .option("--amount <amount>", "Line item amount")
    .option("--item-ref <id>", "Item ID (default: 1)")
    .option("-f, --file <path>", "JSON file with full payload (multi-line items, descriptions, tax, etc.)")
    .action(async (options) => {
    await salesreceiptsCreate({
        file: options.file,
        customerRef: options.customerRef,
        amount: options.amount,
        itemRef: options.itemRef,
    }, options.profile).catch(handleError);
});
salesreceipts.command("get").description("Get a sales receipt by ID")
    .argument("<id>", "Sales receipt ID")
    .option("-p, --profile <name>", "Profile to use")
    .option("--json", "Output raw JSON")
    .option("--csv", "Output as CSV")
    .action(async (id, options) => {
    await salesreceiptsGet(id, { json: !!options.json, csv: !!options.csv }, options.profile).catch(handleError);
});
salesreceipts.command("update").description("Update a sales receipt")
    .argument("<id>", "Sales receipt ID to update")
    .option("-p, --profile <name>", "Profile to use")
    .option("-c, --customer-ref <id>", "Customer ID")
    .option("--amount <amount>", "Line item amount")
    .option("--item-ref <id>", "Item ID")
    .option("-f, --file <path>", "JSON file with fields to update")
    .action(async (id, options) => {
    await salesreceiptsUpdate(id, { file: options.file, customerRef: options.customerRef, amount: options.amount, itemRef: options.itemRef }, options.profile).catch(handleError);
});
salesreceipts.command("delete").description("Delete a sales receipt")
    .argument("<id>", "Sales receipt ID to delete")
    .option("-p, --profile <name>", "Profile to use")
    .action(async (id, options) => {
    await salesreceiptsDelete(id, options.profile).catch(handleError);
});
const creditmemos = program.command("creditmemos").description("Credit memo commands");
creditmemos.command("list").description("List credit memos")
    .option("-p, --profile <name>", "Profile to use")
    .option("-l, --limit <n>", "Max results (default 100, max 500)", "100")
    .option("-a, --all", "Fetch all results (auto-paginate)")
    .option("-w, --where <clause>", "Filter expression (e.g. \"RemainingCredit > 0\")")
    .option("--order-by <field>", "Sort results (e.g. \"TxnDate DESC\")")
    .option("--json", "Output raw JSON")
    .option("--csv", "Output as CSV")
    .action(async (options) => {
    await creditmemosList({
        limit: parseInt(options.limit, 10),
        all: !!options.all,
        where: options.where,
        orderBy: options.orderBy,
        json: !!options.json,
        csv: !!options.csv,
    }, options.profile).catch(handleError);
});
creditmemos.command("create").description("Create a credit memo")
    .option("-p, --profile <name>", "Profile to use")
    .option("-c, --customer-ref <id>", "Customer ID")
    .option("--amount <amount>", "Line item amount")
    .option("--item-ref <id>", "Item ID (default: 1)")
    .option("-f, --file <path>", "JSON file with full payload (multi-line items, descriptions, tax, etc.)")
    .action(async (options) => {
    await creditmemosCreate({
        file: options.file,
        customerRef: options.customerRef,
        amount: options.amount,
        itemRef: options.itemRef,
    }, options.profile).catch(handleError);
});
creditmemos.command("get").description("Get a credit memo by ID")
    .argument("<id>", "Credit memo ID")
    .option("-p, --profile <name>", "Profile to use")
    .option("--json", "Output raw JSON")
    .option("--csv", "Output as CSV")
    .action(async (id, options) => {
    await creditmemosGet(id, { json: !!options.json, csv: !!options.csv }, options.profile).catch(handleError);
});
creditmemos.command("update").description("Update a credit memo")
    .argument("<id>", "Credit memo ID to update")
    .option("-p, --profile <name>", "Profile to use")
    .option("-c, --customer-ref <id>", "Customer ID")
    .option("--amount <amount>", "Line item amount")
    .option("--item-ref <id>", "Item ID")
    .option("-f, --file <path>", "JSON file with fields to update")
    .action(async (id, options) => {
    await creditmemosUpdate(id, { file: options.file, customerRef: options.customerRef, amount: options.amount, itemRef: options.itemRef }, options.profile).catch(handleError);
});
creditmemos.command("delete").description("Delete a credit memo")
    .argument("<id>", "Credit memo ID to delete")
    .option("-p, --profile <name>", "Profile to use")
    .action(async (id, options) => {
    await creditmemosDelete(id, options.profile).catch(handleError);
});
const purchases = program.command("purchases").description("Purchase/expense commands");
purchases.command("list").description("List purchases")
    .option("-p, --profile <name>", "Profile to use")
    .option("-l, --limit <n>", "Max results (default 100, max 500)", "100")
    .option("-a, --all", "Fetch all results (auto-paginate)")
    .option("-w, --where <clause>", "Filter expression (e.g. \"PaymentType = 'CreditCard'\")")
    .option("--order-by <field>", "Sort results (e.g. \"TxnDate DESC\")")
    .option("--json", "Output raw JSON")
    .option("--csv", "Output as CSV")
    .action(async (options) => {
    await purchasesList({
        limit: parseInt(options.limit, 10),
        all: !!options.all,
        where: options.where,
        orderBy: options.orderBy,
        json: !!options.json,
        csv: !!options.csv,
    }, options.profile).catch(handleError);
});
purchases.command("create").description("Create a purchase")
    .option("-p, --profile <name>", "Profile to use")
    .option("--account-ref <id>", "Payment account ID (bank or credit card)")
    .option("--expense-account-ref <id>", "Expense category account ID (e.g. Meals and Entertainment)")
    .option("--amount <amount>", "Purchase amount")
    .option("--payment-type <type>", "Payment type: Cash, Check, or CreditCard", "Cash")
    .option("-f, --file <path>", "JSON file with full payload (multiple lines, item-based expenses, vendor ref, memo, etc.)")
    .action(async (options) => {
    await purchasesCreate({
        file: options.file,
        accountRef: options.accountRef,
        expenseAccountRef: options.expenseAccountRef,
        amount: options.amount,
        paymentType: options.paymentType,
    }, options.profile).catch(handleError);
});
purchases.command("get").description("Get a purchase by ID")
    .argument("<id>", "Purchase ID")
    .option("-p, --profile <name>", "Profile to use")
    .option("--json", "Output raw JSON")
    .option("--csv", "Output as CSV")
    .action(async (id, options) => {
    await purchasesGet(id, { json: !!options.json, csv: !!options.csv }, options.profile).catch(handleError);
});
purchases.command("update").description("Update a purchase")
    .argument("<id>", "Purchase ID to update")
    .option("-p, --profile <name>", "Profile to use")
    .option("--amount <amount>", "Purchase amount")
    .option("--payment-type <type>", "Payment type: Cash, Check, or CreditCard")
    .option("-f, --file <path>", "JSON file with fields to update")
    .action(async (id, options) => {
    await purchasesUpdate(id, { file: options.file, amount: options.amount, paymentType: options.paymentType }, options.profile).catch(handleError);
});
purchases.command("delete").description("Delete a purchase")
    .argument("<id>", "Purchase ID to delete")
    .option("-p, --profile <name>", "Profile to use")
    .action(async (id, options) => {
    await purchasesDelete(id, options.profile).catch(handleError);
});
const employees = program.command("employees").description("Employee commands");
employees.command("list").description("List employees")
    .option("-p, --profile <name>", "Profile to use")
    .option("-l, --limit <n>", "Max results (default 100, max 500)", "100")
    .option("-a, --all", "Fetch all results (auto-paginate)")
    .option("-w, --where <clause>", "Filter expression (e.g. \"Active = true\")")
    .option("--order-by <field>", "Sort results (e.g. \"DisplayName ASC\")")
    .option("--json", "Output raw JSON")
    .option("--csv", "Output as CSV")
    .action(async (options) => {
    await employeesList({
        limit: parseInt(options.limit, 10),
        all: !!options.all,
        where: options.where,
        orderBy: options.orderBy,
        json: !!options.json,
        csv: !!options.csv,
    }, options.profile).catch(handleError);
});
employees.command("create").description("Create an employee")
    .option("-p, --profile <name>", "Profile to use")
    .option("-n, --display-name <name>", "Display name")
    .option("--given-name <name>", "First name")
    .option("--family-name <name>", "Last name")
    .option("--email <email>", "Employee email")
    .option("-f, --file <path>", "JSON file with full payload (address, SSN, hire date, etc.)")
    .action(async (options) => {
    await employeesCreate({
        file: options.file,
        displayName: options.displayName,
        givenName: options.givenName,
        familyName: options.familyName,
        email: options.email,
    }, options.profile).catch(handleError);
});
employees.command("get").description("Get an employee by ID")
    .argument("<id>", "Employee ID")
    .option("-p, --profile <name>", "Profile to use")
    .option("--json", "Output raw JSON")
    .option("--csv", "Output as CSV")
    .action(async (id, options) => {
    await employeesGet(id, { json: !!options.json, csv: !!options.csv }, options.profile).catch(handleError);
});
employees.command("update").description("Update an employee")
    .argument("<id>", "Employee ID to update")
    .option("-p, --profile <name>", "Profile to use")
    .option("-n, --display-name <name>", "Display name")
    .option("--given-name <name>", "First name")
    .option("--family-name <name>", "Last name")
    .option("--email <email>", "Employee email")
    .option("-f, --file <path>", "JSON file with fields to update")
    .action(async (id, options) => {
    await employeesUpdate(id, { file: options.file, displayName: options.displayName, givenName: options.givenName, familyName: options.familyName, email: options.email }, options.profile).catch(handleError);
});
const billpayments = program.command("billpayments").description("Bill payment commands");
billpayments.command("list").description("List bill payments")
    .option("-p, --profile <name>", "Profile to use")
    .option("-l, --limit <n>", "Max results (default 100, max 500)", "100")
    .option("-a, --all", "Fetch all results (auto-paginate)")
    .option("-w, --where <clause>", "Filter expression (e.g. \"TotalAmt > '500'\")")
    .option("--order-by <field>", "Sort results (e.g. \"TxnDate DESC\")")
    .option("--json", "Output raw JSON")
    .option("--csv", "Output as CSV")
    .action(async (options) => {
    await billpaymentsList({
        limit: parseInt(options.limit, 10),
        all: !!options.all,
        where: options.where,
        orderBy: options.orderBy,
        json: !!options.json,
        csv: !!options.csv,
    }, options.profile).catch(handleError);
});
billpayments.command("create").description("Create a bill payment")
    .option("-p, --profile <name>", "Profile to use")
    .option("--vendor-ref <id>", "Vendor ID")
    .option("--amount <amount>", "Payment amount")
    .option("--pay-type <type>", "Payment type: Check or CreditCard")
    .option("--bank-account-ref <id>", "Bank account ID (required when pay-type is Check)")
    .option("--cc-account-ref <id>", "Credit card account ID (required when pay-type is CreditCard)")
    .option("-f, --file <path>", "JSON file with full payload (PayType, linked bills, check/credit card details, etc.)")
    .action(async (options) => {
    await billpaymentsCreate({
        file: options.file,
        vendorRef: options.vendorRef,
        amount: options.amount,
        payType: options.payType,
        bankAccountRef: options.bankAccountRef,
        ccAccountRef: options.ccAccountRef,
    }, options.profile).catch(handleError);
});
billpayments.command("get").description("Get a bill payment by ID")
    .argument("<id>", "Bill payment ID")
    .option("-p, --profile <name>", "Profile to use")
    .option("--json", "Output raw JSON")
    .option("--csv", "Output as CSV")
    .action(async (id, options) => {
    await billpaymentsGet(id, { json: !!options.json, csv: !!options.csv }, options.profile).catch(handleError);
});
billpayments.command("update").description("Update a bill payment")
    .argument("<id>", "Bill payment ID to update")
    .option("-p, --profile <name>", "Profile to use")
    .option("-f, --file <path>", "JSON file with fields to update")
    .action(async (id, options) => {
    await billpaymentsUpdate(id, { file: options.file }, options.profile).catch(handleError);
});
billpayments.command("delete").description("Delete a bill payment")
    .argument("<id>", "Bill payment ID to delete")
    .option("-p, --profile <name>", "Profile to use")
    .action(async (id, options) => {
    await billpaymentsDelete(id, options.profile).catch(handleError);
});
const deposits = program.command("deposits").description("Deposit commands");
deposits.command("list").description("List deposits")
    .option("-p, --profile <name>", "Profile to use")
    .option("-l, --limit <n>", "Max results (default 100, max 500)", "100")
    .option("-a, --all", "Fetch all results (auto-paginate)")
    .option("-w, --where <clause>", "Filter expression (e.g. \"TotalAmt > '1000'\")")
    .option("--order-by <field>", "Sort results (e.g. \"TxnDate DESC\")")
    .option("--json", "Output raw JSON")
    .option("--csv", "Output as CSV")
    .action(async (options) => {
    await depositsList({
        limit: parseInt(options.limit, 10),
        all: !!options.all,
        where: options.where,
        orderBy: options.orderBy,
        json: !!options.json,
        csv: !!options.csv,
    }, options.profile).catch(handleError);
});
deposits.command("create").description("Create a deposit")
    .option("-p, --profile <name>", "Profile to use")
    .option("--account-ref <id>", "Deposit-to bank account ID")
    .option("--line-account-ref <id>", "Source income account ID (e.g. Unapplied Cash Payment Income)")
    .option("--amount <amount>", "Deposit amount")
    .option("-f, --file <path>", "JSON file with full payload (multiple deposit lines, memo, cashback, etc.)")
    .action(async (options) => {
    await depositsCreate({
        file: options.file,
        accountRef: options.accountRef,
        lineAccountRef: options.lineAccountRef,
        amount: options.amount,
    }, options.profile).catch(handleError);
});
deposits.command("get").description("Get a deposit by ID")
    .argument("<id>", "Deposit ID")
    .option("-p, --profile <name>", "Profile to use")
    .option("--json", "Output raw JSON")
    .option("--csv", "Output as CSV")
    .action(async (id, options) => {
    await depositsGet(id, { json: !!options.json, csv: !!options.csv }, options.profile).catch(handleError);
});
deposits.command("update").description("Update a deposit")
    .argument("<id>", "Deposit ID to update")
    .option("-p, --profile <name>", "Profile to use")
    .option("-f, --file <path>", "JSON file with fields to update")
    .action(async (id, options) => {
    await depositsUpdate(id, { file: options.file }, options.profile).catch(handleError);
});
deposits.command("delete").description("Delete a deposit")
    .argument("<id>", "Deposit ID to delete")
    .option("-p, --profile <name>", "Profile to use")
    .action(async (id, options) => {
    await depositsDelete(id, options.profile).catch(handleError);
});
const company = program.command("company").description("Company info commands");
company.command("info").description("Show company details")
    .option("-p, --profile <name>", "Profile to use")
    .option("--json", "Output raw JSON")
    .option("--csv", "Output as CSV")
    .action(async (options) => {
    await companyInfo({
        json: !!options.json,
        csv: !!options.csv,
    }, options.profile).catch(handleError);
});
company.command("preferences").description("Show company preferences")
    .option("-p, --profile <name>", "Profile to use")
    .option("--json", "Output raw JSON")
    .option("--csv", "Output as CSV")
    .action(async (options) => {
    await companyPreferences({
        json: !!options.json,
        csv: !!options.csv,
    }, options.profile).catch(handleError);
});
// Projects commands (GraphQL)
const projects = program.command("projects").description("Project management (GraphQL Premium API)");
projects.command("list").description("List projects")
    .option("-p, --profile <name>", "Profile to use")
    .option("--json", "Output raw JSON")
    .option("--csv", "Output as CSV")
    .option("--filter-start <date>", "Filter by due date start (ISO 8601)")
    .option("--filter-end <date>", "Filter by due date end (ISO 8601)")
    .option("--status <status>", "Filter by status (OPEN, IN_PROGRESS, COMPLETE)")
    .option("-l, --limit <n>", "Max results", "50")
    .option("-a, --all", "Fetch all pages")
    .action(async (options) => {
    await projectsList({
        json: !!options.json,
        csv: !!options.csv,
        filterStart: options.filterStart,
        filterEnd: options.filterEnd,
        status: options.status,
        limit: parseInt(options.limit, 10),
        all: !!options.all,
    }, options.profile).catch(handleError);
});
projects.command("get").description("Get a project by ID")
    .argument("<id>", "Project ID")
    .option("-p, --profile <name>", "Profile to use")
    .option("--json", "Output raw JSON")
    .action(async (id, options) => {
    await projectsGet(id, { json: !!options.json }, options.profile).catch(handleError);
});
projects.command("create").description("Create a project")
    .option("-p, --profile <name>", "Profile to use")
    .option("--name <name>", "Project name")
    .option("--due-date <date>", "Due date (ISO 8601, e.g. 2024-12-31T00:00:00.000Z)")
    .option("--start-date <date>", "Start date (ISO 8601)")
    .option("--customer-id <id>", "Customer ID")
    .option("--status <status>", "Status (OPEN, IN_PROGRESS, COMPLETE)")
    .option("--description <text>", "Project description")
    .option("--priority <n>", "Priority (integer)")
    .option("--file <path>", "JSON file with full project input")
    .option("--dry-run", "Preview the mutation variables without making changes")
    .option("--idempotency-tag <value>", "Attribution marker appended to description (for agent/audit traceability)")
    .action(async (options) => {
    await projectsCreate({
        name: options.name,
        dueDate: options.dueDate,
        startDate: options.startDate,
        customerId: options.customerId,
        status: options.status,
        description: options.description,
        priority: options.priority != null ? parseInt(options.priority, 10) : undefined,
        file: options.file,
        dryRun: !!options.dryRun,
        idempotencyTag: options.idempotencyTag,
    }, options.profile).catch(handleError);
});
projects.command("update").description("Update a project")
    .argument("<id>", "Project ID")
    .option("-p, --profile <name>", "Profile to use")
    .option("--name <name>", "New name")
    .option("--due-date <date>", "New due date (ISO 8601)")
    .option("--start-date <date>", "New start date (ISO 8601)")
    .option("--customer-id <id>", "Customer ID")
    .option("--status <status>", "New status (OPEN, IN_PROGRESS, COMPLETE)")
    .option("--description <text>", "New description")
    .option("--priority <n>", "New priority")
    .option("--completion-rate <n>", "Completion rate (0-100)")
    .option("--pinned", "Pin project")
    .option("--file <path>", "JSON file with full update input")
    .action(async (id, options) => {
    await projectsUpdate(id, {
        name: options.name,
        description: options.description,
        status: options.status,
        startDate: options.startDate,
        dueDate: options.dueDate,
        customerId: options.customerId,
        priority: options.priority != null ? parseInt(options.priority, 10) : undefined,
        completionRate: options.completionRate != null ? parseFloat(options.completionRate) : undefined,
        pinned: options.pinned ? true : undefined,
        file: options.file,
    }, options.profile).catch(handleError);
});
projects.command("delete").description("Delete a project")
    .argument("<id>", "Project ID")
    .option("-p, --profile <name>", "Profile to use")
    .action(async (id, options) => {
    await projectsDelete(id, options.profile).catch(handleError);
});
projects.command("attach").description("Attach a project to a transaction")
    .option("-p, --profile <name>", "Profile to use")
    .option("--project-id <id>", "Project ID to attach")
    .option("--entity <type>", "Transaction type (invoice, estimate, bill, salesreceipt, purchase)")
    .option("--entity-id <id>", "Transaction ID")
    .option("--dry-run", "Preview what will be attached without making changes")
    .action(async (options) => {
    if (!options.projectId) {
        console.error("Error: --project-id is required");
        process.exit(1);
    }
    if (!options.entity) {
        console.error("Error: --entity is required");
        process.exit(1);
    }
    if (!options.entityId) {
        console.error("Error: --entity-id is required");
        process.exit(1);
    }
    await projectsAttach({
        projectId: options.projectId,
        entity: options.entity,
        entityId: options.entityId,
        dryRun: !!options.dryRun,
    }, options.profile).catch(handleError);
});
// Custom Fields commands (GraphQL)
const customFields = program.command("custom-fields").description("Custom field definitions (GraphQL Premium API)");
customFields.command("list").description("List custom field definitions")
    .option("-p, --profile <name>", "Profile to use")
    .option("--json", "Output raw JSON")
    .option("--csv", "Output as CSV")
    .action(async (options) => {
    await customFieldsList({
        json: !!options.json,
        csv: !!options.csv,
    }, options.profile).catch(handleError);
});
customFields.command("attach").description("Attach a custom field value to a transaction or entity")
    .option("-p, --profile <name>", "Profile to use")
    .option("--definition-id <id>", "Custom field definition ID")
    .option("--value <value>", "Value to set")
    .option("--entity <type>", "Entity type (invoice, estimate, bill, salesreceipt, purchase, customer)")
    .option("--entity-id <id>", "Entity ID")
    .option("--file <path>", "JSON file for multiple fields: [{ \"definitionId\": \"<id>\", \"value\": \"<value>\" }, ...]")
    .option("--dry-run", "Preview what will be attached without making changes")
    .action(async (options) => {
    if (!options.entity) {
        console.error("Error: --entity is required");
        process.exit(1);
    }
    if (!options.entityId) {
        console.error("Error: --entity-id is required");
        process.exit(1);
    }
    await customFieldsAttach({
        definitionId: options.definitionId,
        value: options.value,
        entity: options.entity,
        entityId: options.entityId,
        file: options.file,
        dryRun: !!options.dryRun,
    }, options.profile).catch(handleError);
});
customFields.command("create").description("Create a custom field definition")
    .option("-p, --profile <name>", "Profile to use")
    .option("--label <label>", "Field label")
    .option("--data-type <type>", "Data type (STRING, NUMBER, DATE, BOOLEAN, STRING_LIST)")
    .option("--category <category>", "Field category (required). One of: customer, vendor, project, transaction. Mirrors the QBO UI category picker — immutable after create.")
    .option("--forms <forms>", "Forms the field appears on. Comma-separated and/or repeatable (--forms invoice,estimate OR --forms invoice --forms estimate). Required for every category. Valid: invoice, estimate, sales-receipt, credit-memo, refund-receipt, sales-order, bill, expense, check, purchase-order, vendor-credit, credit-card-credit.", (val, prev = []) => prev.concat(val.split(",").map((s) => s.trim()).filter(Boolean)))
    .option("--option <value>", "Dropdown option value (repeatable). Only valid with --data-type STRING_LIST.", (val, prev = []) => prev.concat([val]))
    .option("--entity <entity>", "[deprecated] Use --category instead. Maps to a raw associatedEntity value.")
    .option("--file <path>", "JSON file with full input ({ \"input\": {...} } or just the input object)")
    .option("--dry-run", "Preview the mutation variables without making changes")
    .option("--idempotency-tag <value>", "Accepted for command symmetry; not applied to CustomFieldDefinition (no taggable field)")
    .action(async (options) => {
    await customFieldsCreate({
        label: options.label,
        dataType: options.dataType,
        category: options.category,
        transactions: options.forms,
        options: options.option,
        entity: options.entity,
        file: options.file,
        dryRun: !!options.dryRun,
        idempotencyTag: options.idempotencyTag,
    }, options.profile).catch(handleError);
});
customFields.command("update").description("Update a custom field definition (rename, activate/deactivate, or add forms)")
    .argument("<id>", "Custom field ID (e.g. udcf_1000000001)")
    .option("-p, --profile <name>", "Profile to use")
    .option("--label <label>", "New label")
    .option("--active <bool>", "Set active (true) or inactive (false). Use false to soft-delete.", (val) => val === "true")
    .option("--category <category>", "[immutable] Provided only to surface a clear error — category cannot be changed after create.")
    .option("--data-type <type>", "[immutable] Provided only to surface a clear error — data type cannot be changed after create.")
    .option("--forms <forms>", "Forms the field appears on. Comma-separated and/or repeatable. Server appends to existing list; cannot remove via this flag.", (val, prev = []) => prev.concat(val.split(",").map((s) => s.trim()).filter(Boolean)))
    .option("--file <path>", "JSON file with full update input ({ \"input\": {...} } or just the input object)")
    .option("--dry-run", "Preview the mutation variables without making changes")
    .action(async (id, options) => {
    await customFieldsUpdate(id, {
        label: options.label,
        active: options.active,
        category: options.category,
        dataType: options.dataType,
        transactions: options.forms,
        file: options.file,
        dryRun: !!options.dryRun,
    }, options.profile).catch(handleError);
});
// Dimensions commands (GraphQL)
const dimensions = program.command("dimensions").description("Custom dimensions (GraphQL Premium API — IES)");
dimensions.command("list").description("List dimension definitions")
    .option("-p, --profile <name>", "Profile to use")
    .option("--json", "Output raw JSON")
    .option("--csv", "Output as CSV")
    .action(async (options) => {
    await dimensionsList({
        json: !!options.json,
        csv: !!options.csv,
    }, options.profile).catch(handleError);
});
dimensions.command("attach").description("Attach dimension value(s) to transaction lines")
    .option("-p, --profile <name>", "Profile to use")
    .option("--definition-id <id>", "Dimension definition ID (attaches to all lines)")
    .option("--value-id <id>", "Dimension value ID (attaches to all lines)")
    .option("--entity <type>", "Transaction type (invoice, bill, purchase, estimate, salesreceipt)")
    .option("--entity-id <id>", "Transaction ID")
    .option("--file <path>", "JSON file for per-line control: [{ \"lineNum\": 1, \"definitionId\": \"<id>\", \"valueId\": \"<id>\" }, ...]")
    .option("--dry-run", "Preview what will be attached without making changes")
    .action(async (options) => {
    if (!options.entity) {
        console.error("Error: --entity is required");
        process.exit(1);
    }
    if (!options.entityId) {
        console.error("Error: --entity-id is required");
        process.exit(1);
    }
    await dimensionsAttach({
        definitionId: options.definitionId,
        valueId: options.valueId,
        entity: options.entity,
        entityId: options.entityId,
        file: options.file,
        dryRun: !!options.dryRun,
    }, options.profile).catch(handleError);
});
dimensions.command("values").description("List values for a dimension definition")
    .argument("<definition-id>", "Dimension definition ID")
    .option("-p, --profile <name>", "Profile to use")
    .option("--json", "Output raw JSON")
    .option("--csv", "Output as CSV")
    .action(async (definitionId, options) => {
    await dimensionsValues(definitionId, {
        json: !!options.json,
        csv: !!options.csv,
    }, options.profile).catch(handleError);
});
// Webhook commands
const webhooks = program.command("webhooks").description("Webhook development tools");
webhooks.command("guide").description("Show webhook setup instructions")
    .action(() => {
    webhooksGuide();
});
webhooks.command("listen").description("Start a local listener to capture webhook events")
    .option("--port <port>", "Port to listen on", "8080")
    .option("--verifier-token <token>", "Verifier token from Intuit Developer portal (or set INTUIT_WEBHOOK_VERIFIER_TOKEN)")
    .option("--events <list>", "Filter by CloudEvents type (e.g. qbo.invoice.created.v1,qbo.customer.updated.v1)")
    .option("--forward-to <url>", "Forward verified events to a local URL")
    .action((options) => {
    const verifierToken = options.verifierToken || process.env.INTUIT_WEBHOOK_VERIFIER_TOKEN;
    if (!verifierToken) {
        console.error("Error: Verifier token required. Use --verifier-token or set INTUIT_WEBHOOK_VERIFIER_TOKEN.");
        console.error("Find it in your app's Webhooks settings at https://developer.intuit.com");
        console.error("\nRun 'intuit webhooks guide' for full setup instructions.");
        process.exit(1);
    }
    webhooksListen({
        port: parseInt(options.port, 10),
        verifierToken,
        events: options.events ? options.events.split(",").map((e) => e.trim()) : [],
        forwardTo: options.forwardTo,
    });
});
webhooks.command("replay").description("Show recently captured webhook events")
    .option("--last <n>", "Number of recent events to show", "10")
    .option("--json", "Output as JSON")
    .action((options) => {
    webhooksReplay({
        last: parseInt(options.last, 10),
        json: !!options.json,
    });
});
// Query command
program.command("query")
    .argument("<statement>", "QuickBooks query statement")
    .option("-p, --profile <name>", "Profile to use")
    .action(async (statement, options) => {
    const result = await queryRun(statement, options.profile).catch(handleError);
    console.log(JSON.stringify(result, null, 2));
});
// Shell completions
const completionsCmd = program.command("completions").description("Generate shell completions");
completionsCmd.command("bash").description("Output bash completion script")
    .action(() => { process.stdout.write(completionsBash()); });
completionsCmd.command("zsh").description("Output zsh completion script")
    .action(() => { process.stdout.write(completionsZsh()); });
completionsCmd
    .option("--generate", "Internal: generate completions for current input (used by shell scripts)")
    .allowUnknownOption()
    .allowExcessArguments()
    .action((options, cmd) => {
    if (options.generate) {
        generateCompletions(cmd.args);
    }
    else {
        completionsCmd.help();
    }
});
// Fuzzy match unknown commands — top level and subcommands
program.showSuggestionAfterError(false);
function addFuzzyMatching(parent, prefix) {
    parent.on("command:*", (operands) => {
        const unknown = operands[0];
        const subcmds = parent.commands.map(c => c.name());
        const matches = closestMatches(unknown, subcmds);
        console.error(`Error: Unknown command "${unknown}".`);
        if (matches.length > 0) {
            console.error(`\nDid you mean?\n${matches.map(m => `  ${prefix} ${m}`).join("\n")}`);
        }
        console.error(`\nRun "${prefix} --help" to see available commands.`);
        process.exit(1);
    });
}
addFuzzyMatching(program, "intuit");
for (const cmd of program.commands) {
    if (cmd.commands.length > 0) {
        addFuzzyMatching(cmd, `intuit ${cmd.name()}`);
    }
}
program.parseAsync(process.argv);
