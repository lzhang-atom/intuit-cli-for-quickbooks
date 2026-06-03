import { describe, it, expect, vi, beforeEach } from "vitest";
import { entityOperation } from "../lib/entity-operation.js";

vi.mock("../lib/intuit-api.js", () => ({
  intuitGet: vi.fn(),
  intuitPost: vi.fn(),
}));

import { intuitGet, intuitPost } from "../lib/intuit-api.js";
const mockIntuitGet = vi.mocked(intuitGet);
const mockIntuitPost = vi.mocked(intuitPost);

describe("entityOperation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("throws when entity is not found", async () => {
    mockIntuitGet.mockResolvedValue({ Invoice: null });
    await expect(entityOperation("invoice", "Invoice", "999", "void"))
      .rejects.toThrow("Invoice 999 not found.");
  });

  it("fetches entity then POSTs void operation", async () => {
    mockIntuitGet.mockResolvedValue({
      Invoice: { Id: "42", SyncToken: "3", Balance: 500 },
    });
    mockIntuitPost.mockResolvedValue({
      Invoice: { Id: "42", SyncToken: "4", Balance: 0 },
    });

    const result = await entityOperation("invoice", "Invoice", "42", "void", "default");

    expect(mockIntuitGet).toHaveBeenCalledWith("invoice/42", "default");
    expect(mockIntuitPost).toHaveBeenCalledWith(
      "invoice?operation=void",
      { Id: "42", SyncToken: "3", sparse: true },
      "default"
    );
    expect(result.Balance).toBe(0);
  });

  it("fetches entity then POSTs delete operation", async () => {
    mockIntuitGet.mockResolvedValue({
      Payment: { Id: "10", SyncToken: "1" },
    });
    mockIntuitPost.mockResolvedValue({
      Payment: { Id: "10", status: "Deleted" },
    });

    const result = await entityOperation("payment", "Payment", "10", "delete", "prod");

    expect(mockIntuitPost).toHaveBeenCalledWith(
      "payment?operation=delete",
      { Id: "10", SyncToken: "1", sparse: true },
      "prod"
    );
    expect(result.Id).toBe("10");
  });
});
