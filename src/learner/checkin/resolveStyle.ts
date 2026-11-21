import { STYLES, styleById, type StyleMeta } from "./styles/registry";
import { dailyStyle, styleUnlocked } from "./styles/unlock";

/** Saved style if known and unlocked; today's random pick in surprise mode; otherwise Slide. */
export function resolveStyle(
  prefs: { checkin_style: string; checkin_random: boolean },
  streak: number,
  perfectWeek: boolean,
  date: string,
  seed: string,
  reroll: number,
  champion = false
): StyleMeta {
  const slide = styleById("slide")!;
  if (prefs.checkin_random) {
    const ids = STYLES.filter((m) => styleUnlocked(m, streak, perfectWeek, champion)).map((m) => m.id);
    return styleById(dailyStyle(ids, date, seed, reroll)) ?? slide;
  }
  const m = styleById(prefs.checkin_style || "slide");
  return m && styleUnlocked(m, streak, perfectWeek, champion) ? m : slide;
}
