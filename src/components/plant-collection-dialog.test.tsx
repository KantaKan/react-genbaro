import { fireEvent, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "react-query";
import { describe, expect, it, vi } from "vitest";
import { PlantCollectionDialog } from "./plant-collection-dialog";

vi.mock("@/application/services/cosmeticService", () => ({
  cosmeticService: {
    getCollection: vi.fn().mockResolvedValue({
      items: [
        {
          id: "palette:ocean",
          name: "Ocean",
          slot: "palette",
          rarity: "Rare",
          preview_value: "Ocean",
          source_hint: "Reflection rewards",
          reward_pools: ["reflection"],
          starter: false,
          owned: true,
          new: true,
          equipped: true,
          locked: false,
        },
        {
          id: "mutation:crystal",
          name: "Crystal Growth",
          slot: "mutation",
          rarity: "Legendary",
          preview_value: "crystal",
          source_hint: "Secret achievements",
          reward_pools: ["achievement"],
          starter: false,
          owned: false,
          new: false,
          equipped: false,
          locked: true,
        },
      ],
    }),
    equip: vi.fn().mockResolvedValue(undefined),
    unequip: vi.fn().mockResolvedValue(undefined),
  },
}));

describe("PlantCollectionDialog", () => {
  it("shows owned, new, equipped, locked, rarity, and source information", async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={queryClient}>
        <PlantCollectionDialog />
      </QueryClientProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: /collection/i }));

    expect(await screen.findByText("Ocean")).toBeInTheDocument();
    expect(screen.getByText("New")).toBeInTheDocument();
    expect(screen.getByText("Equipped")).toBeInTheDocument();
    expect(screen.getByLabelText("Locked")).toBeInTheDocument();
    expect(screen.getByText("Legendary")).toBeInTheDocument();
    expect(screen.getByText("Secret achievements")).toBeInTheDocument();
  });

  it("equips an owned cosmetic through its slot", async () => {
    const { cosmeticService } = await import("@/application/services/cosmeticService");
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={queryClient}>
        <PlantCollectionDialog />
      </QueryClientProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: /collection/i }));
    fireEvent.click(await screen.findByRole("button", { name: "Unequip" }));

    expect(cosmeticService.unequip).toHaveBeenCalledWith("palette");
  });
});
