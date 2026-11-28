import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "react-query";
import { ChessTurnCard } from "./ChessNav";
import { chessApi } from "./api";

const show = () =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter>
        <ChessTurnCard />
      </MemoryRouter>
    </QueryClientProvider>,
  );

describe("ChessTurnCard", () => {
  it("links to the board when it is my turn", async () => {
    vi.mocked(chessApi.me).mockResolvedValueOnce({ enabled: true, my_turn: true });
    show();
    expect((await screen.findByText("ถึงตาคุณเดินแล้ว")).closest("a")).toHaveAttribute("href", "/learner/chess");
  });

  it("stays hidden otherwise", async () => {
    show();
    await new Promise((r) => setTimeout(r, 20));
    expect(screen.queryByText("ถึงตาคุณเดินแล้ว")).toBeNull();
  });
});
