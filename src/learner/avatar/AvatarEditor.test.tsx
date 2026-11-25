import { describe, it, expect, vi, beforeEach, onTestFinished } from "vitest";
import { render, screen, fireEvent, waitFor, within, act } from "@testing-library/react";
import { AvatarEditor } from "./AvatarEditor";
import { learnerApi, LearnerApiError } from "../api";
import { toast } from "sonner";

vi.mock("@blobatar/react/gaze", () => ({ useGaze: () => ({ ref: vi.fn() }) }));
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));
vi.mock("../api", async (orig) => {
  const real = await orig<typeof import("../api")>();
  return { ...real, learnerApi: { ...real.learnerApi, savePreferences: vi.fn().mockResolvedValue({}) } };
});

const open = (onOpenChange = vi.fn(), onSaved = vi.fn()) =>
  render(<AvatarEditor open onOpenChange={onOpenChange} onSaved={onSaved} current={null} seed="u1" name="Black" streak={12} />);

describe("AvatarEditor", () => {
  beforeEach(() => vi.mocked(learnerApi.savePreferences).mockReset().mockResolvedValue({}));

  it("saves Blobatar", async () => {
    const onSaved = vi.fn();
    open(vi.fn(), onSaved);
    fireEvent.click(screen.getByRole("button", { name: "Style: Blobatar" }));
    fireEvent.click(screen.getByRole("button", { name: "Save avatar" }));
    await waitFor(() => expect(learnerApi.savePreferences).toHaveBeenCalledWith({ avatar: expect.objectContaining({ style: "blobatar" }) }));
    expect(onSaved).toHaveBeenCalled();
  });

  it("saves a picked hair style", async () => {
    open();
    fireEvent.click(screen.getByRole("button", { name: "Style: Sketch" }));
    fireEvent.click(screen.getByRole("button", { name: "hair variant10" }));
    fireEvent.click(screen.getByRole("button", { name: "Save avatar" }));
    await waitFor(() => expect(learnerApi.savePreferences).toHaveBeenCalled());
    const arg = vi.mocked(learnerApi.savePreferences).mock.calls[0][0] as { avatar: { options: Record<string, Record<string, string>> } };
    expect(arg.avatar.options.notionists.hair).toBe("variant10");
  });

  it("locked items show the streak needed and can't be picked", () => {
    open();
    fireEvent.click(screen.getByRole("button", { name: "Style: Sketch" }));
    fireEvent.click(screen.getByRole("tab", { name: "Outfit" }));
    const galaxy = screen.getByRole("button", { name: "bodyIcon galaxy" });
    expect(within(galaxy).getByText("30-day streak")).toBeInTheDocument();
    fireEvent.click(galaxy);
    expect(galaxy).toHaveAttribute("aria-pressed", "false");
  });

  it("a rejected save keeps the editor open", async () => {
    const onOpenChange = vi.fn();
    const real = learnerApi.savePreferences;
    // a plain (non-mock) rejecting function: vitest 4 reports errors thrown from mocks even when caught
    (learnerApi as { savePreferences: unknown }).savePreferences = () => Promise.reject(new LearnerApiError(403, "Locked: keep your streak going"));
    onTestFinished(() => void ((learnerApi as { savePreferences: unknown }).savePreferences = real));
    open(onOpenChange);
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Save avatar" }));
    });
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Locked: keep your streak going"));
    expect(onOpenChange).not.toHaveBeenCalledWith(false);
  });
});
