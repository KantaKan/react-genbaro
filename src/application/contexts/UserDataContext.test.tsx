import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getUserId } from "../../infrastructure/storage";
import { userService } from "../services/userService";
import UserDataProvider, { useUserData } from "./UserDataContext";

vi.mock("../../infrastructure/storage", () => ({ getUserId: vi.fn() }));
vi.mock("../services/userService", () => ({ userService: { getUserById: vi.fn() } }));

function StateProbe() {
  const { loading, error, userData } = useUserData();
  return <div>{loading ? "loading" : error ?? (userData ? "ready" : "anonymous")}</div>;
}

describe("UserDataProvider", () => {
  beforeEach(() => {
    vi.mocked(getUserId).mockReturnValue(undefined);
    vi.mocked(userService.getUserById).mockReset();
  });

  it("stays anonymous without fetching or logging an authentication error when nobody is signed in", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
    render(<UserDataProvider><StateProbe /></UserDataProvider>);

    await waitFor(() => expect(screen.getByText("anonymous")).toBeInTheDocument());
    expect(userService.getUserById).not.toHaveBeenCalled();
    expect(consoleError).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it("loads the signed-in learner by the remembered id (the token itself is an httpOnly cookie)", async () => {
    vi.mocked(getUserId).mockReturnValue("u1");
    vi.mocked(userService.getUserById).mockResolvedValue({ _id: "u1", first_name: "Ploy" } as never);
    render(<UserDataProvider><StateProbe /></UserDataProvider>);
    await waitFor(() => expect(screen.getByText("ready")).toBeInTheDocument());
    expect(userService.getUserById).toHaveBeenCalledWith("u1");
  });
});
