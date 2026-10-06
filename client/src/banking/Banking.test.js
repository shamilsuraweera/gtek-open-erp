import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import BankStatements from "./BankStatements";
import ReconciliationDashboard from "./ReconciliationDashboard";
import apiClient from "../api/client";

jest.mock("../api/client", () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn() },
}));

const ACCOUNTS = [{ Id: 1, Code: "1000", Name: "Main Bank", Type: "Asset", IsActive: true }];

function mockGet({ statements = [], accounts = ACCOUNTS, bankLines = [], ledgerLines = [] } = {}) {
  apiClient.get.mockImplementation((url) => {
    if (url === "/banking/bank-statements") return Promise.resolve({ data: statements });
    if (url === "/finance/accounts") return Promise.resolve({ data: accounts });
    if (url.startsWith("/banking/reconciliation/unreconciled-bank-lines")) {
      return Promise.resolve({ data: bankLines });
    }
    if (url.startsWith("/banking/reconciliation/unreconciled-ledger-lines")) {
      return Promise.resolve({ data: ledgerLines });
    }
    return Promise.reject(new Error(`unexpected url: ${url}`));
  });
}

function renderWithRouter(element, options) {
  mockGet(options);
  return render(<MemoryRouter>{element}</MemoryRouter>);
}

describe("BankStatements", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders existing statements", async () => {
    renderWithRouter(<BankStatements />, {
      statements: [
        {
          Id: 1,
          Reference: "STMT-FEB",
          Account: { Code: "1000", Name: "Main Bank" },
          StatementDate: "2026-02-28",
          StartingBalance: "1000.0000",
          EndingBalance: "1175.2500",
        },
      ],
    });

    expect(await screen.findByText("STMT-FEB")).toBeInTheDocument();
    expect(screen.getByText("1175.2500")).toBeInTheDocument();
  });

  it("computes the live Ending Balance from signed line amounts via exact minor-unit math", async () => {
    renderWithRouter(<BankStatements />, { statements: [] });
    await screen.findByRole("option", { name: "1000 — Main Bank" });

    await userEvent.type(screen.getByLabelText("Starting Balance"), "1000");
    await userEvent.type(screen.getByLabelText(/line 1 amount/i), "250.50");
    await userEvent.click(screen.getByRole("button", { name: /add line/i }));
    await userEvent.type(screen.getByLabelText(/line 2 amount/i), "-75.25");

    // 1000 + 250.50 - 75.25 = 1175.25 exactly.
    expect(screen.getByText("Ending Balance:").parentElement).toHaveTextContent("1175.2500");
  });

  it("creates a statement with signed amounts sent as strings", async () => {
    apiClient.post.mockResolvedValue({
      data: {
        Id: 2,
        Reference: "STMT-MAR",
        Account: { Code: "1000", Name: "Main Bank" },
        StatementDate: "2026-03-31",
        StartingBalance: "1175.2500",
        EndingBalance: "1175.2500",
      },
    });

    renderWithRouter(<BankStatements />, { statements: [] });
    await screen.findByRole("option", { name: "1000 — Main Bank" });

    await userEvent.selectOptions(screen.getByLabelText("Account"), "1");
    await userEvent.type(screen.getByLabelText("Statement Date"), "2026-03-31");
    await userEvent.type(screen.getByLabelText("Reference"), "STMT-MAR");
    await userEvent.type(screen.getByLabelText("Starting Balance"), "1175.25");
    await userEvent.type(screen.getByLabelText(/line 1 date/i), "2026-03-05");
    await userEvent.type(screen.getByLabelText(/line 1 description/i), "Interest");
    await userEvent.type(screen.getByLabelText(/line 1 amount/i), "-10.00");

    await userEvent.click(screen.getByRole("button", { name: /save statement/i }));

    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith("/banking/bank-statements", {
        AccountId: 1,
        StatementDate: "2026-03-31",
        Reference: "STMT-MAR",
        StartingBalance: "1175.25",
        Lines: [{ Date: "2026-03-05", Description: "Interest", Amount: "-10.00" }],
      });
    });
    expect(await screen.findByText("STMT-MAR")).toBeInTheDocument();
  });
});

describe("ReconciliationDashboard", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("prompts for an account before showing any lines", async () => {
    renderWithRouter(<ReconciliationDashboard />, {});
    await screen.findByRole("option", { name: "1000 — Main Bank" });

    expect(screen.getByText(/select an account to begin reconciling/i)).toBeInTheDocument();
    expect(apiClient.get).not.toHaveBeenCalledWith(expect.stringContaining("unreconciled"));
  });

  it("shows the Match button only once one row from each side is selected, then matches and removes both rows", async () => {
    renderWithRouter(<ReconciliationDashboard />, {
      bankLines: [{ Id: 10, Date: "2026-02-01", Description: "Deposit", Amount: "500.0000" }],
      ledgerLines: [
        {
          Id: 20,
          Debit: "500.0000",
          Credit: "0.0000",
          JournalEntry: { EntryDate: "2026-02-01", Reference: "GEN/1" },
        },
      ],
    });
    await screen.findByRole("option", { name: "1000 — Main Bank" });

    await userEvent.selectOptions(screen.getByLabelText("Account"), "1");

    const bankRow = await screen.findByText("Deposit");
    expect(screen.queryByRole("button", { name: /^match$/i })).not.toBeInTheDocument();

    await userEvent.click(bankRow);
    expect(screen.queryByRole("button", { name: /^match$/i })).not.toBeInTheDocument();

    const ledgerRow = screen.getByText("GEN/1");
    await userEvent.click(ledgerRow);

    const matchButton = await screen.findByRole("button", { name: /^match$/i });

    apiClient.post.mockResolvedValue({ data: { Id: 10, IsReconciled: true } });
    await userEvent.click(matchButton);

    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith("/banking/reconciliation/match", {
        BankLineId: 10,
        JournalLineId: 20,
      });
    });
    await waitFor(() => {
      expect(screen.queryByText("Deposit")).not.toBeInTheDocument();
    });
    expect(screen.queryByText("GEN/1")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^match$/i })).not.toBeInTheDocument();
  });

  it("refetches unreconciled lines when switching accounts", async () => {
    renderWithRouter(<ReconciliationDashboard />, {
      accounts: [
        { Id: 1, Code: "1000", Name: "Main Bank", Type: "Asset", IsActive: true },
        { Id: 2, Code: "1010", Name: "Savings", Type: "Asset", IsActive: true },
      ],
      bankLines: [],
      ledgerLines: [],
    });
    await screen.findByRole("option", { name: "1000 — Main Bank" });

    await userEvent.selectOptions(screen.getByLabelText("Account"), "1");
    await waitFor(() => {
      expect(apiClient.get).toHaveBeenCalledWith("/banking/reconciliation/unreconciled-bank-lines?accountId=1");
    });

    await userEvent.selectOptions(screen.getByLabelText("Account"), "2");
    await waitFor(() => {
      expect(apiClient.get).toHaveBeenCalledWith("/banking/reconciliation/unreconciled-bank-lines?accountId=2");
    });
  });
});
