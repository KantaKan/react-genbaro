import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { TonightCard } from "./TonightCard";
import type { Night } from "./model";

const OPEN = 17 * 3600;
const fill = (label: RegExp, text: string) => fireEvent.change(screen.getByLabelText(label), { target: { value: text } });

describe("TonightCard", () => {
  it("is locked before 16:45 and says when it opens", () => {
    render(<TonightCard dateLabel="Fri 20 Nov" nowSec={15 * 3600} onSend={vi.fn()} />);
    expect(screen.getByText(/Opens at 16:45/)).toBeInTheDocument();
    for (const b of screen.getAllByRole("button", { name: /zone|stretch/i })) expect(b).toBeDisabled();
  });

  it("asks for all four answers after a mood is picked, then sends", async () => {
    const onSend = vi.fn().mockResolvedValue(undefined);
    render(<TonightCard dateLabel="Fri 20 Nov" nowSec={OPEN} onSend={onSend} />);
    expect(screen.getByText("Step 1 of 2 · Pick a mood")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Stretch, enjoying it/i }));
    expect(screen.getByText("Step 2 of 2 · Answer all four")).toBeInTheDocument();

    const send = screen.getByRole("button", { name: "Send reflection" });
    expect(send).toBeDisabled();
    fill(/Tech · what went well/, "hooks");
    fill(/Tech · what to improve/, "stacks");
    fill(/Non-tech · what went well/, "demo");
    expect(screen.getByText("3 of 4 answered. Answer all four to send.")).toBeInTheDocument();
    expect(send).toBeDisabled();
    fill(/Non-tech · what to improve/, "   ");
    expect(send).toBeDisabled();
    fill(/Non-tech · what to improve/, "listen");
    expect(send).toBeEnabled();

    fireEvent.click(send);
    await waitFor(() => expect(onSend).toHaveBeenCalledWith("stretch-enjoying", { th: "hooks", ti: "stacks", sh: "demo", si: "listen" }));
  });

  it("keeps the answers when the mood is changed", () => {
    render(<TonightCard dateLabel="Fri 20 Nov" nowSec={OPEN} onSend={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /Comfort zone/i }));
    fill(/Tech · what went well/, "hooks");
    fireEvent.click(screen.getByRole("button", { name: "Change" }));
    fireEvent.click(screen.getByRole("button", { name: /Panic zone/i }));
    expect(screen.getByLabelText(/Tech · what went well/)).toHaveValue("hooks");
  });

  it("keeps the form open when sending fails", async () => {
    const onSend = vi.fn().mockRejectedValue(new Error("nope"));
    render(<TonightCard dateLabel="Fri 20 Nov" nowSec={OPEN} onSend={onSend} />);
    fireEvent.click(screen.getByRole("button", { name: /Comfort zone/i }));
    for (const l of [/Tech · what went well/, /Tech · what to improve/, /Non-tech · what went well/, /Non-tech · what to improve/]) fill(l, "x");
    fireEvent.click(screen.getByRole("button", { name: "Send reflection" }));
    await waitFor(() => expect(onSend).toHaveBeenCalled());
    expect(screen.getByRole("button", { name: "Send reflection" })).toBeEnabled();
  });

  it("shows tonight's mood once sent", () => {
    const night = { _id: "r", day: "2026-11-20", zone: "panic", barometer: "Panic Zone" } as Night;
    render(<TonightCard dateLabel="Fri 20 Nov" nowSec={OPEN} sent={night} onSend={vi.fn()} />);
    expect(screen.getByText("Done for tonight")).toBeInTheDocument();
    expect(screen.getByText(/A TA will reach out/)).toBeInTheDocument();
  });

  it("won't send once the night is over (form left open past midnight)", () => {
    const { rerender } = render(<TonightCard dateLabel="Fri 20 Nov" nowSec={OPEN} onSend={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /Comfort zone/i }));
    for (const l of [/Tech · what went well/, /Tech · what to improve/, /Non-tech · what went well/, /Non-tech · what to improve/]) fill(l, "x");
    rerender(<TonightCard dateLabel="Sat 21 Nov" nowSec={5 * 60} onSend={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Send reflection" })).toBeDisabled();
    expect(screen.getByText(/opens again at 16:45/)).toBeInTheDocument();
  });

  it("counts down without ever showing 60 minutes", () => {
    render(<TonightCard dateLabel="Fri 20 Nov" nowSec={16 * 3600 + 44 * 60 + 30} onSend={vi.fn()} />);
    expect(screen.getByText(/in 0h 1m/)).toBeInTheDocument();
    // 59m59s left must read 1h 0m, not 0h 60m
    render(<TonightCard dateLabel="Fri 20 Nov" nowSec={15 * 3600 + 45 * 60 + 1} onSend={vi.fn()} />);
    expect(screen.getByText(/in 1h 0m/)).toBeInTheDocument();
  });
});
