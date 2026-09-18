import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import Contacts from "./Contacts";
import apiClient from "../api/client";

jest.mock("../api/client", () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn(), delete: jest.fn() },
}));

const ACCOUNTS = [
  { Id: 1, Code: "1100", Name: "Accounts Receivable", Type: "Asset", IsActive: true },
  { Id: 2, Code: "2100", Name: "Accounts Payable", Type: "Liability", IsActive: true },
];

function mockGet({ contacts = [], accounts = ACCOUNTS } = {}) {
  apiClient.get.mockImplementation((url) => {
    if (url === "/contacts") return Promise.resolve({ data: contacts });
    if (url === "/finance/accounts") return Promise.resolve({ data: accounts });
    return Promise.reject(new Error(`unexpected url: ${url}`));
  });
}

function renderContacts(options) {
  mockGet(options);
  return render(
    <MemoryRouter>
      <Contacts />
    </MemoryRouter>,
  );
}

describe("Contacts", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders existing contacts with AR/AP account names from eager-loaded relations", async () => {
    renderContacts({
      contacts: [
        {
          Id: 1,
          Name: "Acme Corp",
          Email: "billing@acme.test",
          Phone: "555-0100",
          IsCustomer: true,
          IsVendor: false,
          AccountsReceivable: { Code: "1100", Name: "Accounts Receivable" },
          AccountsPayable: null,
          IsActive: true,
        },
      ],
    });

    expect(await screen.findByRole("cell", { name: "Acme Corp" })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "billing@acme.test" })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "Yes" })).toBeInTheDocument();
    expect(screen.getAllByRole("cell", { name: "No" })).toHaveLength(1);
    expect(screen.getByRole("cell", { name: "Accounts Receivable" })).toBeInTheDocument();
  });

  it("creates a contact using Accounts fetched from the Finance API for the AR/AP pickers", async () => {
    apiClient.post.mockResolvedValue({
      data: {
        Id: 2,
        Name: "Globex Inc",
        Email: null,
        Phone: null,
        IsCustomer: true,
        IsVendor: true,
        AccountsReceivable: { Code: "1100", Name: "Accounts Receivable" },
        AccountsPayable: { Code: "2100", Name: "Accounts Payable" },
        IsActive: true,
      },
    });

    renderContacts({ contacts: [] });
    await waitFor(() => {
      expect(
        within(screen.getByLabelText(/ar account/i)).getByRole("option", {
          name: "1100 — Accounts Receivable",
        }),
      ).toBeInTheDocument();
    });

    await userEvent.type(screen.getByLabelText("Name"), "Globex Inc");
    // IsCustomer defaults to checked; also mark as a Vendor.
    expect(screen.getByLabelText("Customer")).toBeChecked();
    await userEvent.click(screen.getByLabelText("Vendor"));
    await userEvent.selectOptions(screen.getByLabelText(/ar account/i), "1");
    await userEvent.selectOptions(screen.getByLabelText(/ap account/i), "2");
    await userEvent.click(screen.getByRole("button", { name: /add contact/i }));

    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith("/contacts", {
        Name: "Globex Inc",
        Email: undefined,
        Phone: undefined,
        IsCustomer: true,
        IsVendor: true,
        AccountsReceivableId: 1,
        AccountsPayableId: 2,
      });
    });
    expect(await screen.findByRole("cell", { name: "Globex Inc" })).toBeInTheDocument();
  });

  it("archives a contact and removes it from the table", async () => {
    apiClient.delete.mockResolvedValue({});
    renderContacts({
      contacts: [
        {
          Id: 1,
          Name: "Acme Corp",
          Email: null,
          Phone: null,
          IsCustomer: true,
          IsVendor: false,
          AccountsReceivable: null,
          AccountsPayable: null,
          IsActive: true,
        },
      ],
    });

    await screen.findByRole("cell", { name: "Acme Corp" });
    await userEvent.click(screen.getByRole("button", { name: /archive/i }));

    await waitFor(() => {
      expect(apiClient.delete).toHaveBeenCalledWith("/contacts/1");
    });
    await waitFor(() => {
      expect(screen.queryByRole("cell", { name: "Acme Corp" })).not.toBeInTheDocument();
    });
  });
});
