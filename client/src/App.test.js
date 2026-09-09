import { render, screen, waitFor } from "@testing-library/react";
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

test("renders the connectivity dashboard once authenticated", async () => {
  localStorage.setItem(
    TOKEN_STORAGE_KEY,
    makeFakeToken({ sub: 1, email: "admin@gtek.dev", role: "Admin" }),
  );
  apiClient.get.mockImplementation((url) => {
    if (url === "/") return Promise.resolve({ data: "Backend is running" });
    if (url === "/db-test") return Promise.resolve({ data: [{ test: 1 }] });
    return Promise.reject(new Error(`unexpected url: ${url}`));
  });

  render(<App />);

  expect(
    await screen.findByRole("heading", { name: /system connectivity check/i }),
  ).toBeInTheDocument();

  await waitFor(() => {
    expect(screen.getAllByText("Connected")).toHaveLength(2);
  });
  expect(screen.getByText(/\[{"test":1}\]/)).toBeInTheDocument();
});

test("shows a failed status when the health checks reject", async () => {
  localStorage.setItem(
    TOKEN_STORAGE_KEY,
    makeFakeToken({ sub: 1, email: "admin@gtek.dev", role: "Admin" }),
  );
  apiClient.get.mockRejectedValue(new Error("network error"));

  render(<App />);

  await waitFor(() => {
    expect(screen.getAllByText("Failed")).toHaveLength(2);
  });
});
