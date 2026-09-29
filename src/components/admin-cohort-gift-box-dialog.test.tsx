import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { giftBoxService } from "@/application/services/giftBoxService";
import { AdminCohortGiftBoxDialog } from "./admin-cohort-gift-box-dialog";

vi.mock("@/application/services/cosmeticService", () => ({ cosmeticService: { getCatalog: vi.fn().mockResolvedValue([
  { id: "pot:starlight", name: "Starlight Pot", slot: "pot", rarity: "Rare", preview_value: "starlight", reward_pools: ["teacher-box"], starter: false },
]) } }));
vi.mock("@/application/services/characterCosmeticService", () => ({ characterCosmeticService: { catalog: vi.fn().mockResolvedValue([
  { id: "character_prop:halo", name: "Halo", slot: "character_prop", rarity: "Rare", preview_value: "halo", reward_pools: ["character-box"], starter: false },
]) } }));
vi.mock("@/application/services/giftBoxService", () => ({ giftBoxService: {
  previewAudience: vi.fn().mockImplementation(async (_cohort: number, team: string) => ({ cohort: 16, team, total: team ? 5 : 24 })),
  grantAudience: vi.fn().mockResolvedValue({ total: 5, created: 4, existing: 0, failures: [{ user_id: "retry-me", error: "temporary" }] }),
} }));
vi.mock("@/components/streak-components", () => ({ SeedlingPlant: () => <div aria-label="2D plant preview" /> }));
vi.mock("@/components/farm/GenmateField", () => ({ GenmateField: () => <div aria-label="3D plant preview" /> }));

describe("AdminCohortGiftBoxDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("crypto", { randomUUID: () => "batch-16" });
  });

  const openDialog = () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(<QueryClientProvider client={client}><AdminCohortGiftBoxDialog cohort={16} learnerCount={24} teams={["Garden Alpha"]} /></QueryClientProvider>);
    fireEvent.click(screen.getByRole("button", { name: /gift boxes/i }));
  };

  it("previews a team's server count and retries the same character batch", async () => {
    openDialog();
    fireEvent.click(screen.getByLabelText("Gift box recipients"));
    fireEvent.click(screen.getByRole("option", { name: /Garden Alpha/i }));
    expect(await screen.findByText(/5 active learners in Garden Alpha/)).toBeInTheDocument();
    expect(await screen.findByText("Halo")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Message to every learner"), { target: { value: "A strong sprint together." } });
    fireEvent.click(screen.getByRole("button", { name: /send 5 gift boxes/i }));
    await waitFor(() => expect(giftBoxService.grantAudience).toHaveBeenCalledWith(16, "Garden Alpha", "Rare", "A strong sprint together.", "batch-16", "character-box"));
    expect(await screen.findByText(/4 created/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /retry failed grants/i }));
    await waitFor(() => expect(giftBoxService.grantAudience).toHaveBeenCalledTimes(2));
    expect(giftBoxService.grantAudience).toHaveBeenNthCalledWith(2, 16, "Garden Alpha", "Rare", "A strong sprint together.", "batch-16", "character-box");
  });

  it("keeps the garden collection and full-cohort scope available", async () => {
    openDialog();
    expect(await screen.findByText(/24 active learners in Cohort 16/)).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText("Gift box collection"));
    fireEvent.click(screen.getByRole("option", { name: "Garden" }));
    expect(await screen.findByText("Starlight Pot")).toBeInTheDocument();
    expect(screen.getByLabelText("2D plant preview")).toBeInTheDocument();
    expect(await screen.findByLabelText("3D plant preview")).toBeInTheDocument();
  });
});
