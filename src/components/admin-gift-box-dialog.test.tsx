import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { giftBoxService } from "@/application/services/giftBoxService";
import { AdminGiftBoxDialog } from "./admin-gift-box-dialog";

vi.mock("@/application/services/giftBoxService", () => ({
  giftBoxService: { grant: vi.fn().mockResolvedValue({ id: "new-box" }) },
}));

describe("AdminGiftBoxDialog", () => {
  it("lets the admin grant a character box separately from a garden box", async () => {
    render(<AdminGiftBoxDialog userId="learner-1" learnerName="Mali" />);
    fireEvent.click(screen.getByRole("button", { name: "Send Gift Box" }));
    fireEvent.click(screen.getByRole("button", { name: /Baro Character/ }));
    fireEvent.change(screen.getByLabelText("Message to learner"), { target: { value: "For your creative idea" } });
    fireEvent.click(screen.getByRole("button", { name: "Send gift box" }));
    await waitFor(() => expect(giftBoxService.grant).toHaveBeenCalledWith("learner-1", "Rare", "For your creative idea", "character-box"));
  });

  it("lets the admin grant a Standard Character Egg separately from a Style Box", async () => {
    render(<AdminGiftBoxDialog userId="learner-1" learnerName="Mali" />);
    fireEvent.click(screen.getByRole("button", { name: "Send Gift Box" }));
    expect(screen.getByRole("button", { name: /Style Box/ })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Character Egg/ }));
    expect(screen.getByText(/server-owned hatch chances/)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Message to learner"), { target: { value: "A new friend is waiting" } });
    fireEvent.click(screen.getByRole("button", { name: /Send Character Egg/ }));
    await waitFor(() => expect(giftBoxService.grant).toHaveBeenCalledWith("learner-1", "Common", "A new friend is waiting", "character-egg"));
  });

  it("offers Rare and Legendary Eggs from the same individual workflow", async () => {
    render(<AdminGiftBoxDialog userId="learner-1" learnerName="Mali" />);
    fireEvent.click(screen.getByRole("button", { name: "Send Gift Box" }));
    fireEvent.click(screen.getByRole("button", { name: /Character Egg/ }));
    fireEvent.click(screen.getByLabelText("Character Egg tier"));
    fireEvent.click(screen.getByRole("option", { name: /Legendary · guaranteed Legendary/ }));
    fireEvent.change(screen.getByLabelText("Message to learner"), { target: { value: "For a remarkable week" } });
    fireEvent.click(screen.getByRole("button", { name: /Send Character Egg/ }));
    await waitFor(() => expect(giftBoxService.grant).toHaveBeenCalledWith("learner-1", "Legendary", "For a remarkable week", "character-egg"));
  });
});
