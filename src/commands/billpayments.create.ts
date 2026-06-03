import fs from "node:fs";
import { intuitPost } from "../lib/intuit-api.js";

export async function billpaymentsCreate(options: { file?: string; vendorRef?: string; amount?: string; payType?: string; bankAccountRef?: string; ccAccountRef?: string }, profile?: string) {
  let body: Record<string, unknown>;

  if (options.file) {
    let raw: string;
    try {
      raw = fs.readFileSync(options.file, "utf-8");
    } catch {
      throw new Error(`Cannot read file: ${options.file}`);
    }
    try {
      body = JSON.parse(raw);
    } catch {
      throw new Error(`Invalid JSON in ${options.file}. Check the file format and try again.`);
    }
  } else if (options.vendorRef && options.amount && options.payType) {
    const payType = options.payType;
    if (payType !== "Check" && payType !== "CreditCard") {
      throw new Error("--pay-type must be 'Check' or 'CreditCard'.");
    }

    body = {
      VendorRef: { value: options.vendorRef },
      TotalAmt: parseFloat(options.amount),
      PayType: payType,
    };

    if (payType === "Check") {
      if (!options.bankAccountRef) {
        throw new Error("--bank-account-ref is required when --pay-type is Check.");
      }
      body.CheckPayment = {
        BankAccountRef: { value: options.bankAccountRef },
      };
    } else {
      if (!options.ccAccountRef) {
        throw new Error("--cc-account-ref is required when --pay-type is CreditCard.");
      }
      body.CreditCardPayment = {
        CCAccountRef: { value: options.ccAccountRef },
      };
    }
  } else {
    throw new Error("Provide --vendor-ref, --amount, and --pay-type (Check or CreditCard) for a quick create, or --file for full control (linked bills, check/credit card details, etc.).");
  }

  const data = await intuitPost("billpayment", body, profile);
  const payment = data.BillPayment;
  console.log(`Created bill payment [${payment.Id}] — $${payment.TotalAmt}`);
}
