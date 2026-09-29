import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/infrastructure/api", () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

import { api } from "@/infrastructure/api";
import { careEnergyService } from "./careEnergyService";

const get = vi.mocked(api.get);
const post = vi.mocked(api.post);

describe("careEnergyService", () => {
  beforeEach(() => {
    get.mockReset();
    post.mockReset();
    post.mockResolvedValue({ data: { success: true, data: null } });
  });

  it("moves every action caller to the Care Energy contract", async () => {
    await careEnergyService.grant("learner-1", { amount: 2, note: "kind work" });
    await careEnergyService.bulkGrant(["learner-1", "learner-2"], { amount: 3 });
    await careEnergyService.protect("learner-1", "2026-09-25");
    await careEnergyService.feed("learner-1", 2);
    await careEnergyService.gift("learner-2", 1);
    await careEnergyService.rescue("learner-2", "2026-09-24");

    expect(post).toHaveBeenNthCalledWith(1, "/admin/users/learner-1/care-energy", { amount: 2, note: "kind work" });
    expect(post).toHaveBeenNthCalledWith(2, "/admin/care-energy/bulk", { userIds: ["learner-1", "learner-2"], amount: 3 });
    expect(post).toHaveBeenNthCalledWith(3, "/users/learner-1/care-energy/protect", { date: "2026-09-25" });
    expect(post).toHaveBeenNthCalledWith(4, "/users/learner-1/care-energy/feed", { quantity: 2 });
    expect(post).toHaveBeenNthCalledWith(5, "/users/learner-2/care-energy/gift", { quantity: 1 });
    expect(post).toHaveBeenNthCalledWith(6, "/users/learner-2/care-energy/rescue", { date: "2026-09-24" });
  });

  it("reads balance and history through the canonical state contract", async () => {
    const entry = { kind: "grant", amount: 4, createdAt: "2026-09-30T00:00:00Z" };
    get.mockResolvedValue({ data: { success: true, data: {
      balance: 4,
      log: [entry],
      character_care_count: 0,
    } } });

    const state = await careEnergyService.state("learner-1");

    expect(get).toHaveBeenCalledWith("/users/learner-1/care-energy");
    expect(state.balance).toBe(4);
    expect(state.log).toEqual([entry]);
  });
});
