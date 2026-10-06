import { render, screen } from "@testing-library/react";
import App from "./App";
import apiClient, { TOKEN_STORAGE_KEY } from "./api/client";

jest.mock("./api/client", () => ({
  __esModule: true,
  default: { get: jest.fn() },
  TOKEN_STORAGE_KEY: "gtek_token",
}));

function makeFakeToken(payload) {
  const base64Payload = btoa(JSON.stringify(payload));
  return `header.${base64Payload}.signature`;
}

beforeEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
  // BrowserRouter reads the real window.location, which persists across
  // tests in the same JSDOM environment unless reset here.
  window.history.pushState({}, "", "/");
});

test("redirects unauthenticated users to the login page", async () => {
  render(<App />);

  expect(await screen.findByRole("heading", { name: /sign in/i })).toBeInTheDocument();
  expect(apiClient.get).not.toHaveBeenCalled();
});

test("renders the command center dashboard once authenticated", async () => {
  localStorage.setItem(
    TOKEN_STORAGE_KEY,
    makeFakeToken({ sub: 1, email: "admin@gtek.dev", role: "Admin" }),
  );
  apiClient.get.mockImplementation((url) => {
    if (url === "/dashboard/metrics") {
      return Promise.resolve({
        data: { revenueThisMonth: "15200.5000", unpaidAR: "3200.0000", unpaidAP: "980.2500" },
      });
    }
    if (url === "/dashboard/recent-activity") {
      return Promise.resolve({
        data: {
          recentInvoices: [
            {
              Id: 1,
              InvoiceNumber: "INV-2026-1",
              Contact: { Name: "Acme Corp" },
              TotalAmount: "500.0000",
              Status: "Posted",
            },
          ],
          recentVendorBills: [
            {
              Id: 1,
              BillNumber: "BILL-2026-1",
              Contact: { Name: "Acme Supplies" },
              TotalAmount: "300.0000",
              Status: "Draft",
            },
          ],
        },
      });
    }
    return Promise.reject(new Error(`unexpected url: ${url}`));
  });

  render(<App />);

  expect(await screen.findByText("Revenue This Month")).toBeInTheDocument();
  expect(screen.getByText("$15,200.50")).toBeInTheDocument();
  expect(screen.getByText("$3,200.00")).toBeInTheDocument();
  expect(screen.getByText("$980.25")).toBeInTheDocument();

  expect(screen.getByText("INV-2026-1")).toBeInTheDocument();
  expect(screen.getByText("Acme Corp")).toBeInTheDocument();
  expect(screen.getByText("BILL-2026-1")).toBeInTheDocument();
  expect(screen.getByText("Acme Supplies")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /security \/ users/i })).toBeInTheDocument();
});

test("hides the Security / Users link from non-admin users", async () => {
  localStorage.setItem(
    TOKEN_STORAGE_KEY,
    makeFakeToken({ sub: 2, email: "bob@gtek.dev", role: "User" }),
  );
  apiClient.get.mockImplementation((url) =>
    Promise.resolve({
      data:
        url === "/dashboard/metrics"
          ? { revenueThisMonth: "0.0000", unpaidAR: "0.0000", unpaidAP: "0.0000" }
          : { recentInvoices: [], recentVendorBills: [] },
    }),
  );

  render(<App />);

  expect(await screen.findByText("Revenue This Month")).toBeInTheDocument();
  expect(screen.queryByRole("link", { name: /security \/ users/i })).not.toBeInTheDocument();
});

test("shows an error when the dashboard data fails to load", async () => {
  localStorage.setItem(
    TOKEN_STORAGE_KEY,
    makeFakeToken({ sub: 1, email: "admin@gtek.dev", role: "Admin" }),
  );
  apiClient.get.mockRejectedValue(new Error("network error"));

  render(<App />);

  expect(await screen.findByText("network error")).toBeInTheDocument();
});
