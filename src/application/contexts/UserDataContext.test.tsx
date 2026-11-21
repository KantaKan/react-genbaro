import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getAuthToken } from "../../infrastructure/storage";
import { userService } from "../services/userService";
import UserDataProvider, { useUserData } from "./UserDataContext";

vi.mock("../../infrastructure/storage", () => ({ getAuthToken: vi.fn() }));
vi.mock("../services/userService", () => ({ userService: { getUserById: vi.fn() } }));

function StateProbe() {
  const { loading, error, userData } = useUserData();
  return <div>{loading ? "loading" : error ?? (userData ? "ready" : "anonymous")}</div>;
}

describe("UserDataProvider", () => {
  beforeEach(() => {
    vi.mocked(getAuthToken).mockReturnValue(undefined);
    vi.mocked(userService.getUserById).mockReset();
  });

  it("stays anonymous without fetching or logging an authentication error when no token exists", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
    render(<UserDataProvider><StateProbe /></UserDataProvider>);

    await waitFor(() => expect(screen.getByText("anonymous")).toBeInTheDocument());
    expect(userService.getUserById).not.toHaveBeenCalled();
    expect(consoleError).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });
});
