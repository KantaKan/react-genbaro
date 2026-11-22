import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "react-query";
import { InvitePage } from "./InvitePage";
import { inviteApi } from "./api";

vi.mock("sonner", () => ({ toast: Object.assign(vi.fn(), { error: vi.fn(), success: vi.fn() }) }));
vi.mock("./api", async (o) => ({ ...(await o<object>()), inviteApi: { get: vi.fn(), accept: vi.fn() } }));

const page = () =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <MemoryRouter initialEntries={["/invite/tok123456789012345678901"]}>
        <Routes>
          <Route path="/invite/:token" element={<InvitePage />} />
          <Route path="/login" element={<p>login page</p>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );

describe("InvitePage", () => {
  beforeEach(() => vi.mocked(inviteApi.accept).mockReset().mockResolvedValue(undefined));

  it("creates a new account once, then goes to login", async () => {
    vi.mocked(inviteApi.get).mockResolvedValue({ email: "mint@x.co", role: "ta", cohorts: [13], existing: false, expires_at: "" });
    page();
    expect(await screen.findByText(/as TA · JSD13/)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("First name"), { target: { value: "Mint" } });
    fireEvent.change(screen.getByLabelText("Last name"), { target: { value: "S" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "longenough" } });
    fireEvent.change(screen.getByLabelText("Confirm password"), { target: { value: "longenoug" } });
    const go = screen.getByRole("button", { name: "Join Baro" });
    expect(go).toBeDisabled();
    fireEvent.change(screen.getByLabelText("Confirm password"), { target: { value: "longenough" } });
    fireEvent.click(go);
    fireEvent.click(go);
    await waitFor(() => expect(inviteApi.accept).toHaveBeenCalledTimes(1));
    expect(inviteApi.accept).toHaveBeenCalledWith("tok123456789012345678901", { first_name: "Mint", last_name: "S", password: "longenough" });
    expect(await screen.findByText("login page")).toBeInTheDocument();
  });

  it("asks only for the current password when the account exists", async () => {
    vi.mocked(inviteApi.get).mockResolvedValue({ email: "fah@x.co", role: "admin", cohorts: [13], existing: true, expires_at: "" });
    page();
    expect(await screen.findByLabelText("Your current password")).toBeInTheDocument();
    expect(screen.queryByLabelText("First name")).toBeNull();
  });

  it("explains a dead link", async () => {
    vi.mocked(inviteApi.get).mockImplementation(() => Promise.reject(new Error("404")));
    page();
    expect(await screen.findByText(/expired or was already used/)).toBeInTheDocument();
  });
});
