import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AccountDialog from "./AccountDialog";
import { PreferencesProvider } from "../context/PreferencesContext";
import apiClient from "../api/client";

const mockApplyProfile = jest.fn();
const mockClose = jest.fn();

jest.mock("../api/client", () => ({
  __esModule: true,
  default: { get: jest.fn(), patch: jest.fn() },
}));

jest.mock("../context/AuthContext", () => ({
  useAuth: () => ({
    user: { id: 1, email: "ada@gtek.dev", role: "Admin", displayName: null },
    applyProfile: mockApplyProfile,
  }),
}));

function renderProfile() {
  return render(
    <PreferencesProvider>
      <AccountDialog onClose={mockClose} />
    </PreferencesProvider>,
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
  apiClient.get.mockResolvedValue({
    data: { Email: "ada@gtek.dev", DisplayName: null, CreatedAt: "2026-01-02T00:00:00.000Z" },
  });
});

describe("AccountDialog", () => {
  it("saves the display name and email, then refreshes the shared profile", async () => {
    const saved = { Email: "ada@gtek.dev", DisplayName: "Ada Perera" };
    apiClient.patch.mockResolvedValue({ data: saved });
    renderProfile();

    const name = await screen.findByLabelText("Display name");
    await userEvent.type(name, "Ada Perera");
    await userEvent.click(screen.getByRole("button", { name: /save changes/i }));

    expect(apiClient.patch).toHaveBeenCalledWith("/users/me", { DisplayName: "Ada Perera", Email: "ada@gtek.dev" });
    expect(await screen.findByText("Profile updated.")).toBeInTheDocument();
    expect(mockApplyProfile).toHaveBeenCalledWith(saved);
  });

  it("shows the server error when the email is already taken", async () => {
    apiClient.patch.mockRejectedValue(new Error("User already exists"));
    renderProfile();

    await userEvent.click(await screen.findByRole("button", { name: /save changes/i }));
    expect(await screen.findByText("User already exists")).toBeInTheDocument();
  });

  it("refuses mismatched new passwords without calling the API", async () => {
    renderProfile();

    await userEvent.type(await screen.findByLabelText("Current password"), "oldpassword1");
    await userEvent.type(screen.getByLabelText("New password"), "newpassword1");
    await userEvent.type(screen.getByLabelText("Confirm new password"), "different123");
    await userEvent.click(screen.getByRole("button", { name: /update password/i }));

    expect(await screen.findByText("The new passwords do not match.")).toBeInTheDocument();
    expect(apiClient.patch).not.toHaveBeenCalled();
  });

  it("changes the password using the current one", async () => {
    apiClient.patch.mockResolvedValue({ data: {} });
    renderProfile();

    await userEvent.type(await screen.findByLabelText("Current password"), "oldpassword1");
    await userEvent.type(screen.getByLabelText("New password"), "newpassword1");
    await userEvent.type(screen.getByLabelText("Confirm new password"), "newpassword1");
    await userEvent.click(screen.getByRole("button", { name: /update password/i }));

    expect(apiClient.patch).toHaveBeenCalledWith("/users/me/password", {
      CurrentPassword: "oldpassword1",
      NewPassword: "newpassword1",
    });
    expect(await screen.findByText("Password changed.")).toBeInTheDocument();
  });

  it("switches the theme and remembers it", async () => {
    renderProfile();

    await userEvent.click(await screen.findByRole("radio", { name: /dark/i }));

    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
    expect(JSON.parse(localStorage.getItem("gtek_prefs")).theme).toBe("dark");
  });

  it("closes on Escape", async () => {
    renderProfile();
    await screen.findByRole("dialog");

    await userEvent.keyboard("{Escape}");
    expect(mockClose).toHaveBeenCalled();
  });
});
