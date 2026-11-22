import { describe, expect, it } from "vitest";
import type { Reflection } from "@/domain/types";
import { answersComplete, courseWeekOf, repliesFrom, groupByWeek, matchesFilter, monthGrid, nightStats, readSeen, toNights, unseenReplies, weekStrip, zoneOf } from "./model";

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
  it("falls back to the date when day is missing, read in Bangkok time", () => {
    const r = { ...refl("2026-11-10", "Comfort Zone"), day: undefined };
    expect(toNights([r])[0].day).toBe("2026-11-10");
    const utcLate = { ...refl("x", "Comfort Zone"), day: undefined, date: "2026-11-22T17:30:00Z", _id: "u" };
    expect(toNights([utcLate])[0].day).toBe("2026-11-23");
  });
  it("drops rows with a broken or zero date", () => {
    const bad = [{ ...refl("0001-01-01", "Comfort Zone") }, { ...refl("x", "Comfort Zone"), day: "nope", date: "nope" }];
    expect(toNights(bad)).toEqual([]);
  });
  it("decodes the HTML escaping the server stores", () => {
    const r = refl("2026-11-10", "Comfort Zone", "I&#39;m &lt;proud&gt;");
    r.reflection.tech_sessions.happy = "I&#39;m &amp; you";
    const n = toNights([r])[0];
    expect(n.techHappy).toBe("I'm & you");
    expect(n.reply).toBe("I'm <proud>");
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
  it("shows a care-energy protected night as protected, not missed", () => {
    const s = weekStrip(nights, "2026-11-19", new Set(), new Set(["2026-11-17"]));
    expect(s[1].state).toBe("protected");
  });
  it("today counts as written once sent", () => {
    const s = weekStrip(toNights([refl("2026-11-19", "Comfort Zone")]), "2026-11-19", new Set());
    expect(s[3].state).toBe("written");
  });
});

describe("courseWeekOf", () => {
  // course starts Mon 2 Nov 2026, 75 class days
  it("counts weekdays from the start, five per week", () => {
    expect(courseWeekOf("2026-11-02", "2026-11-02", 75)).toBe(1);
    expect(courseWeekOf("2026-11-06", "2026-11-02", 75)).toBe(1);
    expect(courseWeekOf("2026-11-09", "2026-11-02", 75)).toBe(2);
    expect(courseWeekOf("2026-11-08", "2026-11-02", 75)).toBe(0); // a Sunday is not a class day
  });
  it("follows the course, not the calendar, when it starts mid-week", () => {
    // starts Wed 4 Nov: Wed–Fri are days 1–3, Mon–Tue days 4–5 (week 1), Wed day 6 (week 2)
    expect(courseWeekOf("2026-11-10", "2026-11-04", 75)).toBe(1);
    expect(courseWeekOf("2026-11-11", "2026-11-04", 75)).toBe(2);
  });
  it("is 0 before the start, after the last class day, or with no start", () => {
    expect(courseWeekOf("2026-11-01", "2026-11-02", 75)).toBe(0);
    expect(courseWeekOf("2026-11-09", "2026-11-02", 5)).toBe(0);
    expect(courseWeekOf("2026-11-09", "", 75)).toBe(0);
  });
});

describe("monthGrid", () => {
  const nights = toNights([refl("2026-11-02", "Comfort Zone"), refl("2026-11-04", "Panic Zone", "ok")]);
  const course = { start: "2026-10-26", days: 75 };
  const g = monthGrid(2026, 10, nights, "2026-11-05", new Set(), new Set(), course);
  it("lays out Mon–Fri rows for the month, skipping a row that is all last month", () => {
    // 1 Nov 2026 is a Sunday, so the first row is 2–6 Nov
    expect(g[0].days.map((d) => d.date)).toEqual(["2026-11-02", "2026-11-03", "2026-11-04", "2026-11-05", "2026-11-06"]);
    expect(g[g.length - 1].days[4].date).toBe("2026-12-04");
    expect(g[g.length - 1].days[2].inMonth).toBe(false);
  });
  it("labels rows with the course week", () => {
    expect(g[0].label).toBe("W2");
    expect(g[1].label).toBe("W3");
  });
  it("only counts a day as missed from the first reflection on", () => {
    expect(g[0].days.map((d) => d.state)).toEqual(["written", "missed", "written", "today", "future"]);
  });
  it("leaves labels off when the course is unknown", () => {
    expect(monthGrid(2026, 10, nights, "2026-11-05", new Set())[0].label).toBe("");
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
    const s = nightStats(toNights([refl("2026-11-16", "Comfort Zone"), refl("2026-11-18", "Comfort Zone"), refl("2026-11-19", "Panic Zone")]), "2026-11-20", new Set(), new Set());
    // 16,17,18,19 are class nights before today (Fri 20 still open)
    expect(s.written).toBe(3);
    expect(s.classNights).toBe(4);
    expect(s.missed).toEqual(["2026-11-17"]);
    expect(s.dominant).toBe("comfort");
    expect(s.mix.comfort).toBeCloseTo(2 / 3);
  });
  it("counts today once it is written", () => {
    const s = nightStats(toNights([refl("2026-11-20", "Comfort Zone")]), "2026-11-20", new Set(), new Set());
    expect(s).toMatchObject({ written: 1, classNights: 1 });
  });
  it("never says more written than class nights: weekend and holiday writes don't count", () => {
    const s = nightStats(toNights([refl("2026-11-16", "Comfort Zone"), refl("2026-11-21", "Comfort Zone"), refl("2026-11-17", "Comfort Zone")]), "2026-11-23", new Set(["2026-11-17"]), new Set());
    // class nights 16, 18, 19, 20 (17 is a holiday, 21 a Saturday, 23 still open)
    expect(s).toMatchObject({ written: 1, classNights: 4 });
  });
  it("does not count a protected night as missed", () => {
    const s = nightStats(toNights([refl("2026-11-16", "Comfort Zone"), refl("2026-11-18", "Comfort Zone")]), "2026-11-19", new Set(), new Set(["2026-11-17"]));
    expect(s.missed).toEqual([]);
    expect(s.classNights).toBe(2);
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

describe("reply author", () => {
  const withAuthor = (day: string, id: string, by?: string, name?: string) => ({ ...refl(day, "Comfort Zone", "reply", id), admin_feedback_by: by, admin_feedback_name: name });
  it("reads the replier's nickname from their Zoom name", () => {
    const [n] = toNights([withAuthor("2026-11-18", "r1", "ta1", "00_Kan(Kan/กัน)")]);
    expect(n).toMatchObject({ replyBy: "ta1", replyName: "Kan" });
  });
  it("uses a plain name as is, and nothing for older replies", () => {
    expect(toNights([withAuthor("2026-11-18", "r1", "ta2", "Neeti")])[0].replyName).toBe("Neeti");
    expect(toNights([withAuthor("2026-11-18", "r1")])[0]).toMatchObject({ replyBy: "", replyName: "" });
  });
  it("says who new replies are from", () => {
    const n = toNights([
      withAuthor("2026-11-19", "a", "ta1", "00_Kan(Kan/กัน)"),
      withAuthor("2026-11-18", "b", "ta1", "00_Kan(Kan/กัน)"),
      withAuthor("2026-11-17", "c", "ta2", "Neeti"),
      withAuthor("2026-11-16", "d"),
    ]);
    expect(repliesFrom(n.slice(0, 1))).toBe("Kan");
    expect(repliesFrom(n.slice(0, 2))).toBe("Kan");
    expect(repliesFrom(n.slice(0, 3))).toBe("Kan and Neeti");
    expect(repliesFrom(n)).toBe("your TAs");
    expect(repliesFrom([])).toBe("your TAs");
  });
});
