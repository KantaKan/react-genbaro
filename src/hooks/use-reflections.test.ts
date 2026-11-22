import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { AxiosError, type AxiosResponse } from "axios";
import { toast } from "react-toastify";
import { api } from "@/lib/api";
import { useReflections, type Reflection } from "./use-reflections";

vi.mock("react-toastify", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("@/lib/api", () => ({ api: { post: vi.fn(), get: vi.fn().mockResolvedValue({ data: { data: [] } }), delete: vi.fn() } }));

const input = { user_id: "u1", date: new Date().toISOString(), reflection: { tech_sessions: { happy: "a", improve: "" }, non_tech_sessions: { happy: "", improve: "" }, barometer: "Comfort Zone" } } as unknown as Reflection;

describe("useReflections.addReflection", () => {
  beforeEach(() => {
    vi.mocked(toast.success).mockReset();
    vi.mocked(toast.error).mockReset();
  });

  it("leaves the success message to the form, so only one toast shows", async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { data: { ...input, _id: "r1" } } } as AxiosResponse);
    const { result } = renderHook(() => useReflections("u1", []));
    await act(async () => {
      await result.current.addReflection(input);
    });
    expect(toast.success).not.toHaveBeenCalled();
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("explains a second reflection the same day once, through the error it throws", async () => {
    const err = new AxiosError("Request failed", "409", undefined, undefined, { status: 409, data: {} } as AxiosResponse);
    vi.mocked(api.post).mockRejectedValue(err);
    const { result } = renderHook(() => useReflections("u1", []));
    let thrown: unknown;
    await act(async () => {
      await result.current.addReflection(input).catch((e) => (thrown = e));
    });
    expect((thrown as Error).message).toBe("You have already submitted a reflection today. Please try again tomorrow.");
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("turns a server error into a readable message", async () => {
    vi.mocked(api.post).mockRejectedValue(new AxiosError("Request failed with status code 500", "500", undefined, undefined, { status: 500, data: { message: "Database is busy" } } as AxiosResponse));
    const { result } = renderHook(() => useReflections("u1", []));
    let thrown: unknown;
    await act(async () => {
      await result.current.addReflection(input).catch((e) => (thrown = e));
    });
    expect((thrown as Error).message).toBe("Database is busy");
    expect(toast.error).not.toHaveBeenCalled();
  });
});
