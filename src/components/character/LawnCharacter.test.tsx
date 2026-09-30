import { fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ShowcaseEntry } from "@/application/services/showcaseLawnService";
import { LawnCharacter } from "./LawnCharacter";

let reducedMotion = false;
vi.mock("framer-motion", async (original) => ({ ...(await original<typeof import("framer-motion")>()), useReducedMotion: () => reducedMotion }));

const entry: ShowcaseEntry = {
  owner_id: "peer-alpha", name: "Mali", cohort: 16, team: "Garden Alpha",
  character: {
    id: "507f1f77bcf86cd799439011", owner_id: "peer-alpha", serial: "B-507F1F77BCF86CD799439011",
    dna: { version: 1, body: "bean", ears: "cat", eyes: "wide", mark: "heart", palette: "Lilac", pattern: "ramen", pattern_seed: 7, rarity: "legendary" },
    fingerprint: "fp", source: "starter", is_starter: true, created_at: "2026-09-29T00:00:00Z",
  },
  prop: "halo", message: "Keep going, friends", updated_at: "2026-09-29T00:00:00Z",
  reactions: [{ emoji: "❤️", count: 2, reacted: true }],
};

function renderCharacter(width: number, action: "idle" | "walk" = "idle") {
  Object.defineProperty(window, "innerWidth", { configurable: true, value: width });
  vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() })));
  const onReact = vi.fn();
  render(<LawnCharacter entry={entry} action={action} mine={false} admin={false} busy={false} onReact={onReact} onModerate={vi.fn()} onInspect={vi.fn()} />);
  return { onReact };
}

afterEach(() => { reducedMotion = false; vi.unstubAllGlobals(); });

describe("LawnCharacter", () => {
  it("animates layered DNA parts with the prop riding on the torso", () => {
    renderCharacter(1280, "walk");
    const puppet = screen.getByRole("button", { name: "ดูการ์ดของ Mali" });
    expect(puppet).toHaveAttribute("data-action", "walk");
    expect(puppet).toHaveAttribute("data-motion", "full");
    for (const part of ["leg-left", "leg-right", "arm-left", "arm-right"]) expect(puppet.querySelector(`[data-part="${part}"]`)).not.toBeNull();
    expect(puppet.querySelector('[data-part="torso"] [data-part="prop"] ellipse')).not.toBeNull();
    expect(within(puppet).getByRole("img", { name: "Baro Character Lilac ramen" })).toHaveAttribute("data-character-prop", "halo");
  });

  it("shows only the safe name overhead", () => {
    renderCharacter(1280);
    const puppet = screen.getByRole("button", { name: "ดูการ์ดของ Mali" });
    expect(puppet).toHaveTextContent(/^Mali$/);
  });

  it("opens an accessible popover card with approved public fields only", () => {
    const { onReact } = renderCharacter(1280);
    const puppet = screen.getByRole("button", { name: "ดูการ์ดของ Mali" });
    puppet.focus();
    expect(puppet).toHaveFocus();
    fireEvent.click(puppet);
    const card = screen.getByRole("dialog", { name: "การ์ดของ Mali" });
    for (const text of ["legendary", entry.character.serial, "Keep going, friends", "halo", "ramen", "Lilac"]) expect(card).toHaveTextContent(text);
    for (const text of ["Garden Alpha", "16", "peer-alpha", "@"]) expect(card).not.toHaveTextContent(text);
    fireEvent.click(within(card).getByRole("button", { name: "ส่ง ❤️ ให้ Mali" }));
    expect(onReact).toHaveBeenCalledWith("❤️");
    fireEvent.click(within(card).getByRole("button", { name: "ปิดการ์ด" }));
    expect(screen.queryByRole("dialog", { name: "การ์ดของ Mali" })).not.toBeInTheDocument();
  });

  it("uses a bottom sheet on mobile", () => {
    renderCharacter(390);
    fireEvent.click(screen.getByRole("button", { name: "ดูการ์ดของ Mali" }));
    const sheet = screen.getByRole("dialog", { name: "การ์ดของ Mali" });
    expect(sheet.className).toContain("bottom-0");
    expect(sheet).toHaveTextContent("Keep going, friends");
  });

  it("keeps a still idle pose under reduced motion", () => {
    reducedMotion = true;
    renderCharacter(1280, "walk");
    expect(screen.getByRole("button", { name: "ดูการ์ดของ Mali" })).toHaveAttribute("data-motion", "reduced");
  });
});
