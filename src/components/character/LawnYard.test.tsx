import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ShowcaseEntry } from "@/application/services/showcaseLawnService";
import { planLawn } from "@/lib/lawn-planner";
import { YARD_SCENES } from "@/lib/lawn-scenes";
import { LawnYard, YardScenePicker } from "./LawnYard";

let reducedMotion = false;
vi.mock("framer-motion", async (original) => ({ ...(await original<typeof import("framer-motion")>()), useReducedMotion: () => reducedMotion }));

const entry = (index: number): ShowcaseEntry => ({
  owner_id: `owner-${index}`, name: ["Mali", "Pim", "Nok", "Ton", "Fah", "Beam", "Mew", "Kaew", "Oak", "Ploy", "Tae", "Bank"][index], cohort: 16, team: "Garden Alpha",
  message: `hello ${index}`, updated_at: "2026-09-30T00:00:00Z", prop: index === 0 ? "halo" : undefined, reactions: [{ emoji: "❤️", count: 1, reacted: false }],
  character: { id: `character-${index}`, owner_id: `owner-${index}`, serial: `B-${index}`, fingerprint: `fp-${index}`, source: "starter", is_starter: true, created_at: "2026-09-30T00:00:00Z",
    dna: { version: 1, body: "bean", ears: "cat", eyes: "wide", mark: "heart", palette: "Lilac", pattern: "ramen", pattern_seed: index + 1, rarity: index === 0 ? "legendary" : "normal" } },
});
const entries = Array.from({ length: 12 }, (_, index) => entry(index));
const morning = Date.UTC(2026, 8, 30, 3, 0);

function renderYard(width = 1280, sceneId: keyof typeof YARD_SCENES = "backyard") {
  Object.defineProperty(window, "innerWidth", { configurable: true, value: width });
  vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() })));
  const scene = YARD_SCENES[sceneId];
  const plan = planLawn({ entries, scene, viewerId: "owner-0", now: morning });
  const onReact = vi.fn();
  render(<LawnYard plan={plan} scene={scene} userId="owner-0" lite={false} cardActions={() => ({ admin: false, busy: false, onReact, onModerate: vi.fn(), onInspect: vi.fn() })} />);
  return { plan, onReact };
}

const characterButtons = () => within(screen.getByRole("group", { name: /^เพื่อนบนลานตอนนี้/ })).getAllByRole("button").filter((button) => !button.getAttribute("aria-label")?.startsWith("ลูบแมว"));

afterEach(() => { reducedMotion = false; vi.unstubAllGlobals(); });

describe("LawnYard", () => {
  it("announces every character with their name and what they are doing", () => {
    const { plan } = renderYard();
    for (const placement of plan.placements) {
      expect(screen.getByRole("button", { name: `${placement.entry.name} · ${placement.activity}` })).toHaveAttribute("data-pose", placement.pose);
    }
  });

  it("shows a name tag only on the viewer's own character", () => {
    renderYard();
    expect(screen.getByText("คุณ · Mali")).toBeInTheDocument();
    const pim = screen.getByText("Pim", { selector: "span" });
    expect(pim.className).toContain("opacity-0");
  });

  it("tabs through characters and cats from left to right", () => {
    const { plan } = renderYard();
    const order = within(screen.getByRole("group", { name: /^เพื่อนบนลานตอนนี้/ })).getAllByRole("button").map((button) => button.getAttribute("aria-label"));
    const expected = [...plan.placements.map((placement) => ({ x: placement.spot.x, label: `${placement.entry.name} · ${placement.activity}` })), ...plan.cats.map((cat) => ({ x: cat.x + 1, label: `ลูบแมว ${cat.cat.name}` }))]
      .sort((a, b) => a.x - b.x).map((item) => item.label);
    expect(order).toEqual(expected);
  });

  it("seats, lays down, and hands items to characters according to their pose", () => {
    const { plan } = renderYard();
    for (const placement of plan.placements) {
      const button = screen.getByRole("button", { name: `${placement.entry.name} · ${placement.activity}` });
      const art = button.querySelector(".baro-art")!;
      if (placement.pose === "doze" && placement.spot.kind !== "bench") expect(art.className).toContain("yard-lie");
      if (["table", "bench"].includes(placement.spot.kind)) expect(art.className).toContain("yard-seated");
      if (placement.item) expect(button.querySelectorAll("svg").length).toBeGreaterThan(1);
    }
  });

  it("opens the public card from a character and returns focus on Escape", async () => {
    const { onReact } = renderYard();
    const mali = characterButtons().find((button) => button.getAttribute("aria-label")?.startsWith("Mali ·"))!;
    mali.focus();
    fireEvent.click(mali);
    const card = await screen.findByRole("dialog", { name: "การ์ดของ Mali" });
    expect(card).toHaveTextContent("hello 0");
    expect(card).not.toHaveTextContent("Garden Alpha");
    fireEvent.click(within(card).getByRole("button", { name: "ส่ง ❤️ ให้ Mali" }));
    expect(onReact).toHaveBeenCalledWith("❤️");
    fireEvent.keyDown(document.activeElement!, { key: "Escape" });
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "การ์ดของ Mali" })).not.toBeInTheDocument());
    expect(mali).toHaveFocus();
  });

  it("uses a bottom sheet for the card on mobile", async () => {
    renderYard(390);
    fireEvent.click(characterButtons().find((button) => button.getAttribute("aria-label")?.startsWith("Pim ·"))!);
    const sheet = await screen.findByRole("dialog", { name: "การ์ดของ Pim" });
    expect(sheet.className).toContain("bottom-0");
  });

  it("lets anyone pet a cat for a little meow without any record", () => {
    const { plan } = renderYard();
    const cat = screen.getByRole("button", { name: `ลูบแมว ${plan.cats[0].cat.name}` });
    fireEvent.click(cat);
    expect(within(cat).getByRole("status")).toHaveTextContent("เหมียว");
  });

  it("keeps still poses when motion is reduced", () => {
    reducedMotion = true;
    renderYard();
    for (const button of within(screen.getByRole("group", { name: /^เพื่อนบนลานตอนนี้/ })).getAllByRole("button")) expect(button).toHaveAttribute("data-motion", "reduced");
  });

  it.each(["backyard", "engawa", "island"] as const)("renders the %s scene", (sceneId) => {
    renderYard(1280, sceneId);
    expect(screen.getByRole("group", { name: `เพื่อนบนลานตอนนี้ · ${YARD_SCENES[sceneId].name}` })).toHaveAttribute("data-scene", sceneId);
    expect(characterButtons()).toHaveLength(12);
  });
});

describe("YardScenePicker", () => {
  it("offers all three yards and marks the chosen one", () => {
    const onChange = vi.fn();
    render(<YardScenePicker value="engawa" onChange={onChange} />);
    expect(screen.getByRole("button", { name: "ระเบียงบ้าน" })).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(screen.getByRole("button", { name: "เกาะลอยฟ้า" }));
    expect(onChange).toHaveBeenCalledWith("island");
  });
});
