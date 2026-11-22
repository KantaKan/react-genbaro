import { describe, expect, it } from "vitest";
import type { Reflection } from "@/domain/types";
import { answersComplete, groupByWeek, matchesFilter, monthGrid, nightStats, readSeen, toNights, unseenReplies, weekStrip, zoneOf } from "./model";

const refl = (day: string, barometer: string, reply = "", id = day): Reflection => ({
  _id: id,
  user_id: "u1",
  date: `${day}T18:00:00+07:00`,
  day,
  reflection: {
    barometer,
    tech_sessions: { happy: `th ${day}`, improve: "ti" },
    non_tech_sessions: { happy: "sh", improve: "si" },
  },
  admin_feedback: reply || undefined,
});

describe("zoneOf", () => {
  it("maps stored labels, any case, to zone ids", () => {
    expect(zoneOf("Comfort Zone")).toBe("comfort");
    expect(zoneOf("Stretch Zone - Enjoying the Challenges")).toBe("stretch-enjoying");
    expect(zoneOf("stretch zone - overwhelmed")).toBe("stretch-overwhelmed");
    expect(zoneOf("Panic Zone")).toBe("panic");
    expect(zoneOf("???")).toBeUndefined();
  });
});

describe("toNights", () => {
  it("normalises, sorts newest first and keeps one per day", () => {
    const n = toNights([refl("2026-11-16", "Comfort Zone"), refl("2026-11-18", "Panic Zone", "hang in there"), { ...refl("2026-11-16", "Panic Zone"), _id: "dup" }]);
    expect(n.map((x) => x.day)).toEqual(["2026-11-18", "2026-11-16"]);
    expect(n[0]).toMatchObject({ zone: "panic", reply: "hang in there", techHappy: "th 2026-11-18" });
  });
  it("falls back to the date when day is missing", () => {
    const r = { ...refl("2026-11-10", "Comfort Zone"), day: undefined };
    expect(toNights([r])[0].day).toBe("2026-11-10");
  });
});

describe("matchesFilter", () => {
  const [rough, calm] = toNights([refl("2026-11-18", "Stretch zone - Overwhelmed"), refl("2026-11-17", "Comfort Zone", "nice")]);
  it("all keeps everything", () => {
    expect(matchesFilter(rough, "all")).toBe(true);
  });
  it("reply keeps nights with a TA reply", () => {
    expect(matchesFilter(calm, "reply")).toBe(true);
    expect(matchesFilter(rough, "reply")).toBe(false);
  });
  it("rough keeps overwhelmed and panic nights", () => {
    expect(matchesFilter(rough, "rough")).toBe(true);
    expect(matchesFilter(calm, "rough")).toBe(false);
  });
});

describe("weekStrip", () => {
  const nights = toNights([refl("2026-11-16", "Comfort Zone"), refl("2026-11-18", "Panic Zone")]);
  it("shows Mon–Fri of this week with written, missed, today and future", () => {
    const s = weekStrip(nights, "2026-11-19", new Set());
    expect(s.map((c) => c.label)).toEqual(["Mon", "Tue", "Wed", "Thu", "Fri"]);
    expect(s.map((c) => c.state)).toEqual(["written", "missed", "written", "today", "future"]);
    expect(s[2].night?.zone).toBe("panic");
  });
  it("marks a holiday as off, not missed", () => {
    const s = weekStrip(nights, "2026-11-19", new Set(["2026-11-17"]));
    expect(s[1].state).toBe("off");
  });
  it("today counts as written once sent", () => {
    const s = weekStrip(toNights([refl("2026-11-19", "Comfort Zone")]), "2026-11-19", new Set());
    expect(s[3].state).toBe("written");
  });
});

describe("monthGrid", () => {
  const nights = toNights([refl("2026-11-02", "Comfort Zone"), refl("2026-11-04", "Panic Zone", "ok")]);
  const g = monthGrid(2026, 10, nights, "2026-11-05", new Set(), { today: "2026-11-05", week: 9 });
  it("lays out Mon–Fri rows that cover the month", () => {
    expect(g[0].days.map((d) => d.date)).toEqual(["2026-10-26", "2026-10-27", "2026-10-28", "2026-10-29", "2026-10-30"]);
    expect(g[g.length - 1].days[4].date).toBe("2026-12-04");
    expect(g[0].days[0].inMonth).toBe(false);
  });
  it("labels rows with the course week", () => {
    expect(g[1].label).toBe("W9");
    expect(g[0].label).toBe("W8");
  });
  it("only counts a day as missed from the first reflection on", () => {
    const row = g[1].days;
    expect(row.map((d) => d.state)).toEqual(["written", "missed", "written", "today", "future"]);
    expect(g[0].days[4].state).toBe("none");
  });
  it("leaves labels off when the course week is unknown", () => {
    expect(monthGrid(2026, 10, nights, "2026-11-05", new Set())[1].label).toBe("");
  });
});

describe("groupByWeek", () => {
  it("groups nights by their Monday, newest week first", () => {
    const g = groupByWeek(toNights([refl("2026-11-09", "Comfort Zone"), refl("2026-11-13", "Comfort Zone"), refl("2026-11-16", "Comfort Zone")]));
    expect(g.map((w) => w.monday)).toEqual(["2026-11-16", "2026-11-09"]);
    expect(g[1].range).toBe("9–13 Nov");
    expect(g[1].nights.map((n) => n.day)).toEqual(["2026-11-13", "2026-11-09"]);
  });
});

describe("nightStats", () => {
  it("counts written of class nights since the first one, and the zone mix", () => {
    const s = nightStats(toNights([refl("2026-11-16", "Comfort Zone"), refl("2026-11-18", "Comfort Zone"), refl("2026-11-19", "Panic Zone")]), "2026-11-20", new Set());
    // 16,17,18,19 are class nights before today (Fri 20 still open)
    expect(s.written).toBe(3);
    expect(s.classNights).toBe(4);
    expect(s.missed).toEqual(["2026-11-17"]);
    expect(s.dominant).toBe("comfort");
    expect(s.mix.comfort).toBeCloseTo(2 / 3);
  });
  it("counts today once it is written", () => {
    const s = nightStats(toNights([refl("2026-11-20", "Comfort Zone")]), "2026-11-20", new Set());
    expect(s).toMatchObject({ written: 1, classNights: 1 });
  });
});

describe("unseenReplies", () => {
  const nights = toNights([refl("2026-11-18", "Comfort Zone", "a", "r1"), refl("2026-11-19", "Comfort Zone", "b", "r2"), refl("2026-11-17", "Comfort Zone")]);
  it("returns replies not seen yet, newest first", () => {
    expect(unseenReplies(nights, new Set(["r1"])).map((n) => n._id)).toEqual(["r2"]);
  });
});

describe("readSeen", () => {
  it("treats every current reply as seen the first time, so old replies are not flagged", () => {
    const nights = toNights([refl("2026-11-18", "Comfort Zone", "a", "r1")]);
    expect([...readSeen(null, nights)]).toEqual(["r1"]);
    expect([...readSeen("[]", nights)]).toEqual([]);
    expect([...readSeen("not json", nights)]).toEqual(["r1"]);
  });
});

describe("answersComplete", () => {
  it("needs all four answers with text", () => {
    expect(answersComplete({ th: "a", ti: "b", sh: "c", si: "d" })).toBe(true);
    expect(answersComplete({ th: "a", ti: " ", sh: "c", si: "d" })).toBe(false);
  });
});
