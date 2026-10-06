import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import UserAdmin from "./UserAdmin";
import apiClient from "../api/client";

jest.mock("../api/client", () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn(), patch: jest.fn(), delete: jest.fn() },
}));
jest.mock("../context/AuthContext", () => ({
  useAuth: () => ({ user: { id: 1, email: "admin@gtek.dev", role: "Admin" } }),
}));

const USERS = [
  { Id: 1, Email: "admin@gtek.dev", Role: "Admin", IsActive: true, CreatedAt: "2026-01-01T00:00:00.000Z" },
  { Id: 2, Email: "bob@gtek.dev", Role: "User", IsActive: true, CreatedAt: "2026-02-01T00:00:00.000Z" },
];

function renderPage() {
  apiClient.get.mockResolvedValue({ data: USERS });
  apiClient.post.mockResolvedValue({ data: {} });
  apiClient.patch.mockResolvedValue({ data: {} });
  apiClient.delete.mockResolvedValue({ data: {} });
  return render(
    <MemoryRouter>
      <UserAdmin />
    </MemoryRouter>,
  );
}

describe("UserAdmin", () => {
  beforeEach(() => jest.clearAllMocks());

  it("lists users and disables self-destructive actions on the current user", async () => {
    renderPage();
    const bobRow = (await screen.findByText("bob@gtek.dev")).closest("tr");
    expect(within(bobRow).getByText("Active")).toBeInTheDocument();
    const adminRow = screen.getByText("admin@gtek.dev", { selector: "td" }).closest("tr");
    expect(within(adminRow).getByRole("button", { name: "Deactivate" })).toBeDisabled();
    expect(within(adminRow).getByRole("button", { name: "Change Role" })).toBeDisabled();
  });

  it("creates a user", async () => {
    renderPage();
    await screen.findByText("bob@gtek.dev");
    await userEvent.type(screen.getByLabelText("Email"), "new@gtek.dev");
    await userEvent.type(screen.getByLabelText("Password"), "password123");
    await userEvent.selectOptions(screen.getByLabelText("Role"), "Admin");
    await userEvent.click(screen.getByRole("button", { name: "Create User" }));
    expect(apiClient.post).toHaveBeenCalledWith("/users", {
      Email: "new@gtek.dev",
      Password: "password123",
      Role: "Admin",
    });
  });

  it("resets a password, changes a role and deactivates", async () => {
    renderPage();
    const bobRow = (await screen.findByText("bob@gtek.dev")).closest("tr");

    await userEvent.click(within(bobRow).getByRole("button", { name: "Reset Password" }));
    await userEvent.type(screen.getByLabelText("New password"), "brandnew123");
    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(apiClient.patch).toHaveBeenCalledWith("/users/2/password", { Password: "brandnew123" });

    await userEvent.click(await within(bobRow).findByRole("button", { name: "Change Role" }));
    await userEvent.selectOptions(screen.getByLabelText("New role"), "Admin");
    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(apiClient.patch).toHaveBeenCalledWith("/users/2/role", { Role: "Admin" });

    await userEvent.click(await within(bobRow).findByRole("button", { name: "Deactivate" }));
    expect(apiClient.delete).toHaveBeenCalledWith("/users/2");
  });
});
