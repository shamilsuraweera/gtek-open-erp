import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import Invoices from "./Invoices";
import apiClient from "../api/client";

jest.mock("../api/client", () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn() },
}));

const CONTACTS = [{ Id: 1, Name: "Acme Corp", IsCustomer: true, IsVendor: false, IsActive: true }];
const PRODUCTS = [
  { Id: 1, SKU: "WID-1", Name: "Widget", SalePrice: "19.9900", IsActive: true },
];

function mockGet({ invoices = [], contacts = CONTACTS, products = PRODUCTS } = {}) {
  apiClient.get.mockImplementation((url) => {
    if (url === "/sales/invoices") return Promise.resolve({ data: invoices });
    if (url === "/contacts") return Promise.resolve({ data: contacts });
    if (url === "/inventory/products") return Promise.resolve({ data: products });
    return Promise.reject(new Error(`unexpected url: ${url}`));
  });
}

function renderInvoices(options) {
  mockGet(options);
  return render(
    <MemoryRouter>
      <Invoices />
    </MemoryRouter>,
  );
}

describe("Invoices", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("shows the list view by default with existing invoices", async () => {
    renderInvoices({
      invoices: [
        {
          Id: 1,
          InvoiceNumber: "INV-2026-1",
          Date: "2026-01-15",
          Contact: { Name: "Acme Corp" },
          TotalAmount: "59.9700",
          Status: "Posted",
        },
      ],
    });

    expect(await screen.findByText("INV-2026-1")).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "Acme Corp" })).toBeInTheDocument();
    expect(screen.getByText("Posted")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^post$/i })).not.toBeInTheDocument();
  });

  it("auto-fills UnitPrice from the selected product and computes exact live totals", async () => {
    renderInvoices({ invoices: [] });
    await userEvent.click(await screen.findByRole("button", { name: /new invoice/i }));
    await screen.findByRole("option", { name: "WID-1 — Widget" });

    await userEvent.selectOptions(screen.getByLabelText(/line 1 product/i), "1");

    expect(screen.getByLabelText(/line 1 unit price/i)).toHaveValue("19.9900");

    await userEvent.clear(screen.getByLabelText(/line 1 quantity/i));
    await userEvent.type(screen.getByLabelText(/line 1 quantity/i), "3");

    // 3 x 19.9900 = 59.9700 exactly, via integer minor-unit math.
    expect(screen.getByText("Total Amount:").parentElement).toHaveTextContent("59.9700");
  });

  it("creates a draft invoice and returns to the list without a page reload", async () => {
    apiClient.post.mockResolvedValue({
      data: {
        Id: 5,
        InvoiceNumber: "",
        Date: "2026-01-15",
        Contact: { Name: "Acme Corp" },
        TotalAmount: "59.9700",
        Status: "Draft",
      },
    });

    renderInvoices({ invoices: [] });
    await userEvent.click(await screen.findByRole("button", { name: /new invoice/i }));
    await screen.findByRole("option", { name: "WID-1 — Widget" });

    await userEvent.selectOptions(screen.getByLabelText("Customer"), "1");
    await userEvent.type(screen.getByLabelText("Date"), "2026-01-15");
    await userEvent.type(screen.getByLabelText("Due Date"), "2026-02-15");
    await userEvent.selectOptions(screen.getByLabelText(/line 1 product/i), "1");
    await userEvent.clear(screen.getByLabelText(/line 1 quantity/i));
    await userEvent.type(screen.getByLabelText(/line 1 quantity/i), "3");

    await userEvent.click(screen.getByRole("button", { name: /save draft/i }));

    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith("/sales/invoices", {
        ContactId: 1,
        Date: "2026-01-15",
        DueDate: "2026-02-15",
        Lines: [{ ProductId: 1, Quantity: "3", UnitPrice: "19.9900" }],
      });
    });

    expect(await screen.findByRole("button", { name: /new invoice/i })).toBeInTheDocument();
    expect(screen.getByText("(unposted)")).toBeInTheDocument();
  });

  it("posts a draft invoice and updates its row to Posted", async () => {
    renderInvoices({
      invoices: [
        {
          Id: 7,
          InvoiceNumber: "",
          Date: "2026-01-15",
          Contact: { Name: "Acme Corp" },
          TotalAmount: "59.9700",
          Status: "Draft",
        },
      ],
    });
    apiClient.post.mockResolvedValue({
      data: {
        Id: 7,
        InvoiceNumber: "INV-2026-7",
        Date: "2026-01-15",
        Contact: { Name: "Acme Corp" },
        TotalAmount: "59.9700",
        Status: "Posted",
      },
    });

    await screen.findByText("(unposted)");
    await userEvent.click(screen.getByRole("button", { name: /^post$/i }));

    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith("/sales/invoices/7/post");
    });
    expect(await screen.findByText("INV-2026-7")).toBeInTheDocument();
    expect(screen.getByText("Posted")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^post$/i })).not.toBeInTheDocument();
  });
});
