import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ChangePasswordForm } from "./ChangePasswordForm";
import { authService } from "@/application/services/authService";

vi.mock("@/application/services/authService", () => ({ authService: { changePassword: vi.fn() } }));

const fill = (cur: string, next: string, again: string) => {
  fireEvent.change(screen.getByLabelText("รหัสผ่านปัจจุบัน"), { target: { value: cur } });
  fireEvent.change(screen.getByLabelText("รหัสผ่านใหม่"), { target: { value: next } });
  fireEvent.change(screen.getByLabelText("ยืนยันรหัสผ่านใหม่"), { target: { value: again } });
};

describe("ChangePasswordForm", () => {
  beforeEach(() => {
    vi.mocked(authService.changePassword).mockReset();
  });

  it("blocks submit until the new password is confirmed", () => {
    render(<ChangePasswordForm onDone={vi.fn()} />);
    fill("TEMPpass23", "mynewpass1", "mynewpass2");
    expect(screen.getByRole("button", { name: "บันทึกรหัสผ่าน" })).toBeDisabled();
    expect(screen.getByText("รหัสผ่านใหม่สองช่องไม่ตรงกัน")).toBeInTheDocument();
  });

  it("saves and calls onDone", async () => {
    vi.mocked(authService.changePassword).mockResolvedValue(undefined);
    const onDone = vi.fn();
    render(<ChangePasswordForm onDone={onDone} />);
    fill("TEMPpass23", "mynewpass1", "mynewpass1");
    fireEvent.click(screen.getByRole("button", { name: "บันทึกรหัสผ่าน" }));
    await waitFor(() => expect(onDone).toHaveBeenCalled());
    expect(authService.changePassword).toHaveBeenCalledWith("TEMPpass23", "mynewpass1");
  });

  it("shows the server's reason", async () => {
    vi.mocked(authService.changePassword).mockRejectedValue(new Error("current password is wrong"));
    render(<ChangePasswordForm onDone={vi.fn()} />);
    fill("nope", "mynewpass1", "mynewpass1");
    fireEvent.click(screen.getByRole("button", { name: "บันทึกรหัสผ่าน" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("current password is wrong");
  });
});
