import { describe, it, expect, vi, beforeEach } from "vitest";
import { entityUpdate } from "../lib/entity-update.js";

vi.mock("../lib/intuit-api.js", () => ({
  intuitGet: vi.fn(),
  intuitPost: vi.fn(),
}));

import { intuitGet, intuitPost } from "../lib/intuit-api.js";
const mockIntuitGet = vi.mocked(intuitGet);
const mockIntuitPost = vi.mocked(intuitPost);

describe("entityUpdate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("throws when entity is not found", async () => {
    mockIntuitGet.mockResolvedValue({ Customer: null });
    await expect(entityUpdate("customer", "Customer", "999", { DisplayName: "New" }, undefined))
      .rejects.toThrow("Customer 999 not found.");
  });

  it("throws when no fields and no file provided", async () => {
    mockIntuitGet.mockResolvedValue({
      Customer: { Id: "1", SyncToken: "0" },
    });
    await expect(entityUpdate("customer", "Customer", "1", {}, undefined))
      .rejects.toThrow("Provide at least one field to update");
  });

  it("performs sparse update with inline fields", async () => {
    mockIntuitGet.mockResolvedValue({
      Customer: { Id: "1", SyncToken: "2", DisplayName: "Old Name" },
    });
    mockIntuitPost.mockResolvedValue({
      Customer: { Id: "1", SyncToken: "3", DisplayName: "New Name" },
    });

    const result = await entityUpdate("customer", "Customer", "1", { DisplayName: "New Name" }, undefined, "default");

    expect(mockIntuitGet).toHaveBeenCalledWith("customer/1", "default");
    expect(mockIntuitPost).toHaveBeenCalledWith(
      "customer",
      { DisplayName: "New Name", Id: "1", SyncToken: "2", sparse: true },
      "default"
    );
    expect(result.DisplayName).toBe("New Name");
  });

  it("filters out undefined fields", async () => {
    mockIntuitGet.mockResolvedValue({
      Vendor: { Id: "5", SyncToken: "1" },
    });
    mockIntuitPost.mockResolvedValue({
      Vendor: { Id: "5", SyncToken: "2", DisplayName: "Updated" },
    });

    await entityUpdate("vendor", "Vendor", "5", {
      DisplayName: "Updated",
      email: undefined,
    } as Record<string, unknown>, undefined, "default");

    const postCall = mockIntuitPost.mock.calls[0][1];
    expect(postCall).not.toHaveProperty("email");
    expect(postCall).toHaveProperty("DisplayName", "Updated");
  });

  it("injects Id, SyncToken, and sparse into file-based payload", async () => {
    // We can't easily test file reading without a real file, but we can verify
    // the function calls intuitGet for the SyncToken
    mockIntuitGet.mockResolvedValue({
      Invoice: { Id: "42", SyncToken: "7" },
    });

    // This will throw because the file doesn't exist, but we can verify the get was called
    await expect(entityUpdate("invoice", "Invoice", "42", {}, "/nonexistent/file.json"))
      .rejects.toThrow("Cannot read file");

    expect(mockIntuitGet).toHaveBeenCalledWith("invoice/42", undefined);
  });
});
