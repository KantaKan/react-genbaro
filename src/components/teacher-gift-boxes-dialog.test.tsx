import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "react-query";
import { afterEach, describe, expect, it, vi } from "vitest";
import { giftBoxService } from "@/application/services/giftBoxService";
import { cosmeticService } from "@/application/services/cosmeticService";
import { characterCosmeticService } from "@/application/services/characterCosmeticService";
import { baroCharacterService } from "@/application/services/baroCharacterService";
import { CharacterEggReveal, TeacherGiftBoxesDialog } from "./teacher-gift-boxes-dialog";

const eggCharacter = {
  id: "egg-character-1", owner_id: "learner-1", serial: "B-EGG-ONE",
  dna: { version: 1 as const, body: "bean", ears: "cat", eyes: "dots", mark: "star", palette: "Mint", pattern: "ramen", pattern_seed: 42, rarity: "meme_rare" as const },
  fingerprint: "fingerprint-1", source: "character_egg", origin_key: "character-egg:egg-1", is_starter: false, created_at: "2026-09-30T00:01:00Z",
};

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
        source: "achievement",
        created_at: "2026-09-28T00:00:00Z",
      },
    ]),
    open: vi.fn().mockResolvedValue({
      kind: "cosmetic",
      idempotency_key: "box-1",
      user_id: "learner-1",
      pool: "teacher-box",
      minimum_rarity: "Rare",
      item: { id: "pot:starlight", name: "Starlight Pot", slot: "pot", rarity: "Rare", preview_value: "starlight", source_hint: "Teacher Gift Boxes", reward_pools: ["teacher-box"], starter: false },
      created_at: "2026-09-28T00:01:00Z",
    }),
    odds: vi.fn().mockResolvedValue({ eligible_count: 3, odds: { Rare: 30 / 45, Epic: 12 / 45, Legendary: 3 / 45 }, complete: false }),
    recipients: vi.fn().mockResolvedValue([{ id: "friend-1", display_name: "Mali", cohort_number: 17, group: "B", role: "learner" }]),
    transfer: vi.fn().mockResolvedValue({ id: "box-1", user_id: "friend-1", status: "unopened" }),
  },
}));

vi.mock("@/application/services/cosmeticService", () => ({
  cosmeticService: { equip: vi.fn().mockResolvedValue(undefined) },
}));
vi.mock("@/application/services/characterCosmeticService", () => ({
  characterCosmeticService: { equip: vi.fn().mockResolvedValue(undefined) },
}));
vi.mock("@/application/services/baroCharacterService", () => ({
  baroCharacterService: { equip: vi.fn().mockResolvedValue({ equipped_id: "egg-character-1", pinned_id: "starter-1" }) },
}));

afterEach(() => {
  vi.clearAllMocks();
  vi.mocked(giftBoxService.odds).mockResolvedValue({ eligible_count: 3, odds: { Rare: 30 / 45, Epic: 12 / 45, Legendary: 3 / 45 }, complete: false });
});

describe("TeacherGiftBoxesDialog", () => {
  it("shows the teacher message and reveals the recorded collectible", async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(<QueryClientProvider client={client}><TeacherGiftBoxesDialog /></QueryClientProvider>);

    fireEvent.click(screen.getByRole("button", { name: /gift boxes/i }));
    expect(await screen.findByText(/you kept showing up with curiosity/i)).toBeInTheDocument();
    expect(screen.getByText("Rare or better")).toBeInTheDocument();
    expect(screen.getByText("Achievement unlocked")).toBeInTheDocument();
    expect(await screen.findByText(/Rare 66.7% · Epic 26.7% · Legendary 6.7%/)).toBeInTheDocument();
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

  it("shows current character odds and equips a character prop", async () => {
    vi.mocked(giftBoxService.list).mockResolvedValueOnce([{
      id: "character-box-1", user_id: "learner-1", minimum_rarity: "Rare", message: "For your creativity", granted_by: "admin-1", status: "unopened", reward_pool: "character-box", created_at: "2026-09-28T00:00:00Z",
    }]);
    vi.mocked(giftBoxService.odds).mockResolvedValue({ eligible_count: 1, odds: { Legendary: 1 }, complete: false });
    vi.mocked(giftBoxService.open).mockResolvedValueOnce({
      kind: "cosmetic",
      idempotency_key: "character-box-1", user_id: "learner-1", pool: "character-box", minimum_rarity: "Rare",
      item: { id: "character_prop:halo", name: "Tiny Halo", slot: "character_prop", rarity: "Legendary", preview_value: "halo", source_hint: "Teacher Gift Boxes", reward_pools: ["character-box"], starter: false },
      created_at: "2026-09-28T00:01:00Z",
    });
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(<QueryClientProvider client={client}><TeacherGiftBoxesDialog /></QueryClientProvider>);
    fireEvent.click(screen.getByRole("button", { name: /gift boxes/i }));
    expect(await screen.findByText(/Legendary 100%/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /open this gift/i }));
    expect(await screen.findByText("Tiny Halo")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /equip now/i }));
    await waitFor(() => expect(characterCosmeticService.equip).toHaveBeenCalledWith("character_prop", "character_prop:halo"));
    expect(cosmeticService.equip).not.toHaveBeenCalled();
  });

  it("hatches a Character Egg through readable reveal stages and keeps it without changing selection", async () => {
    vi.mocked(giftBoxService.list).mockResolvedValueOnce([{
      id: "egg-1", user_id: "learner-1", minimum_rarity: "Common", message: "A new friend is waiting", granted_by: "admin-1", status: "unopened", reward_pool: "character-egg", created_at: "2026-09-30T00:00:00Z",
    }]);
    vi.mocked(giftBoxService.odds).mockResolvedValueOnce({ eligible_count: 1, odds: { Normal: 0.83, "Meme Rare": 0.15, Legendary: 0.02 }, complete: false });
    vi.mocked(giftBoxService.open).mockResolvedValueOnce({
      kind: "character",
      character: eggCharacter,
    });
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(<QueryClientProvider client={client}><TeacherGiftBoxesDialog /></QueryClientProvider>);

    fireEvent.click(screen.getByRole("button", { name: /gift boxes/i }));
    expect(await screen.findByText(/Standard Character Egg/)).toBeInTheDocument();
    expect(screen.getByText(/Normal 83% · Meme Rare 15% · Legendary 2%/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "ฟัก Character Egg" }));
    expect(await screen.findByText("ไข่กำลังสั่น")).toBeInTheDocument();
    expect(await screen.findByText("B-EGG-ONE", {}, { timeout: 3000 })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "เก็บไว้ในสมุด" }));
    expect(baroCharacterService.equip).not.toHaveBeenCalled();
  });

  it("shows the selected Rare Egg tier and its server policy", async () => {
    vi.mocked(giftBoxService.list).mockResolvedValueOnce([{
      id: "egg-rare", user_id: "learner-1", minimum_rarity: "Rare", message: "A rare mystery friend is waiting", granted_by: "admin-1", status: "unopened", reward_pool: "character-egg", created_at: "2026-09-30T00:00:00Z",
    }]);
    vi.mocked(giftBoxService.odds).mockResolvedValueOnce({ eligible_count: 1, odds: { "Meme Rare": 15 / 17, Legendary: 2 / 17 }, complete: false });
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(<QueryClientProvider client={client}><TeacherGiftBoxesDialog /></QueryClientProvider>);
    fireEvent.click(screen.getByRole("button", { name: /gift boxes/i }));
    expect(await screen.findByText(/Rare Character Egg/)).toBeInTheDocument();
    expect(screen.getByText(/Meme Rare 88.2% · Legendary 11.8%/)).toBeInTheDocument();
  });

  it("equips a revealed Egg character only after the learner chooses it", async () => {
    vi.mocked(giftBoxService.list).mockResolvedValueOnce([{
      id: "egg-2", user_id: "learner-1", minimum_rarity: "Common", message: "Meet your friend", granted_by: "admin-1", status: "unopened", reward_pool: "character-egg", created_at: "2026-09-30T00:00:00Z",
    }]);
    vi.mocked(giftBoxService.open).mockResolvedValueOnce({
      kind: "character",
      character: {
        id: "egg-character-2", owner_id: "learner-1", serial: "B-EGG-TWO",
        dna: { version: 1, body: "bean", ears: "cat", eyes: "dots", mark: "star", palette: "Mint", pattern: "ramen", pattern_seed: 43, rarity: "meme_rare" },
        fingerprint: "fingerprint-2", source: "character_egg", origin_key: "character-egg:egg-2", is_starter: false, created_at: "2026-09-30T00:01:00Z",
      },
    });
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(<QueryClientProvider client={client}><TeacherGiftBoxesDialog /></QueryClientProvider>);
    fireEvent.click(screen.getByRole("button", { name: /gift boxes/i }));
    fireEvent.click(await screen.findByRole("button", { name: "ฟัก Character Egg" }));
    expect(await screen.findByText("B-EGG-TWO", {}, { timeout: 3000 })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "ใช้ตัวละครนี้" }));
    await waitFor(() => expect(baroCharacterService.equip).toHaveBeenCalledWith("egg-character-2"));
  });

  it("shows a persisted Egg reveal again after refresh without opening another character", async () => {
    vi.mocked(giftBoxService.list).mockResolvedValueOnce([{
      id: "egg-1", user_id: "learner-1", minimum_rarity: "Common", message: "A new friend is waiting", granted_by: "admin-1", status: "opened", reward_pool: "character-egg", character: eggCharacter, created_at: "2026-09-30T00:00:00Z",
    }]);
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(<QueryClientProvider client={client}><TeacherGiftBoxesDialog /></QueryClientProvider>);
    fireEvent.click(screen.getByRole("button", { name: /gift boxes/i }));
    expect(await screen.findByText("B-EGG-ONE")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "ดูตัวละครอีกครั้ง" }));
    expect(await screen.findByText("B-EGG-ONE", {}, { timeout: 3000 })).toBeInTheDocument();
    expect(giftBoxService.open).not.toHaveBeenCalled();
  });

  it("uses a readable static reveal when reduced motion is requested", () => {
    render(<CharacterEggReveal character={eggCharacter} reducedMotion busy={false} onEquip={vi.fn()} onKeep={vi.fn()} />);
    expect(screen.getByText("B-EGG-ONE")).toBeInTheDocument();
    expect(screen.getByText("ไข่กำลังสั่น")).toBeInTheDocument();
    expect(screen.getByText("เปลือกเริ่มร้าว")).toBeInTheDocument();
    expect(screen.getByText("เห็นเงาคู่หู")).toBeInTheDocument();
    expect(screen.getByText("เจอกันแล้ว!")).toBeInTheDocument();
  });

  it("keeps a complete-pool box unopened", async () => {
    vi.mocked(giftBoxService.odds).mockResolvedValueOnce({ eligible_count: 0, odds: {}, complete: true });
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(<QueryClientProvider client={client}><TeacherGiftBoxesDialog /></QueryClientProvider>);
    fireEvent.click(screen.getByRole("button", { name: /gift boxes/i }));
    expect(await screen.findByText(/This box stays unopened/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /open this gift/i })).toBeDisabled();
    expect(giftBoxService.open).not.toHaveBeenCalled();
  });

  it("searches across cohorts and sends an unopened box to a chosen account", async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(<QueryClientProvider client={client}><TeacherGiftBoxesDialog /></QueryClientProvider>);
    fireEvent.click(screen.getByRole("button", { name: /gift boxes/i }));
    fireEvent.click(await screen.findByRole("button", { name: "ส่งกล่องให้เพื่อน" }));
    fireEvent.change(screen.getByRole("textbox", { name: "ค้นหาคนรับกล่อง" }), { target: { value: "Mali" } });
    expect(await screen.findByRole("button", { name: /Mali/ })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Mali.*รุ่น 17/ }));
    fireEvent.click(screen.getByRole("button", { name: "ส่งให้ Mali" }));
    await waitFor(() => expect(giftBoxService.transfer).toHaveBeenCalledWith("box-1", "friend-1"));
    expect(giftBoxService.open).not.toHaveBeenCalled();
  });

  it("never offers an admin account as a gift recipient", async () => {
    vi.mocked(giftBoxService.recipients).mockResolvedValueOnce([
      { id: "friend-1", display_name: "Mali", cohort_number: 17, group: "B", role: "learner" },
      { id: "admin-1", display_name: "Teacher", cohort_number: 0, group: "", role: "admin" },
    ]);
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(<QueryClientProvider client={client}><TeacherGiftBoxesDialog /></QueryClientProvider>);
    fireEvent.click(screen.getByRole("button", { name: /gift boxes/i }));
    fireEvent.click(await screen.findByRole("button", { name: "ส่งกล่องให้เพื่อน" }));
    fireEvent.change(screen.getByRole("textbox", { name: "ค้นหาคนรับกล่อง" }), { target: { value: "Teacher" } });
    expect(await screen.findByRole("button", { name: /Mali/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Teacher/ })).not.toBeInTheDocument();
  });

  it("shows the journey of a received box", async () => {
    vi.mocked(giftBoxService.list).mockResolvedValueOnce([{
      id: "box-journey", user_id: "learner-1", minimum_rarity: "Rare", message: "Passing this along", granted_by: "teacher-1", status: "unopened", created_at: "2026-09-28T00:00:00Z",
      transfer_history: [{ from_id: "a", from_name: "Pim", to_id: "b", to_name: "Mali", transferred_at: "2026-09-29T00:00:00Z" }],
    }]);
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(<QueryClientProvider client={client}><TeacherGiftBoxesDialog /></QueryClientProvider>);
    fireEvent.click(screen.getByRole("button", { name: /gift boxes/i }));
    fireEvent.click(await screen.findByText(/เส้นทางของกล่อง · 1 ครั้ง/));
    expect(screen.getByText(/Pim → Mali/)).toBeInTheDocument();
  });

  it("keeps the journey visible after the recipient opens the box", async () => {
    vi.mocked(giftBoxService.list).mockResolvedValueOnce([{
      id: "box-opened", user_id: "learner-1", minimum_rarity: "Rare", message: "Passing this along", granted_by: "teacher-1", status: "opened", created_at: "2026-09-28T00:00:00Z",
      reward: { id: "character_prop:flower", name: "Little Flower", slot: "character_prop", rarity: "Rare", preview_value: "flower", source_hint: "Gift", reward_pools: ["character-box"], starter: false },
      transfer_history: [{ from_id: "a", from_name: "Pim", to_id: "b", to_name: "Mali", transferred_at: "2026-09-29T00:00:00Z" }],
    }]);
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(<QueryClientProvider client={client}><TeacherGiftBoxesDialog /></QueryClientProvider>);
    fireEvent.click(screen.getByRole("button", { name: /gift boxes/i }));
    expect(await screen.findByText("Little Flower")).toBeInTheDocument();
    fireEvent.click(screen.getByText(/เส้นทางของกล่อง · 1 ครั้ง/));
    expect(screen.getByText(/Pim → Mali/)).toBeInTheDocument();
  });
});
