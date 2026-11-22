import { describe, it, expect } from "vitest";
import type { CalDay, CalWeek, Session } from "@/calendar/types";
import { defaultDay, durationLabel, hoursByType, momentAt, pickWeek, upcoming } from "./logic";

const s = (start: string, end: string, title: string, o: Partial<Session> = {}): Session => ({ start, end, code: "", title, subtitle: "", facilitators: ["Kan"], type: "technical", kind: "session", ...o });
const day = (date: string, sessions: Session[], holiday = false): CalDay => ({ date, label: "", weekday: 0, holiday, sessions });
const week = (n: number, monday: string, days: CalDay[] = []): CalWeek => ({ n, name: `WEEK ${n}`, monday, days });

describe("pickWeek", () => {
  const ws = [week(1, "2026-06-29"), week(2, "2026-07-06"), week(4, "2026-07-20")];
  it("takes the week that contains today", () => {
    expect(pickWeek(ws, "2026-07-08")?.n).toBe(2);
    expect(pickWeek(ws, "2026-07-12")?.n).toBe(2); // Sunday still belongs to that week
  });
  it("before the course starts, the first week; after it ends, the last", () => {
    expect(pickWeek(ws, "2026-06-01")?.n).toBe(1);
    expect(pickWeek(ws, "2026-12-01")?.n).toBe(4);
  });
  it("in a gap between published weeks, the next one coming", () => {
    expect(pickWeek(ws, "2026-07-15")?.n).toBe(4);
  });
  it("no weeks, no week", () => expect(pickWeek([], "2026-07-08")).toBeUndefined());
});

describe("defaultDay", () => {
  const w = week(2, "2026-07-06", [day("2026-07-06", []), day("2026-07-07", []), day("2026-07-08", [])]);
  it("today if it's in the week, otherwise the first day", () => {
    expect(defaultDay(w, "2026-07-07")).toBe("2026-07-07");
    expect(defaultDay(w, "2026-08-01")).toBe("2026-07-06");
  });
});

describe("momentAt", () => {
  const d = day("2026-07-07", [s("09:00", "09:15", "Daily Opening"), s("09:15", "12:00", "REACT Hooks"), s("12:00", "13:00", "Lunch", { kind: "break", type: "break" }), s("13:00", "15:30", "JS Assessment")]);
  it("during a session: what's on now, how long is left, and what's next", () => {
    const m = momentAt(d, 10 * 60 + 15);
    expect(m.now?.title).toBe("REACT Hooks");
    expect(m.minsLeft).toBe(105);
    expect(m.next?.title).toBe("JS Assessment"); // lunch is a break, not "next"
    expect(m.minsToNext).toBe(165);
  });
  it("at the exact end of a session, the next one is now", () => {
    expect(momentAt(d, 9 * 60 + 15).now?.title).toBe("REACT Hooks");
  });
  it("in a break: nothing now, the next session is next", () => {
    const m = momentAt(d, 12 * 60 + 30);
    expect(m.now).toBeUndefined();
    expect(m.next?.title).toBe("JS Assessment");
    expect(m.minsToNext).toBe(30);
  });
  it("before the day and after it", () => {
    expect(momentAt(d, 8 * 60).next?.title).toBe("Daily Opening");
    const late = momentAt(d, 17 * 60);
    expect(late.now).toBeUndefined();
    expect(late.next).toBeUndefined();
  });
  it("no day, no moment", () => expect(momentAt(undefined, 600)).toEqual({}));
});

describe("hoursByType", () => {
  it("adds minutes per type, biggest first, ignoring breaks", () => {
    const w = week(2, "2026-07-06", [
      day("2026-07-06", [s("09:00", "10:00", "A", { type: "technical" }), s("10:00", "10:30", "B", { type: "community" }), s("12:00", "13:00", "Lunch", { kind: "break", type: "break" })]),
      day("2026-07-07", [s("09:00", "10:30", "C", { type: "technical" })]),
    ]);
    expect(hoursByType(w)).toEqual([{ type: "technical", minutes: 150 }, { type: "community", minutes: 30 }]);
  });
});

describe("upcoming", () => {
  const w = week(2, "2026-07-06", [
    day("2026-07-06", [s("09:00", "09:15", "Daily Opening"), s("09:15", "12:00", "Mon morning")]),
    day("2026-07-07", [s("09:00", "09:15", "Daily Opening"), s("09:15", "12:00", "Tue morning"), s("13:00", "15:00", "Tue afternoon")]),
    day("2026-07-08", [s("09:15", "12:00", "Wed morning")]),
  ]);
  it("lists the sessions still to come this week, skipping short ones, up to the limit", () => {
    const got = upcoming(w, "2026-07-07", 10 * 60, 3).map((u) => u.session.title);
    expect(got).toEqual(["Tue afternoon", "Wed morning"]);
    expect(upcoming(w, "2026-07-07", 10 * 60, 1)).toHaveLength(1);
  });
});

describe("durationLabel", () => {
  it("reads naturally", () => {
    expect(durationLabel(15)).toBe("15 min");
    expect(durationLabel(60)).toBe("1 h");
    expect(durationLabel(165)).toBe("2 h 45 min");
  });
});
