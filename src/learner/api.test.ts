import { describe, it, expect, vi } from "vitest";
import { api } from "@/infrastructure/api";
import { learnerApi } from "./api";

vi.mock("@/infrastructure/api", () => ({ api: { get: vi.fn().mockResolvedValue({ data: { data: { users: [{ _id: "a" }] } } }) } }));

describe("learnerApi.getCohortPeople", () => {
  it("asks for the whole cohort, not the default page of 50", async () => {
    expect(await learnerApi.getCohortPeople()).toEqual([{ _id: "a" }]);
    expect(vi.mocked(api.get).mock.calls[0][0]).toMatch(/limit=1000/);
  });
});
