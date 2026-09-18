import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import Reports from "./Reports";
import apiClient from "../api/client";

jest.mock("../api/client", () => ({
  __esModule: true,
  default: { get: jest.fn() },
}));

const ACCOUNTS = [
  { Id: 1, Code: "1000", Name: "Cash", Type: "Asset", IsActive: true },
  { Id: 2, Code: "4000", Name: "Sales Revenue", Type: "Income", IsActive: true },
];

function mockGet({ trialBalance = [], ledgers = {} } = {}) {
  apiClient.get.mockImplementation((url) => {
    if (url === "/finance/reports/trial-balance") return Promise.resolve({ data: trialBalance });
    if (url === "/finance/accounts") return Promise.resolve({ data: ACCOUNTS });
    if (url.startsWith("/finance/reports/general-ledger")) {
      const accountId = new URL(url, "http://localhost").searchParams.get("accountId");
      return Promise.resolve({ data: ledgers[accountId] || [] });
    }
    return Promise.reject(new Error(`unexpected url: ${url}`));
  });
}

function renderReports(options) {
  mockGet(options);
  return render(
    <MemoryRouter>
      <Reports />
    </MemoryRouter>,
  );
}

describe("Reports", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Trial Balance", () => {
    it("renders rows and computes an exact grand total, flagging an unbalanced ledger", async () => {
      renderReports({
        trialBalance: [
          {
            accountId: 1,
            accountCode: "1000",
            accountName: "Cash",
            accountType: "Asset",
            totalDebit: "100.1000",
            totalCredit: "0.0000",
          },
          {
            accountId: 2,
            accountCode: "4000",
            accountName: "Sales Revenue",
            accountType: "Income",
            totalDebit: "0.2000",
            totalCredit: "100.0000",
          },
        ],
      });

      expect(await screen.findByText("1000")).toBeInTheDocument();
      expect(screen.getByText("Grand Total")).toBeInTheDocument();
      // 100.1000 + 0.2000 = 100.3000 debit; 0.0000 + 100.0000 = 100.0000 credit
      expect(screen.getByTestId("grand-total-debit")).toHaveTextContent("100.3000");
      expect(screen.getByTestId("grand-total-credit")).toHaveTextContent("100.0000");
      expect(screen.getByText(/ledger is not balanced/i)).toBeInTheDocument();
    });

    it("reports a balanced ledger with no float drift across odd decimals", async () => {
      renderReports({
        trialBalance: [
          {
            accountId: 1,
            accountCode: "1000",
            accountName: "Cash",
            accountType: "Asset",
            totalDebit: "0.10",
            totalCredit: "0.0000",
          },
          {
            accountId: 2,
            accountCode: "4000",
            accountName: "Sales Revenue",
            accountType: "Income",
            totalDebit: "0.20",
            totalCredit: "0.30",
          },
        ],
      });

      await screen.findByText("1000");
      // 0.10 + 0.20 = 0.30 debit; 0 + 0.30 = 0.30 credit — exact under
      // integer-minor-units math, where naive float summation could drift.
      expect(screen.getByTestId("grand-total-debit")).toHaveTextContent("0.3000");
      expect(screen.getByTestId("grand-total-credit")).toHaveTextContent("0.3000");
      expect(screen.getByText(/ledger is balanced/i)).toBeInTheDocument();
    });

    it("shows an empty state with no posted activity", async () => {
      renderReports({ trialBalance: [] });
      expect(await screen.findByText(/no posted activity yet/i)).toBeInTheDocument();
    });
  });

  describe("General Ledger", () => {
    it("prompts for an account, then fetches and displays its ledger", async () => {
      renderReports({
        ledgers: {
          1: [
            {
              lineId: 1,
              entryId: 10,
              reference: "GEN/1",
              entryDate: "2026-01-01",
              description: "Opening balance",
              debit: "100.0000",
              credit: "0.0000",
              runningBalance: "100.0000",
            },
          ],
        },
      });

      await userEvent.click(screen.getByRole("button", { name: "General Ledger" }));
      expect(screen.getByText(/select an account to view its ledger/i)).toBeInTheDocument();

      await screen.findByRole("option", { name: "1000 — Cash" });
      await userEvent.selectOptions(screen.getByLabelText("Account"), "1");

      expect(await screen.findByText("GEN/1")).toBeInTheDocument();
      expect(screen.getByText("Opening balance")).toBeInTheDocument();
      expect(apiClient.get).toHaveBeenCalledWith("/finance/reports/general-ledger?accountId=1");
    });

    it("refetches and replaces the table when switching to a different account", async () => {
      renderReports({
        ledgers: {
          1: [
            {
              lineId: 1,
              entryId: 10,
              reference: "GEN/1",
              entryDate: "2026-01-01",
              description: null,
              debit: "50.0000",
              credit: "0.0000",
              runningBalance: "50.0000",
            },
          ],
          2: [
            {
              lineId: 2,
              entryId: 11,
              reference: "GEN/2",
              entryDate: "2026-01-02",
              description: null,
              debit: "0.0000",
              credit: "75.0000",
              runningBalance: "75.0000",
            },
          ],
        },
      });

      await userEvent.click(screen.getByRole("button", { name: "General Ledger" }));
      await screen.findByRole("option", { name: "1000 — Cash" });

      await userEvent.selectOptions(screen.getByLabelText("Account"), "1");
      expect(await screen.findByText("GEN/1")).toBeInTheDocument();

      await userEvent.selectOptions(screen.getByLabelText("Account"), "2");
      expect(await screen.findByText("GEN/2")).toBeInTheDocument();
      expect(screen.queryByText("GEN/1")).not.toBeInTheDocument();
    });
  });
});
