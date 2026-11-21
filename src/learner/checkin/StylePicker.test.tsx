import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "react-query";
import { StylePicker } from "./StylePicker";
import { learnerApi } from "../api";
import type { MySummary } from "../types";

vi.mock("react-toastify", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));
vi.mock("../api", async (orig) => {
  const real = await orig<typeof import("../api")>();
  return { ...real, learnerApi: { ...real.learnerApi, savePreferences: vi.fn().mockResolvedValue({}) } };
});

const summary = { streak: 3, perfect_week: false, preferences: { checkin_style: "slide", checkin_random: false } } as MySummary;
const renderPicker = () =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <StylePicker open onOpenChange={() => {}} summary={summary} />
    </QueryClientProvider>
  );

describe("StylePicker", () => {
  beforeEach(() => vi.mocked(learnerApi.savePreferences).mockClear());

  it("groups styles into three sections", () => {
    renderPicker();
    for (const h of ["Clean", "Fun", "Unlock with your streak"]) expect(screen.getByRole("heading", { name: h })).toBeInTheDocument();
  });

  it("saves a free style", async () => {
    renderPicker();
    fireEvent.click(screen.getByRole("button", { name: /^Coffee/ }));
    await waitFor(() => expect(learnerApi.savePreferences).toHaveBeenCalledWith({ checkin_style: "coffee", checkin_random: false }));
    expect(learnerApi.savePreferences).toHaveBeenCalledTimes(1);
  });

  it("doesn't save a locked style and shows progress", () => {
    renderPicker();
    const rocket = screen.getByRole("button", { name: /^Rocket launch/ });
    expect(rocket).toHaveTextContent("3 / 15 days");
    fireEvent.click(rocket);
    expect(learnerApi.savePreferences).not.toHaveBeenCalled();
  });

  it("turns on surprise mode", async () => {
    renderPicker();
    fireEvent.click(screen.getByRole("switch", { name: /Surprise me every day/ }));
    await waitFor(() => expect(learnerApi.savePreferences).toHaveBeenCalledWith({ checkin_random: true }));
  });
});
