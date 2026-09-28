import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "react-query";
import { describe, expect, it, vi } from "vitest";
import { giftBoxService } from "@/application/services/giftBoxService";
import { cosmeticService } from "@/application/services/cosmeticService";
import { TeacherGiftBoxesDialog } from "./teacher-gift-boxes-dialog";

vi.mock("@/application/services/giftBoxService", () => ({
  giftBoxService: {
    list: vi.fn().mockResolvedValue([
      {
        id: "box-1",
        user_id: "learner-1",
        minimum_rarity: "Rare",
        message: "You kept showing up with curiosity.",
        granted_by: "admin-1",
        status: "unopened",
        created_at: "2026-09-28T00:00:00Z",
      },
    ]),
    open: vi.fn().mockResolvedValue({
      idempotency_key: "box-1",
      user_id: "learner-1",
      pool: "teacher-box",
      minimum_rarity: "Rare",
      item: { id: "pot:starlight", name: "Starlight Pot", slot: "pot", rarity: "Rare", preview_value: "starlight", source_hint: "Teacher Gift Boxes", reward_pools: ["teacher-box"], starter: false },
      created_at: "2026-09-28T00:01:00Z",
    }),
  },
}));

vi.mock("@/application/services/cosmeticService", () => ({
  cosmeticService: { equip: vi.fn().mockResolvedValue(undefined) },
}));

describe("TeacherGiftBoxesDialog", () => {
  it("shows the teacher message and reveals the recorded collectible", async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(<QueryClientProvider client={client}><TeacherGiftBoxesDialog /></QueryClientProvider>);

    fireEvent.click(screen.getByRole("button", { name: /gift boxes/i }));
    expect(await screen.findByText(/you kept showing up with curiosity/i)).toBeInTheDocument();
    expect(screen.getByText("Rare or better")).toBeInTheDocument();
    expect(screen.getByText(/Rare 66.7% · Epic 26.7% · Legendary 6.6%/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /open this gift/i }));

    await waitFor(() => expect(giftBoxService.open).toHaveBeenCalledWith("box-1"));
    expect(await screen.findByText("Starlight Pot")).toBeInTheDocument();
    expect(screen.getByText("New permanent collectible")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /equip now/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /view collection/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /later/i })).toBeInTheDocument();
  });

  it("lets the learner equip the revealed collectible immediately", async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(<QueryClientProvider client={client}><TeacherGiftBoxesDialog /></QueryClientProvider>);

    fireEvent.click(screen.getByRole("button", { name: /gift boxes/i }));
    fireEvent.click(await screen.findByRole("button", { name: /open this gift/i }));
    fireEvent.click(await screen.findByRole("button", { name: /equip now/i }));

    await waitFor(() => expect(cosmeticService.equip).toHaveBeenCalledWith("pot", "pot:starlight"));
  });
});
