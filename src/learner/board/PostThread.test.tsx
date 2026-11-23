import { describe, it, expect, vi } from "vitest";
import { useState } from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import type { BoardComment } from "@/lib/board";
import { PostThread } from "./PostThread";

vi.mock("@/components/user-avatar", () => ({ UserAvatar: () => <span /> }));
vi.mock("react-toastify", () => ({ toast: { error: vi.fn() } }));

const c = (id: string, content: string, at: string): BoardComment => ({ id, userId: id, zoomName: id, cohort: 9, content, reactions: [], createdAt: at });
const replies = [c("b", "second", "2026-11-24T02:00:00Z"), c("a", "first", "2026-11-24T01:00:00Z"), c("z", "newest", "2026-11-24T03:00:00Z")];

function Harness({ onSend }: { onSend: (s: string) => Promise<void> }) {
  const [open, setOpen] = useState(false);
  return <PostThread comments={replies} open={open} onToggle={() => setOpen((o) => !o)} onSend={onSend} />;
}

describe("PostThread", () => {
  it("shows only the latest reply until opened, then the whole thread in order with a reply box", async () => {
    const onSend = vi.fn().mockResolvedValue(undefined);
    render(<Harness onSend={onSend} />);
    expect(screen.getByText("newest")).toBeInTheDocument();
    expect(screen.queryByText("first")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: /View all 3 replies/ }));
    const texts = screen.getAllByText(/first|second|newest/).map((el) => el.textContent);
    expect(texts).toEqual(["first", "second", "newest"]);

    fireEvent.change(screen.getByLabelText("Reply to this post"), { target: { value: " thanks! " } });
    fireEvent.click(screen.getByRole("button", { name: "Reply" }));
    await waitFor(() => expect(onSend).toHaveBeenCalledWith("thanks!"));
  });
});
