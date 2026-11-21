import { describe, it, expect } from "vitest";
import { filterPeople, type Person } from "./people";

const p = (o: Partial<Person>): Person => ({ _id: o.first_name ?? "x", first_name: "", last_name: "", email: "", cohort_number: 13, role: "learner", ...o } as Person);
const list = [
  p({ first_name: "Aphiradee", zoom_name: "03_Aphiradee(Black/แบล็ค)", jsd_number: "03", genmate_group: "F", skills: ["React", "Figma"] }),
  p({ first_name: "Ajjima", zoom_name: "01_Ajjima(Theim/เถียม)", jsd_number: "01", genmate_group: "I", skills: ["SQL"] }),
  p({ first_name: "Albert", zoom_name: "02_Albert (Kaptan/กัปตัน)", jsd_number: "02", genmate_group: "C" }),
];

describe("filterPeople", () => {
  it("matches Thai nicknames", () => expect(filterPeople(list, { q: "แบล็ค" }).map((x) => x.first_name)).toEqual(["Aphiradee"]));
  it("matches skills case-insensitively", () => expect(filterPeople(list, { q: "react" }).map((x) => x.first_name)).toEqual(["Aphiradee"]));
  it("returns nothing for no match", () => expect(filterPeople(list, { q: "zzz" })).toEqual([]));
  it("filters by group", () => expect(filterPeople(list, { group: "I" }).map((x) => x.first_name)).toEqual(["Ajjima"]));
  it("sorts by number", () => expect(filterPeople(list, { sort: "no" }).map((x) => x.jsd_number)).toEqual(["01", "02", "03"]));
  it("sorts A–Z by English nickname", () => expect(filterPeople(list, { sort: "az" }).map((x) => x.first_name)).toEqual(["Aphiradee", "Albert", "Ajjima"]));
});
