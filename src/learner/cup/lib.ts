import type { CupCategory, GroupScore, MyCup } from "./types";

export const CATEGORIES: CupCategory[] = ["coding", "soft", "showing_up", "helping"];
export const CATEGORY_LABEL: Record<CupCategory, string> = { coding: "Coding", soft: "Soft skills", showing_up: "Showing up", helping: "Helping" };
const MOVE: Record<CupCategory, string> = {
  coding: "Ship a solid mini-project demo",
  soft: "Show up strong in the soft-skill class",
  showing_up: "Get the whole group in on time",
  helping: "Answer a classmate on the Talk Board",
};
export const SHOWING_UP_POINTS = 15;

const rankOf = (s: GroupScore[], g: string) => s.findIndex((x) => x.group === g);

/** "19 points to pass Group C. You're #2 with 64." */
export function headline(cup: MyCup): string {
  const s = cup.standings;
  const i = rankOf(s, cup.my_group);
  if (!cup.my_group || i < 0) return "You're not in a GenMate group yet.";
  const me = s[i];
  if (i === 0) {
    const gap = me.total - (s[1]?.total ?? 0);
    if (s.length === 1 || me.total === 0) return "Every point counts. Be the first on the board.";
    if (gap === 0) return `Tied on ${me.total} with Group ${s[1].group}. Coding points break the tie.`;
    return `You're leading. ${gap} ${gap === 1 ? "point" : "points"} ahead.`;
  }
  const above = s[i - 1];
  if (above.total === me.total) return `Tied on ${me.total} with Group ${above.group}. Coding points break the tie.`;
  const need = above.total - me.total + 1;
  return `${need} points to pass Group ${above.group}. You're #${i + 1} with ${me.total}.`;
}

export interface Move {
  category: CupCategory;
  text: string;
  gap: number;
}

/** Three moves, biggest category gap first (against #1, or #2 when leading). */
export function bestMoves(cup: MyCup): Move[] {
  const s = cup.standings;
  const i = rankOf(s, cup.my_group);
  if (i < 0) return [];
  const rival = i === 0 ? s[1] : s[0];
  const me = s[i];
  return CATEGORIES.map((c) => ({ category: c, text: MOVE[c], gap: (rival?.by_category[c] ?? 0) - me.by_category[c] }))
    .sort((a, b) => b.gap - a.gap)
    .slice(0, 3);
}

/** Up to three positive highlights about any group. */
export function moments(s: GroupScore[], todayIdx: number): string[] {
  const out: string[] = [];
  const together = [...s].sort((a, b) => b.by_category.showing_up - a.by_category.showing_up)[0];
  const days = Math.round((together?.by_category.showing_up ?? 0) / SHOWING_UP_POINTS);
  if (days >= 1) out.push(`Group ${together.group} was on time together ${days} ${days === 1 ? "day" : "days"} this week.`);
  if (todayIdx >= 0 && todayIdx < 5) {
    const jump = [...s].sort((a, b) => (b.by_day[todayIdx] ?? 0) - (a.by_day[todayIdx] ?? 0))[0];
    if (jump && jump.by_day[todayIdx] > 0) out.push(`Group ${jump.group} jumped +${jump.by_day[todayIdx]} today.`);
  }
  const helper = [...s].sort((a, b) => b.by_category.helping - a.by_category.helping)[0];
  if (helper && helper.by_category.helping > 0) out.push(`Group ${helper.group} leads in Helping with ${helper.by_category.helping}.`);
  return out.slice(0, 3);
}

/** Share of Mon 00:00 → Fri 16:45 gone, plus "ends in 2d 4h". */
export function weekProgress(now: Date, week: string, endsAt: string): { pct: number; left: string } {
  const start = new Date(`${week}T00:00:00+07:00`).getTime();
  const end = new Date(endsAt).getTime();
  const pct = Math.max(0, Math.min(1, (now.getTime() - start) / (end - start)));
  const mins = Math.max(0, Math.round((end - now.getTime()) / 60000));
  const d = Math.floor(mins / 1440), h = Math.floor((mins % 1440) / 60), m = mins % 60;
  const left = mins === 0 ? "week closed" : d > 0 ? `ends in ${d}d ${h}h` : h > 0 ? `ends in ${h}h ${m}m` : `ends in ${m}m`;
  return { pct, left };
}
