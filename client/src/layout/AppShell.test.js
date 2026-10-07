import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import AppShell from "./AppShell";
import { AuthProvider } from "../context/AuthContext";
import apiClient, { TOKEN_STORAGE_KEY } from "../api/client";

jest.mock("../api/client", () => ({
  __esModule: true,
  default: { get: jest.fn(), patch: jest.fn() },
  TOKEN_STORAGE_KEY: "gtek_token",
  UNAUTHORIZED_EVENT: "gtek_unauthorized",
}));

function makeFakeToken(payload) {
  return `header.${btoa(JSON.stringify(payload))}.signature`;
}

function renderShell(path, role = "Admin") {
  localStorage.setItem(TOKEN_STORAGE_KEY, makeFakeToken({ sub: 1, email: "ada@gtek.dev", role }));
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<h1>Login page</h1>} />
          <Route element={<AppShell />}>
            <Route path="/" element={<p>dashboard body</p>} />
            <Route path="/finance/reports" element={<p>reports body</p>} />
            <Route path="/settings/profile" element={<p>profile body</p>} />
            <Route path="/settings/users" element={<p>users body</p>} />
          </Route>
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
  apiClient.get.mockResolvedValue({ data: { Email: "ada@gtek.dev", DisplayName: "Ada Perera", Role: "Admin" } });
});

describe("AppShell", () => {
  it("shows the current module and its tabs in the top ribbon", async () => {
    renderShell("/finance/reports?tab=general-ledger");

    const ribbonTabs = await screen.findByRole("navigation", { name: /finance sections/i });
    expect(within(ribbonTabs).getByRole("link", { name: "Journal Entries" })).toBeInTheDocument();
    expect(within(ribbonTabs).getByRole("button", { name: "Reports" })).toHaveClass("active");
  });

  it("opens a dropdown of sub-pages from a ribbon tab", async () => {
    renderShell("/finance/reports");

    await userEvent.click(await screen.findByRole("button", { name: "Configuration" }));
    const menu = screen.getByRole("menu");
    expect(within(menu).getByRole("menuitem", { name: "Chart of Accounts" })).toHaveAttribute(
      "href",
      "/finance/settings?tab=accounts",
    );
    expect(within(menu).getByRole("menuitem", { name: "Taxes" })).toBeInTheDocument();

    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("collapses the sidebar and remembers the choice", async () => {
    const { unmount } = renderShell("/");

    await userEvent.click(await screen.findByRole("button", { name: /collapse sidebar/i }));
    expect(screen.getByRole("complementary", { name: "Primary" })).toHaveClass("is-collapsed");
    expect(localStorage.getItem("gtek_sidebar_collapsed")).toBe("1");

    unmount();
    renderShell("/");
    expect(await screen.findByRole("button", { name: /expand sidebar/i })).toBeInTheDocument();
  });

  it("offers Edit profile and Log out from the profile menu, and logs out", async () => {
    renderShell("/");

    await userEvent.click(await screen.findByRole("button", { name: /account menu/i }));
    expect(await screen.findByText("ada@gtek.dev")).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: /edit profile/i })).toHaveAttribute("href", "/settings/profile");

    await userEvent.click(screen.getByRole("menuitem", { name: /log out/i }));
    expect(await screen.findByRole("heading", { name: "Login page" })).toBeInTheDocument();
    expect(localStorage.getItem(TOKEN_STORAGE_KEY)).toBeNull();
  });

  it("shows Settings as one sidebar link with its tabs in the ribbon", async () => {
    renderShell("/settings/users");

    expect(await screen.findAllByRole("link", { name: "Security / Users" })).toHaveLength(1);
    expect(screen.getAllByRole("link", { name: "My Profile" })).toHaveLength(1);
    expect(screen.getAllByRole("link", { name: "Settings" })).toHaveLength(1);
  });

  it("hides the admin-only Settings link from regular users", async () => {
    renderShell("/settings/profile", "User");

    expect(await screen.findByRole("link", { name: "My Profile" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /security \/ users/i })).not.toBeInTheDocument();
  });
});
