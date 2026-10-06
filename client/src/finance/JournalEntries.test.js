import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import JournalEntries from "./JournalEntries";
import apiClient from "../api/client";

jest.mock("../api/client", () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn() },
}));

const ACCOUNTS = [
  { Id: 1, Code: "1000", Name: "Cash", Type: "Asset", IsActive: true },
  { Id: 2, Code: "4000", Name: "Sales Revenue", Type: "Income", IsActive: true },
];
const JOURNALS = [{ Id: 1, Code: "GEN", Name: "General", Type: "General", IsActive: true }];

function mockGet(entries = []) {
  apiClient.get.mockImplementation((url) => {
    if (url === "/finance/journal-entries") return Promise.resolve({ data: entries });
    if (url === "/finance/accounts") return Promise.resolve({ data: ACCOUNTS });
    if (url === "/finance/journals") return Promise.resolve({ data: JOURNALS });
    return Promise.reject(new Error(`unexpected url: ${url}`));
  });
}

function renderPage(entries = []) {
  mockGet(entries);
  return render(
    <MemoryRouter>
      <JournalEntries />
    </MemoryRouter>,
  );
}

describe("JournalEntries", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("shows the list view by default with existing entries", async () => {
    renderPage([
      {
        Id: 1,
        Reference: "GEN/1",
        EntryDate: "2026-09-16",
        Journal: { Code: "GEN", Name: "General" },
        TotalDebit: "100.0000",
        TotalCredit: "100.0000",
        State: "Posted",
      },
    ]);

    expect(await screen.findByText("GEN/1")).toBeInTheDocument();
    expect(screen.getByText("GEN — General")).toBeInTheDocument();
    expect(screen.getByText("Posted")).toBeInTheDocument();
    // Posted rows get no Post button.
    expect(screen.queryByRole("button", { name: /^post$/i })).not.toBeInTheDocument();
  });

  it("disables Save Draft until balanced, positive, and at least two lines", async () => {
    renderPage([]);
    await userEvent.click(await screen.findByRole("button", { name: /new entry/i }));

    const saveButton = await screen.findByRole("button", { name: /save draft/i });
    expect(saveButton).toBeDisabled();

    await userEvent.selectOptions(screen.getByLabelText("Journal"), "1");
    await userEvent.type(screen.getByLabelText("Date"), "2026-09-16");
    expect(saveButton).toBeDisabled(); // lines still empty/unbalanced

    await userEvent.selectOptions(screen.getByLabelText("Line 1 account"), "1");
    await userEvent.type(screen.getByLabelText("Line 1 debit"), "100");
    expect(saveButton).toBeDisabled(); // unbalanced: debit 100, credit 0

    await userEvent.selectOptions(screen.getByLabelText("Line 2 account"), "2");
    await userEvent.type(screen.getByLabelText("Line 2 credit"), "100");

    expect(screen.getByText("Balanced")).toBeInTheDocument();
    await waitFor(() => expect(saveButton).toBeEnabled());
  });

  it("creates a draft, returns to the list, and shows it without a page reload", async () => {
    renderPage([]);
    apiClient.post.mockResolvedValue({
      data: {
        Id: 5,
        Reference: "",
        EntryDate: "2026-09-16",
        Journal: { Code: "GEN", Name: "General" },
        TotalDebit: "0.0000",
        TotalCredit: "0.0000",
        State: "Draft",
      },
    });

    await userEvent.click(await screen.findByRole("button", { name: /new entry/i }));
    await screen.findByRole("option", { name: "GEN — General" });

    await userEvent.selectOptions(screen.getByLabelText("Journal"), "1");
    await userEvent.type(screen.getByLabelText("Date"), "2026-09-16");
    await userEvent.selectOptions(screen.getByLabelText("Line 1 account"), "1");
    await userEvent.type(screen.getByLabelText("Line 1 debit"), "50");
    await userEvent.selectOptions(screen.getByLabelText("Line 2 account"), "2");
    await userEvent.type(screen.getByLabelText("Line 2 credit"), "50");

    await userEvent.click(screen.getByRole("button", { name: /save draft/i }));

    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith(
        "/finance/journal-entries",
        expect.objectContaining({
          JournalId: 1,
          EntryDate: "2026-09-16",
          Lines: [
            expect.objectContaining({ AccountId: 1, Debit: "50", Credit: "0" }),
            expect.objectContaining({ AccountId: 2, Debit: "0", Credit: "50" }),
          ],
        }),
      );
    });

    // Back on the list view, showing the newly created draft.
    expect(await screen.findByRole("button", { name: /new entry/i })).toBeInTheDocument();
    expect(screen.getByText("(unposted)")).toBeInTheDocument();
    expect(screen.getByText("Draft")).toBeInTheDocument();
  });

  it("posts a draft entry and updates its row to Posted", async () => {
    renderPage([
      {
        Id: 7,
        Reference: "",
        EntryDate: "2026-09-16",
        Journal: { Code: "GEN", Name: "General" },
        TotalDebit: "0.0000",
        TotalCredit: "0.0000",
        State: "Draft",
      },
    ]);
    apiClient.post.mockResolvedValue({
      data: {
        Id: 7,
        Reference: "GEN/1",
        EntryDate: "2026-09-16",
        Journal: { Code: "GEN", Name: "General" },
        TotalDebit: "50.0000",
        TotalCredit: "50.0000",
        State: "Posted",
      },
    });

    await screen.findByText("(unposted)");
    await userEvent.click(screen.getByRole("button", { name: /^post$/i }));

    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith("/finance/journal-entries/7/post");
    });
    expect(await screen.findByText("GEN/1")).toBeInTheDocument();
    expect(screen.getByText("Posted")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^post$/i })).not.toBeInTheDocument();
  });
});
