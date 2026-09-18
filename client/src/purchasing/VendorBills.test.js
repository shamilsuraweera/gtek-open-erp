import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import VendorBills from "./VendorBills";
import apiClient from "../api/client";

jest.mock("../api/client", () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn() },
}));

const CONTACTS = [
  { Id: 1, Name: "Acme Supplies", IsCustomer: false, IsVendor: true, IsActive: true },
  { Id: 2, Name: "Retail Customer", IsCustomer: true, IsVendor: false, IsActive: true },
];
const PRODUCTS = [
  { Id: 1, SKU: "RAW-1", Name: "Raw Material", SalePrice: "19.9900", CostPrice: "8.5000", IsActive: true },
];

function mockGet({ bills = [], contacts = CONTACTS, products = PRODUCTS } = {}) {
  apiClient.get.mockImplementation((url) => {
    if (url === "/purchasing/vendor-bills") return Promise.resolve({ data: bills });
    if (url === "/contacts") return Promise.resolve({ data: contacts });
    if (url === "/inventory/products") return Promise.resolve({ data: products });
    return Promise.reject(new Error(`unexpected url: ${url}`));
  });
}

function renderVendorBills(options) {
  mockGet(options);
  return render(
    <MemoryRouter>
      <VendorBills />
    </MemoryRouter>,
  );
}

describe("VendorBills", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("shows the list view by default with existing bills", async () => {
    renderVendorBills({
      bills: [
        {
          Id: 1,
          BillNumber: "BILL-2026-1",
          Date: "2026-01-15",
          Contact: { Name: "Acme Supplies" },
          TotalAmount: "34.0000",
          Status: "Posted",
        },
      ],
    });

    expect(await screen.findByText("BILL-2026-1")).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "Acme Supplies" })).toBeInTheDocument();
    expect(screen.getByText("Posted")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^post$/i })).not.toBeInTheDocument();
  });

  it("only offers vendors (not customers) in the Vendor dropdown", async () => {
    renderVendorBills({ bills: [] });
    await userEvent.click(await screen.findByRole("button", { name: /new vendor bill/i }));
    await screen.findByRole("option", { name: "RAW-1 — Raw Material" });

    expect(screen.getByRole("option", { name: "Acme Supplies" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "Retail Customer" })).not.toBeInTheDocument();
  });

  it("auto-fills UnitPrice from the product's CostPrice (not SalePrice) and computes exact live totals", async () => {
    renderVendorBills({ bills: [] });
    await userEvent.click(await screen.findByRole("button", { name: /new vendor bill/i }));
    await screen.findByRole("option", { name: "RAW-1 — Raw Material" });

    await userEvent.selectOptions(screen.getByLabelText(/line 1 product/i), "1");

    // CRITICAL: CostPrice (8.5000), never SalePrice (19.9900).
    expect(screen.getByLabelText(/line 1 unit price/i)).toHaveValue("8.5000");

    await userEvent.clear(screen.getByLabelText(/line 1 quantity/i));
    await userEvent.type(screen.getByLabelText(/line 1 quantity/i), "4");

    // 4 x 8.5000 = 34.0000 exactly, via integer minor-unit math.
    expect(screen.getByText("Total Amount:").parentElement).toHaveTextContent("34.0000");
  });

  it("creates a draft vendor bill and returns to the list without a page reload", async () => {
    apiClient.post.mockResolvedValue({
      data: {
        Id: 5,
        BillNumber: "",
        Date: "2026-01-15",
        Contact: { Name: "Acme Supplies" },
        TotalAmount: "34.0000",
        Status: "Draft",
      },
    });

    renderVendorBills({ bills: [] });
    await userEvent.click(await screen.findByRole("button", { name: /new vendor bill/i }));
    await screen.findByRole("option", { name: "RAW-1 — Raw Material" });

    await userEvent.selectOptions(screen.getByLabelText("Vendor"), "1");
    await userEvent.type(screen.getByLabelText("Date"), "2026-01-15");
    await userEvent.type(screen.getByLabelText("Due Date"), "2026-02-15");
    await userEvent.selectOptions(screen.getByLabelText(/line 1 product/i), "1");
    await userEvent.clear(screen.getByLabelText(/line 1 quantity/i));
    await userEvent.type(screen.getByLabelText(/line 1 quantity/i), "4");

    await userEvent.click(screen.getByRole("button", { name: /save draft/i }));

    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith("/purchasing/vendor-bills", {
        ContactId: 1,
        Date: "2026-01-15",
        DueDate: "2026-02-15",
        Lines: [{ ProductId: 1, Quantity: "4", UnitPrice: "8.5000" }],
      });
    });

    expect(await screen.findByRole("button", { name: /new vendor bill/i })).toBeInTheDocument();
    expect(screen.getByText("(unposted)")).toBeInTheDocument();
  });

  it("posts a draft vendor bill and updates its row to Posted", async () => {
    renderVendorBills({
      bills: [
        {
          Id: 7,
          BillNumber: "",
          Date: "2026-01-15",
          Contact: { Name: "Acme Supplies" },
          TotalAmount: "34.0000",
          Status: "Draft",
        },
      ],
    });
    apiClient.post.mockResolvedValue({
      data: {
        Id: 7,
        BillNumber: "BILL-2026-7",
        Date: "2026-01-15",
        Contact: { Name: "Acme Supplies" },
        TotalAmount: "34.0000",
        Status: "Posted",
      },
    });

    await screen.findByText("(unposted)");
    await userEvent.click(screen.getByRole("button", { name: /^post$/i }));

    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith("/purchasing/vendor-bills/7/post");
    });
    expect(await screen.findByText("BILL-2026-7")).toBeInTheDocument();
    expect(screen.getByText("Posted")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^post$/i })).not.toBeInTheDocument();
  });
});
