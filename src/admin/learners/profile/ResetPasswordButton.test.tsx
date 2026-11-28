import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ResetPasswordButton } from "./ResetPasswordButton";
import { adminApi } from "../../api";

vi.mock("../../api", () => ({ adminApi: { resetPassword: vi.fn().mockResolvedValue("Kx7mPq2RtA") } }));

describe("ResetPasswordButton", () => {
  it("confirms, resets, and shows the temporary password once", async () => {
    render(<ResetPasswordButton userId="u1" name="Fern" />);
    fireEvent.click(screen.getByRole("button", { name: "Reset password" }));
    expect(screen.getByText(/Reset Fern's password\?/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Reset" }));
    expect(await screen.findByText("Kx7mPq2RtA")).toBeInTheDocument();
    expect(adminApi.resetPassword).toHaveBeenCalledWith("u1");
    expect(screen.getByRole("button", { name: "Copy" })).toBeInTheDocument();
  });
});
