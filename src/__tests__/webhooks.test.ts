import { describe, it, expect } from "vitest";
import crypto from "node:crypto";
import { verifySignature, matchesFilter } from "../commands/webhooks.listen.js";

describe("verifySignature", () => {
  const verifierToken = "test-token-abc123";

  function computeExpectedSignature(payload: string, token: string): string {
    return crypto.createHmac("sha256", token).update(payload).digest("base64");
  }

  it("returns true for a valid HMAC-SHA256 signature", () => {
    const payload = '{"test":"data"}';
    const signature = computeExpectedSignature(payload, verifierToken);
    expect(verifySignature(payload, signature, verifierToken)).toBe(true);
  });

  it("returns false for an invalid signature", () => {
    const payload = '{"test":"data"}';
    expect(verifySignature(payload, "invalid-signature", verifierToken)).toBe(false);
  });

  it("returns false when payload is tampered", () => {
    const payload = '{"test":"data"}';
    const signature = computeExpectedSignature(payload, verifierToken);
    expect(verifySignature('{"test":"tampered"}', signature, verifierToken)).toBe(false);
  });

  it("returns false with wrong verifier token", () => {
    const payload = '{"test":"data"}';
    const signature = computeExpectedSignature(payload, verifierToken);
    expect(verifySignature(payload, signature, "wrong-token")).toBe(false);
  });

  it("handles empty payload", () => {
    const payload = "";
    const signature = computeExpectedSignature(payload, verifierToken);
    expect(verifySignature(payload, signature, verifierToken)).toBe(true);
  });

  it("handles payload with unicode characters", () => {
    const payload = '{"name":"日本語テスト"}';
    const signature = computeExpectedSignature(payload, verifierToken);
    expect(verifySignature(payload, signature, verifierToken)).toBe(true);
  });
});

describe("matchesFilter", () => {
  it("matches everything when filters are empty", () => {
    expect(matchesFilter("qbo.customer.created.v1", [])).toBe(true);
  });

  it("matches exact event type", () => {
    const filters = ["qbo.customer.created.v1"];
    expect(matchesFilter("qbo.customer.created.v1", filters)).toBe(true);
  });

  it("rejects non-matching event type", () => {
    const filters = ["qbo.customer.created.v1"];
    expect(matchesFilter("qbo.invoice.updated.v1", filters)).toBe(false);
  });

  it("is case-insensitive", () => {
    const filters = ["QBO.Customer.Created.V1"];
    expect(matchesFilter("qbo.customer.created.v1", filters)).toBe(true);
  });

  it("matches if any filter matches", () => {
    const filters = ["qbo.customer.created.v1", "qbo.invoice.updated.v1"];
    expect(matchesFilter("qbo.invoice.updated.v1", filters)).toBe(true);
  });
});
