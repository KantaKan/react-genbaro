import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "react-query";
import { HttpResponse, http } from "msw";
import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { AdminCharacterDialog } from "./AdminCharacterDialog";

const starter = {
  id: "507f1f77bcf86cd799439011", owner_id: "507f1f77bcf86cd799439012", serial: "B-STARTER",
  dna: { version: 1, body: "bean", ears: "cat", eyes: "dots", mark: "heart", palette: "Mint", pattern: "freckles", pattern_seed: 1, rarity: "normal" },
  fingerprint: "one", source: "starter", is_starter: true, created_at: "2026-09-29T00:00:00Z",
};
const gifted = { ...starter, id: "507f1f77bcf86cd799439013", serial: "B-GIFTED", is_starter: false, source: "admin_grant", fingerprint: "two", dna: { ...starter.dna, palette: "Peach", pattern_seed: 2 } };
let collection = [starter];
let selection = { equipped_id: starter.id, pinned_id: "" };
let grants = 0;
const prop = { id: "character_prop:flower", name: "Little Flower", slot: "character_prop", rarity: "Common", preview_value: "flower", source_hint: "Gift", reward_pools: ["character-box"], starter: false, owned: false, new: false, equipped: false, locked: true };
let cosmeticItems = [prop];
let exactGrants = 0;
const server = setupServer(
  http.get("*/admin/users/:id/character-cosmetics", () => HttpResponse.json({ success: true, data: { items: cosmeticItems } })),
  http.post("*/admin/users/:id/character-cosmetics/:cosmeticId", () => {
    exactGrants += 1;
    cosmeticItems = [{ ...prop, owned: true, locked: false }];
    return HttpResponse.json({ success: true, data: { granted: true } });
  }),
  http.get("*/admin/users/:id/baro-characters", () => HttpResponse.json({ success: true, data: collection })),
  http.get("*/admin/users/:id/baro-characters/selection", () => HttpResponse.json({ success: true, data: selection })),
  http.post("*/admin/users/:id/baro-characters", () => {
    grants += 1;
    collection = [starter, gifted];
    return HttpResponse.json({ success: true, data: gifted });
  }),
  http.put("*/admin/users/:id/baro-characters/equipped", async ({ request }) => {
    const body = await request.json() as { character_id: string };
    selection = { ...selection, equipped_id: body.character_id };
    return HttpResponse.json({ success: true, data: selection });
  }),
  http.put("*/admin/users/:id/baro-characters/pinned", async ({ request }) => {
    const body = await request.json() as { character_id: string };
    selection = { ...selection, pinned_id: body.character_id };
    return HttpResponse.json({ success: true, data: selection });
  }),
);

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => { server.resetHandlers(); collection = [starter]; selection = { equipped_id: starter.id, pinned_id: "" }; grants = 0; cosmeticItems = [prop]; exactGrants = 0; });
afterAll(() => server.close());

describe("AdminCharacterDialog", () => {
  it("grants a distinct character and overrides equipment without moving the lawn pin", async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
    render(<QueryClientProvider client={client}><AdminCharacterDialog userId={starter.owner_id} learnerName="Mali" /></QueryClientProvider>);
    fireEvent.click(screen.getByRole("button", { name: /Baro Character/ }));
    expect(await screen.findByText(starter.serial)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /สุ่มตัวละครให้ Mali/ }));
    expect(await screen.findByText(gifted.serial)).toBeInTheDocument();
    expect(grants).toBe(1);
    fireEvent.click(screen.getByRole("button", { name: `ให้ใช้ ${gifted.serial}` }));
    await waitFor(() => expect(selection.equipped_id).toBe(gifted.id));
    fireEvent.click(screen.getByRole("button", { name: `ปัก ${starter.serial}` }));
    await waitFor(() => expect(selection.pinned_id).toBe(starter.id));
    expect(selection.equipped_id).toBe(gifted.id);
  });

  it("grants an exact character prop without a random draw", async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
    render(<QueryClientProvider client={client}><AdminCharacterDialog userId={starter.owner_id} learnerName="Mali" /></QueryClientProvider>);
    fireEvent.click(screen.getByRole("button", { name: /Baro Character/ }));
    fireEvent.click(await screen.findByRole("button", { name: "แจก Little Flower" }));
    await waitFor(() => expect(exactGrants).toBe(1));
    expect(grants).toBe(0);
    expect(await screen.findByRole("button", { name: "แจก Little Flower" })).toBeDisabled();
  });
});
