import { describe, it, expect, vi, beforeEach } from "vitest";
import { entityGet } from "../lib/entity-get.js";

// Mock intuit-api module
vi.mock("../lib/intuit-api.js", () => ({
  intuitGet: vi.fn(),
}));

import { intuitGet } from "../lib/intuit-api.js";
const mockIntuitGet = vi.mocked(intuitGet);

describe("entityGet", () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
  });

  it("throws when entity is not found", async () => {
    mockIntuitGet.mockResolvedValue({ Customer: null });
    await expect(entityGet("customer", "Customer", "999", {}, "default"))
      .rejects.toThrow("Customer 999 not found.");
  });

  it("outputs JSON when json option is true", async () => {
    const customer = { Id: "1", DisplayName: "Acme Corp", Balance: 100 };
    mockIntuitGet.mockResolvedValue({ Customer: customer });

    await entityGet("customer", "Customer", "1", { json: true }, "default");

    expect(consoleSpy).toHaveBeenCalledWith(JSON.stringify(customer, null, 2));
  });

  it("outputs CSV when csv option is true", async () => {
    const customer = { Id: "1", DisplayName: "Acme Corp" };
    mockIntuitGet.mockResolvedValue({ Customer: customer });

    await entityGet("customer", "Customer", "1", { csv: true }, "default");

    const output = consoleSpy.mock.calls[0][0] as string;
    expect(output).toContain("Id");
    expect(output).toContain("DisplayName");
    expect(output).toContain("Acme Corp");
  });

  it("outputs key-value table with custom fields", async () => {
    const customer = { Id: "1", DisplayName: "Acme Corp", Balance: 500 };
    mockIntuitGet.mockResolvedValue({ Customer: customer });

    await entityGet("customer", "Customer", "1", {}, "default", [
      { label: "Id", value: (e) => String(e.Id) },
      { label: "Name", value: (e) => String(e.DisplayName) },
    ]);

    const output = consoleSpy.mock.calls.map((c: unknown[]) => c[0]).join("\n");
    expect(output).toContain("Id");
    expect(output).toContain("Name");
    expect(output).toContain("Acme Corp");
  });

  it("outputs fallback key-value table without custom fields", async () => {
    const item = { Id: "7", Name: "Widget", Type: "Service" };
    mockIntuitGet.mockResolvedValue({ Item: item });

    await entityGet("item", "Item", "7", {}, "default");

    const output = consoleSpy.mock.calls.map((c: unknown[]) => c[0]).join("\n");
    expect(output).toContain("Widget");
    expect(output).toContain("Service");
  });

  it("calls intuitGet with correct path", async () => {
    mockIntuitGet.mockResolvedValue({ Invoice: { Id: "42" } });

    await entityGet("invoice", "Invoice", "42", { json: true }, "prod");

    expect(mockIntuitGet).toHaveBeenCalledWith("invoice/42", "prod");
  });
});
