import type { User } from "@/domain/types";
import type { AvatarConfig } from "../avatar/types";
import { nicknames } from "./name";

export type Person = User & { avatar?: AvatarConfig | null; skills?: string[] };
export interface PeopleQuery {
  q?: string;
  group?: string; // "All" or a letter
  sort?: "az" | "no" | "group";
}

const num = (p: Person) => Number(p.jsd_number ?? 999);

export function filterPeople(list: Person[], { q = "", group = "All", sort = "az" }: PeopleQuery): Person[] {
  const needle = q.trim().toLowerCase();
  const out = list.filter((p) => {
    if (group !== "All" && p.genmate_group !== group) return false;
    if (!needle) return true;
    const n = nicknames(p.zoom_name, p.first_name);
    const hay = [n.en, n.th, p.first_name, p.last_name, ...(p.skills ?? [])].join(" ").toLowerCase();
    return hay.includes(needle);
  });
  const en = (p: Person) => nicknames(p.zoom_name, p.first_name).en.toLowerCase();
  out.sort(
    sort === "no"
      ? (a, b) => num(a) - num(b)
      : sort === "group"
        ? (a, b) => (a.genmate_group ?? "").localeCompare(b.genmate_group ?? "") || num(a) - num(b)
        : (a, b) => en(a).localeCompare(en(b))
  );
  return out;
}
