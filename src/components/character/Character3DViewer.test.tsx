import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ShowcaseEntry } from "@/application/services/showcaseLawnService";
import { Character3DViewer } from "./Character3DViewer";

vi.mock("./BaroCharacter3D", () => ({
  BaroCharacter3D: ({ dna, prop, reducedMotion, onContextLost }: { dna: { pattern: string; pattern_seed: number }; prop?: string; reducedMotion: boolean; onContextLost: () => void }) => <div data-testid="figure-3d" data-pattern={dna.pattern} data-seed={dna.pattern_seed} data-prop={prop} data-reduced-motion={reducedMotion}><button type="button" onClick={onContextLost}>Lose context</button></div>,
}));

const entry: ShowcaseEntry = {
  owner_id: "owner", name: "Mali", cohort: 16, team: "Alpha", message: "Hi", updated_at: "2026-09-29T00:00:00Z",
  character: { id: "character", owner_id: "owner", serial: "B-MALI", fingerprint: "fingerprint", source: "starter", is_starter: true, created_at: "2026-09-29T00:00:00Z", dna: { version: 1, body: "mushroom", ears: "cat", eyes: "spark", mark: "star", palette: "Berry", pattern: "egg", pattern_seed: 88891, rarity: "meme_rare" } },
  prop: "egg", reactions: [],
};

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe("Character3DViewer", () => {
  it("passes pinned server DNA and equipped prop to the 3D figure, pauses motion, and falls back after context loss", async () => {
    vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() })));
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({} as CanvasRenderingContext2D);
    render(<Character3DViewer entry={entry} onClose={vi.fn()} />);
    const figure = await screen.findByTestId("figure-3d");
    expect(figure).toHaveAttribute("data-pattern", "egg");
    expect(figure).toHaveAttribute("data-seed", "88891");
    expect(figure).toHaveAttribute("data-prop", "egg");
    expect(figure).toHaveAttribute("data-reduced-motion", "true");
    fireEvent.click(screen.getByRole("button", { name: "Lose context" }));
    expect(screen.getByRole("img", { name: "Baro Character Berry egg" })).toHaveAttribute("data-character-prop", "egg");
    expect(screen.getByText("การแสดงผล 3D หยุดทำงาน จึงกลับมาแสดงภาพ 2D")).toBeInTheDocument();
  });
});
