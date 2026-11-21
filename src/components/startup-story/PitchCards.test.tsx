import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PitchCards } from "./PitchCards";

const pitches = [
  { type: "LINE Bot", theme: "Street Food", title: "Street-food LINE bot" },
  { type: "Mobile App", theme: "Pets", title: "Tinder for dogs" },
  { type: "Dev Tool/CLI", theme: "Government/Tax", title: "Tax calculator nobody asked for" },
];

describe("PitchCards", () => {
  it("renders the three pitches with hot badges and the real rating of shipped combos", () => {
    render(<PitchCards pitches={pitches} hot={["Pets"]} ratings={{ "LINE Bot|Street Food": "great", "Mobile App|Pets": "meh" }} pending={false} onStartPitch={vi.fn()} />);

    expect(screen.getByText("Street-food LINE bot")).toBeInTheDocument();
    expect(screen.getByText("Tinder for dogs")).toBeInTheDocument();
    expect(screen.getByText("Tax calculator nobody asked for")).toBeInTheDocument();

    const cards = screen.getByRole("list", { name: "Pitch cards" });
    expect(within(cards).getAllByLabelText("Hot theme")).toHaveLength(1);
    expect(within(cards).getByText(/Great combo \(shipped before\)/)).toBeInTheDocument();
    expect(within(cards).getByText(/Meh combo \(shipped before\)/)).toBeInTheDocument();
    expect(screen.getByText("LINE Bot × Street Food")).toBeInTheDocument();
  });

  it("starts a project with one tap on a card", () => {
    const onStartPitch = vi.fn();
    render(<PitchCards pitches={pitches} hot={[]} ratings={{}} pending={false} onStartPitch={onStartPitch} />);

    fireEvent.click(screen.getByRole("button", { name: /Tinder for dogs/ }));

    expect(onStartPitch).toHaveBeenCalledTimes(1);
    expect(onStartPitch).toHaveBeenCalledWith(1);
  });

  it("disables the cards while an action is pending", () => {
    render(<PitchCards pitches={pitches} hot={[]} ratings={{}} pending onStartPitch={vi.fn()} />);

    for (const button of screen.getAllByRole("button")) {
      expect(button).toBeDisabled();
    }
  });
});
