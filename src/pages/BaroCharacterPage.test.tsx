import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "react-query";
import { MemoryRouter } from "react-router-dom";
import { HttpResponse, http } from "msw";
import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import BaroCharacterPage from "./BaroCharacterPage";

vi.mock("@/application/contexts/AuthContext", () => ({ useAuth: () => ({ userId: "507f1f77bcf86cd799439012" }) }));

const character = {
  id: "507f1f77bcf86cd799439011",
  owner_id: "507f1f77bcf86cd799439012",
  serial: "B-507F1F77BCF86CD799439011",
  dna: {
    version: 1,
    body: "bean",
    ears: "cat",
    eyes: "wide",
    mark: "heart",
    palette: "Mint",
    pattern: "egg",
    pattern_seed: 12345,
    rarity: "meme_rare",
  },
  fingerprint: "fingerprint-1",
  source: "starter",
  is_starter: true,
  created_at: "2026-09-29T00:00:00Z",
};
const gifted = {
  ...character,
  id: "507f1f77bcf86cd799439013",
  serial: "B-507F1F77BCF86CD799439013",
  dna: { ...character.dna, palette: "Peach", pattern: "ramen", pattern_seed: 67890 },
  fingerprint: "fingerprint-2",
  source: "admin_grant",
  is_starter: false,
};

let collection: typeof character[] = [];
let revealCount = 0;
let selection = { equipped_id: character.id, pinned_id: "" };
const flower = { id: "character_prop:flower", name: "Little Flower", slot: "character_prop", rarity: "Common", preview_value: "flower", source_hint: "Gift", reward_pools: ["character-box"], starter: false, owned: true, new: false, equipped: false, locked: false };
let cosmeticItems = [flower];
let careBalance = 3;
let careCount = 0;
const server = setupServer(
  http.get("*/character-cosmetics/collection", () => HttpResponse.json({ success: true, data: { items: cosmeticItems } })),
  http.put("*/character-cosmetics/equipment/:slot", async ({ request }) => {
    const body = await request.json() as { cosmetic_id: string };
    cosmeticItems = cosmeticItems.map((item) => ({ ...item, equipped: item.id === body.cosmetic_id }));
    return HttpResponse.json({ success: true });
  }),
  http.get("*/baro-characters", () => HttpResponse.json({ status: "success", data: collection })),
  http.get("*/baro-characters/selection", () => HttpResponse.json({ success: true, data: selection })),
  http.put("*/baro-characters/equipped", async ({ request }) => {
    const body = await request.json() as { character_id: string };
    selection = { ...selection, equipped_id: body.character_id };
    return HttpResponse.json({ success: true, data: selection });
  }),
  http.put("*/baro-characters/pinned", async ({ request }) => {
    const body = await request.json() as { character_id: string };
    selection = { ...selection, pinned_id: body.character_id };
    return HttpResponse.json({ success: true, data: selection });
  }),
  http.get("*/baro-characters/growth", () => HttpResponse.json({ status: "success", data: {
    best_streak: 7, current_streak: 0, mood: "resting", form_index: 1, form_name: "playful", detail_index: 4, next_detail_at: 14,
  } })),
  http.post("*/baro-characters/reveal", () => {
    revealCount += 1;
    collection = [character];
    return HttpResponse.json({ status: "success", data: character });
  }),
  http.get("*/users/:id/care-energy", () => HttpResponse.json({ success: true, data: {
    balance: careBalance,
    log: [],
    character_care_count: careCount,
  } })),
  http.post("*/users/:id/care-energy/character-care", () => {
    if (careBalance < 1) return HttpResponse.json({ success: false, message: "Not enough Care Energy" }, { status: 409 });
    careBalance -= 1;
    careCount += 1;
    return HttpResponse.json({ success: true, data: {
      effect: "happy-hop",
      state: {
        balance: careBalance,
        log: [{ kind: "character-care", amount: 1, note: "happy-hop", createdAt: "2026-09-30T00:00:00Z" }],
        character_care_count: careCount,
      },
    } });
  }),
);

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => {
  server.resetHandlers();
  collection = [];
  revealCount = 0;
  selection = { equipped_id: character.id, pinned_id: "" };
  cosmeticItems = [flower];
  careBalance = 3;
  careCount = 0;
});
afterAll(() => server.close());

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(<MemoryRouter><QueryClientProvider client={client}><BaroCharacterPage /></QueryClientProvider></MemoryRouter>);
}

describe("BaroCharacterPage", () => {
  it("discloses odds before an optional reveal and shows the permanent server character afterward", async () => {
    renderPage();
    expect(await screen.findByRole("button", { name: /เปิดตัวละครของฉัน/ })).toBeInTheDocument();
    expect(screen.getByText(/83%/)).toBeInTheDocument();
    expect(screen.getByText(/15%/)).toBeInTheDocument();
    expect(screen.getByText(/2%/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /เปิดตัวละครของฉัน/ }));
    expect(await screen.findByTestId("character-serial")).toHaveTextContent(character.serial);
    expect(screen.getAllByRole("img", { name: /Baro Character/ }).length).toBeGreaterThan(0);
    expect(screen.queryByRole("button", { name: /เปิดตัวละครของฉัน/ })).not.toBeInTheDocument();
    expect(revealCount).toBe(1);
  });

  it("returns to the same character without calling reveal again", async () => {
    collection = [character];
    renderPage();
    expect(await screen.findByTestId("character-serial")).toHaveTextContent(character.serial);
    expect(revealCount).toBe(0);
    expect(await screen.findByText(/ร่างตัวป่วน/)).toBeInTheDocument();
    expect(screen.getByText(/ดีเทลขั้น 4\/10/)).toBeInTheDocument();
    expect(screen.getByText(/กำลังพัก/)).toBeInTheDocument();
  });

  it("offers retry when collection cannot load", async () => {
    server.use(http.get("*/baro-characters", () => HttpResponse.json({ message: "oops" }, { status: 500 })));
    renderPage();
    expect(await screen.findByRole("button", { name: /ลองใหม่/ })).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole("button", { name: /เปิดตัวละครของฉัน/ })).not.toBeInTheDocument());
  });

  it("keeps the equipped character and lawn pin independent in the collection", async () => {
    collection = [character, gifted];
    renderPage();
    expect(await screen.findByText(gifted.serial)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: `ใช้ ${gifted.serial}` }));
    await waitFor(() => expect(selection.equipped_id).toBe(gifted.id));
    fireEvent.click(screen.getByRole("button", { name: `ปัก ${character.serial}` }));
    await waitFor(() => expect(selection.pinned_id).toBe(character.id));
    expect(selection.equipped_id).toBe(gifted.id);
    expect(screen.getAllByText(/ปักบนลาน/).length).toBeGreaterThan(0);
  });

  it("previews an owned prop and equips it without changing character DNA", async () => {
    collection = [character];
    renderPage();
    expect(await screen.findByRole("button", { name: "พรีวิว Little Flower" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "พรีวิว Little Flower" }));
    expect(screen.getByRole("button", { name: "ปิดพรีวิว" })).toBeInTheDocument();
    expect(screen.getAllByRole("img", { name: /Baro Character Mint egg/ }).some((image) => image.getAttribute("data-character-prop") === "flower")).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "ใช้ Little Flower" }));
    await waitFor(() => expect(cosmeticItems[0].equipped).toBe(true));
    expect(screen.getByTestId("character-serial")).toHaveTextContent(character.serial);
    expect(screen.getAllByRole("img", { name: /Baro Character Mint egg/ }).length).toBeGreaterThan(0);
  });

  it("spends one shared Care Energy on play without changing streak growth", async () => {
    collection = [character];
    renderPage();

    expect(await screen.findByLabelText("Care Energy 3")).toBeInTheDocument();
    expect(screen.getByText(/สถิติสูงสุด 7 วันทำงาน · ตอนนี้ 0 วัน/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /เล่นกับคู่หู · ใช้ 1 พลัง/ }));

    expect(await screen.findByLabelText("Care Energy 2")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("เย้!");
    expect(screen.getByText(/สถิติสูงสุด 7 วันทำงาน · ตอนนี้ 0 วัน/)).toBeInTheDocument();
    expect(careBalance).toBe(2);
    expect(careCount).toBe(1);
  });
});
