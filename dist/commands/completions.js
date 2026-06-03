import fs from "node:fs";
import path from "node:path";
import os from "node:os";
const PROFILES_PATH = path.join(os.homedir(), ".config", "intuit-cli", "profiles.json");
function getProfileNames() {
    try {
        const raw = fs.readFileSync(PROFILES_PATH, "utf-8");
        const config = JSON.parse(raw);
        return Object.keys(config.profiles || {});
    }
    catch {
        return [];
    }
}
// Generates completions dynamically for `intuit completions --generate`
// Called at tab-complete time by the shell script below
export function generateCompletions(words) {
    const commands = {
        intuit: ["auth", "profile", "customers", "invoices", "payments", "items", "bills", "vendors", "accounts", "estimates", "salesreceipts", "creditmemos", "purchases", "employees", "billpayments", "deposits", "company", "webhooks", "query", "completions"],
        auth: ["configure", "login", "status", "logout", "refresh"],
        profile: ["list", "switch", "remove"],
        customers: ["list", "create"],
        invoices: ["list", "create", "void"],
        payments: ["list", "create", "void"],
        items: ["list"],
        bills: ["list"],
        vendors: ["list"],
        accounts: ["list"],
        estimates: ["list", "create"],
        salesreceipts: ["list", "create"],
        creditmemos: ["list", "create"],
        purchases: ["list", "create"],
        employees: ["list", "create"],
        billpayments: ["list", "create"],
        deposits: ["list", "create"],
        company: ["info"],
        webhooks: ["guide", "listen", "replay"],
        completions: ["bash", "zsh"],
    };
    const listFlags = ["--profile", "--limit", "--all", "--where", "--order-by", "--json", "--csv", "--debug"];
    const globalFlags = ["--help", "--version", "--debug"];
    // Remove 'intuit' from words if present
    if (words[0] === "intuit")
        words = words.slice(1);
    const current = words[words.length - 1] || "";
    const prev = words.length >= 2 ? words[words.length - 2] : "";
    // Complete --profile values
    if (prev === "--profile" || prev === "-p") {
        const profiles = getProfileNames();
        console.log(profiles.join("\n"));
        return;
    }
    // Top-level: complete command names
    if (words.length <= 1) {
        const matches = commands.intuit.filter(c => c.startsWith(current));
        console.log(matches.join("\n"));
        return;
    }
    // Subcommand level
    const parent = words[0];
    if (words.length <= 2 && commands[parent]) {
        const matches = commands[parent].filter(c => c.startsWith(current));
        console.log(matches.join("\n"));
        return;
    }
    // Flag completion
    if (current.startsWith("-")) {
        const subcmd = words.length >= 2 ? words[1] : "";
        const flags = subcmd === "list" ? listFlags : globalFlags;
        const matches = flags.filter(f => f.startsWith(current));
        console.log(matches.join("\n"));
        return;
    }
}
export function completionsBash() {
    return `# Intuit CLI bash completions
# Add to ~/.bashrc: eval "$(intuit completions bash)"
_intuit_completions() {
  local cur_word="\${COMP_WORDS[COMP_CWORD]}"
  local words="\${COMP_WORDS[*]}"
  COMPREPLY=( $(compgen -W "$(intuit completions --generate $words)" -- "$cur_word") )
}
complete -F _intuit_completions intuit
`;
}
export function completionsZsh() {
    return `# Intuit CLI zsh completions
# Add to ~/.zshrc: eval "$(intuit completions zsh)"
_intuit_completions() {
  local words=("\${(@)words}")
  local completions
  completions=$(intuit completions --generate $words 2>/dev/null)
  if [[ -n "$completions" ]]; then
    compadd -a -- completions
  fi
}
compdef _intuit_completions intuit
`;
}
