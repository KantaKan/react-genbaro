import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "react-query";
import { describe, expect, it, vi } from "vitest";
import { giftBoxService } from "@/application/services/giftBoxService";
import { AdminCohortGiftBoxDialog } from "./admin-cohort-gift-box-dialog";

vi.mock("@/application/services/cosmeticService", () => ({ cosmeticService: { getCatalog: vi.fn().mockResolvedValue([
  { id: "pot:starlight", name: "Starlight Pot", slot: "pot", rarity: "Rare", preview_value: "starlight", source_hint: "Teacher Gift Boxes", reward_pools: ["teacher-box"], starter: false },
  { id: "pot:crystal", name: "Crystal Pot", slot: "pot", rarity: "Legendary", preview_value: "crystal", source_hint: "Teacher Gift Boxes", reward_pools: ["teacher-box"], starter: false },
]) } }));
vi.mock("@/application/services/giftBoxService", () => ({ giftBoxService: { grantCohort: vi.fn().mockResolvedValue({ total: 24, created: 24, existing: 0, failures: [] }) } }));
vi.mock("@/components/streak-components", () => ({ SeedlingPlant: () => <div aria-label="2D plant preview" /> }));
vi.mock("@/components/farm/GenmateField", () => ({ GenmateField: () => <div aria-label="3D plant preview" /> }));

describe("AdminCohortGiftBoxDialog", () => {
  it("previews the eligible pool in both renderers and grants the cohort", async () => {
    vi.stubGlobal("crypto", { randomUUID: () => "batch-16" });
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(<QueryClientProvider client={client}><AdminCohortGiftBoxDialog cohort={16} learnerCount={24} /></QueryClientProvider>);

    fireEvent.click(screen.getByRole("button", { name: /gift cohort/i }));
    expect(await screen.findByText("Starlight Pot")).toBeInTheDocument();
    expect(screen.getByLabelText("2D plant preview")).toBeInTheDocument();
    expect(await screen.findByLabelText("3D plant preview")).toBeInTheDocument();
    expect(screen.getByText(/Rare 66.7%/)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Message to every learner"), { target: { value: "A strong sprint together." } });
    fireEvent.click(screen.getByRole("button", { name: /send 24 gift boxes/i }));

    await waitFor(() => expect(giftBoxService.grantCohort).toHaveBeenCalledWith(16, "Rare", "A strong sprint together.", "batch-16"));
    expect(await screen.findByText(/24 created/)).toBeInTheDocument();
    vi.unstubAllGlobals();
  });
});
