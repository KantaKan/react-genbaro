import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "react-query";
import { describe, expect, it, vi } from "vitest";
import { cosmeticService } from "@/application/services/cosmeticService";
import { AdminCosmeticGrantDialog } from "./admin-cosmetic-grant-dialog";

vi.mock("@/application/services/cosmeticService", () => ({
  cosmeticService: {
    getAdminCollection: vi.fn().mockResolvedValue({
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
          owned: false,
          new: false,
          equipped: false,
          locked: true,
        },
        {
          id: "accessory:ribbon",
          name: "Garden Ribbon",
          slot: "accessory",
          rarity: "Rare",
          preview_value: "ribbon",
          source_hint: "Teacher Gift Boxes",
          reward_pools: ["teacher-box"],
          starter: false,
          owned: true,
          new: false,
          equipped: false,
          locked: false,
        },
      ],
    }),
    grantExact: vi.fn().mockResolvedValue({ granted: true }),
    revoke: vi.fn().mockResolvedValue({ revoked: true }),
  },
}));

vi.mock("@/components/streak-components", () => ({
  SeedlingPlant: () => <div aria-label="Plant preview" />,
}));

function renderDialog() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={queryClient}>
      <AdminCosmeticGrantDialog userId="learner-1" learnerName="Mali Dee" />
    </QueryClientProvider>,
  );
}

describe("AdminCosmeticGrantDialog", () => {
  it("searches, previews, and grants an eligible collectible with a message", async () => {
    renderDialog();
    fireEvent.click(screen.getByRole("button", { name: /garden gift/i }));

    expect(await screen.findByText("Ocean")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Search collectibles"), { target: { value: "reflection" } });
    expect(screen.queryByText("Garden Ribbon")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /ocean/i }));
    fireEvent.change(screen.getByLabelText("Message to learner"), {
      target: { value: "A thoughtful reflection deserves a new color." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Grant collectible" }));

    await waitFor(() => {
      expect(cosmeticService.grantExact).toHaveBeenCalledWith(
        "learner-1",
        "palette:ocean",
        "A thoughtful reflection deserves a new color.",
      );
    });
  });

  it("allows corrective revocation only for an owned item", async () => {
    renderDialog();
    fireEvent.click(screen.getByRole("button", { name: /garden gift/i }));

    fireEvent.click(await screen.findByRole("button", { name: /garden ribbon/i }));
    const revokeButton = screen.getByRole("button", { name: /revoke owned item/i });
    expect(revokeButton).toBeEnabled();
    fireEvent.click(revokeButton);

    await waitFor(() => {
      expect(cosmeticService.revoke).toHaveBeenCalledWith("learner-1", "accessory:ribbon");
    });
  });
});
