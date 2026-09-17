import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import FinanceSettings from "./FinanceSettings";
import apiClient from "../api/client";

jest.mock("../api/client", () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn(), delete: jest.fn() },
}));

describe("FinanceSettings", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    apiClient.get.mockImplementation((url) => {
      if (url === "/finance/accounts") {
        return Promise.resolve({
          data: [{ Id: 1, Code: "1000", Name: "Cash", Type: "Asset", IsActive: true }],
        });
      }
      if (url === "/finance/journals") return Promise.resolve({ data: [] });
      if (url === "/finance/taxes") return Promise.resolve({ data: [] });
      return Promise.reject(new Error(`unexpected url: ${url}`));
    });
  });

  function renderSettings() {
    return render(
      <MemoryRouter>
        <FinanceSettings />
      </MemoryRouter>,
    );
  }

  it("loads and displays existing accounts on the default tab", async () => {
    renderSettings();

    expect(await screen.findByText("1000")).toBeInTheDocument();
    expect(screen.getByText("Cash")).toBeInTheDocument();
  });

  it("creates a new account and adds it to the table without a page reload", async () => {
    apiClient.post.mockResolvedValue({
      data: { Id: 2, Code: "2000", Name: "Accounts Payable", Type: "Liability", IsActive: true },
    });

    renderSettings();
    await screen.findByText("1000");

    await userEvent.type(screen.getByLabelText("Code"), "2000");
    await userEvent.type(screen.getByLabelText("Name"), "Accounts Payable");
    await userEvent.selectOptions(screen.getByLabelText("Type"), "Liability");
    await userEvent.click(screen.getByRole("button", { name: /add account/i }));

    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith("/finance/accounts", {
        Code: "2000",
        Name: "Accounts Payable",
        Type: "Liability",
        ParentId: undefined,
      });
    });
    expect(await screen.findByText("2000")).toBeInTheDocument();
  });

  it("archives an account and removes it from the table (soft delete)", async () => {
    apiClient.delete.mockResolvedValue({});

    renderSettings();
    await screen.findByText("1000");

    await userEvent.click(screen.getByRole("button", { name: /archive/i }));

    await waitFor(() => {
      expect(apiClient.delete).toHaveBeenCalledWith("/finance/accounts/1");
    });
    await waitFor(() => {
      expect(screen.queryByText("1000")).not.toBeInTheDocument();
    });
  });

  it("switches to the Journals tab and uses the shared Accounts list for the picker", async () => {
    renderSettings();
    await screen.findByText("1000");

    await userEvent.click(screen.getByRole("button", { name: "Journals" }));

    expect(await screen.findByLabelText(/default account/i)).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "1000 — Cash" })).toBeInTheDocument();
  });
});
