import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { Board } from "./Board";

const START = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const sq = (s: string) => document.querySelector(`[data-square="${s}"]`) as HTMLElement;

describe("Board", () => {
  it("offers only legal targets and sends the move as UCI", () => {
    const onMove = vi.fn();
    render(<Board fen={START} onMove={onMove} />);
    fireEvent.click(screen.getByLabelText("e2 white pawn"));
    fireEvent.click(sq("e5"));
    expect(onMove).not.toHaveBeenCalled();
    fireEvent.click(screen.getByLabelText("e2 white pawn"));
    fireEvent.click(sq("e4"));
    expect(onMove).toHaveBeenCalledWith("e2e4");
  });

  it("cannot pick the other side's pieces", () => {
    const onMove = vi.fn();
    render(<Board fen={START} onMove={onMove} />);
    fireEvent.click(screen.getByLabelText("e7 black pawn"));
    fireEvent.click(sq("e5"));
    expect(onMove).not.toHaveBeenCalled();
  });

  it("asks which piece on promotion", () => {
    const onMove = vi.fn();
    render(<Board fen="8/4P3/8/8/8/8/k7/4K3 w - - 0 1" onMove={onMove} />);
    fireEvent.click(screen.getByLabelText("e7 white pawn"));
    fireEvent.click(sq("e8"));
    fireEvent.click(screen.getByLabelText("Promote to knight"));
    expect(onMove).toHaveBeenCalledWith("e7e8n");
  });

  it("puts black at the bottom when flipped and is read-only without onMove", () => {
    render(<Board fen={START} orientation="black" />);
    const squares = document.querySelectorAll("[data-square]");
    expect(squares[0].getAttribute("data-square")).toBe("h1");
    expect(squares[63].getAttribute("data-square")).toBe("a8");
    expect(sq("e2")).toHaveAttribute("aria-disabled", "true");
  });
});
