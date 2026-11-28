import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { ReflectionCard } from "./ReflectionCard";
import { learnerApi } from "../api";
import type { Reflection } from "@/domain/types";

vi.mock("@/hooks/use-reflections", () => ({ useReflections: () => ({ addReflection: vi.fn() }) }));
vi.mock("../api", () => ({ learnerApi: { editReflection: vi.fn() } }));
vi.mock("@/components/linear-feedback-form", () => ({
  default: ({ initialData, onSubmit, onSuccess }: { initialData?: { categoryInputs: Record<string, string>; comfortLevel: string }; onSubmit: (r: unknown) => Promise<void>; onSuccess: () => void }) => (
    <div>
      <p>prefill:{initialData?.comfortLevel}:{initialData?.categoryInputs["tech-improve"]}</p>
      <button type="button" onClick={async () => { await onSubmit({ reflection: { barometer: "Comfort Zone", tech_sessions: { happy: "a", improve: "fixed typo" }, non_tech_sessions: { happy: "", improve: "" } } }); onSuccess(); }}>submit form</button>
    </div>
  ),
}));

const mine = (over: Partial<Reflection> = {}): Reflection => ({
  _id: "r1", user_id: "u1", date: "2026-11-26T10:00:00Z", day: "2026-11-26",
  reflection: { barometer: "Stretch zone - overwhelmed", tech_sessions: { happy: "a", improve: "typo here" }, non_tech_sessions: { happy: "", improve: "" } },
  ...over,
}) as Reflection;

const card = (reflections: Reflection[], today = "2026-11-26", onSubmitted = vi.fn()) =>
  render(<MemoryRouter><ReflectionCard userId="u1" reflections={reflections} nowSec={20 * 3600} today={today} onSubmitted={onSubmitted} /></MemoryRouter>);

describe("ReflectionCard", () => {
  beforeEach(() => {
    vi.mocked(learnerApi.editReflection).mockReset();
  });

  it("edits today's reflection with the old answers filled in", async () => {
    vi.mocked(learnerApi.editReflection).mockResolvedValue(undefined);
    const onSubmitted = vi.fn();
    card([mine()], "2026-11-26", onSubmitted);
    fireEvent.click(screen.getByRole("button", { name: "แก้ไข" }));
    expect(screen.getByText("prefill:stretch-overwhelmed:typo here")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "submit form" }));
    await waitFor(() => expect(onSubmitted).toHaveBeenCalled());
    expect(learnerApi.editReflection).toHaveBeenCalledWith("r1", expect.objectContaining({ barometer: "Comfort Zone" }));
  });

  it("does not offer editing once a TA replied", () => {
    card([mine({ admin_feedback: "nice work" })]);
    expect(screen.queryByRole("button", { name: "แก้ไข" })).not.toBeInTheDocument();
  });

  it("says weekends don't count toward the streak", () => {
    card([], "2026-11-28");
    expect(screen.getByText(/วันเสาร์-อาทิตย์เขียนได้ แต่ไม่นับ streak/)).toBeInTheDocument();
    card([mine({ day: "2026-11-29", date: "2026-11-29T10:00:00Z", reflection: { barometer: "Comfort Zone", tech_sessions: { happy: "", improve: "" }, non_tech_sessions: { happy: "", improve: "" } } })], "2026-11-29");
    expect(screen.getByText(/บันทึกแล้ว วันนี้ไม่นับ streak นะ/)).toBeInTheDocument();
  });

  it("shows no weekend note on a weekday", () => {
    card([], "2026-11-26");
    expect(screen.queryByText(/ไม่นับ streak/)).not.toBeInTheDocument();
  });
});
