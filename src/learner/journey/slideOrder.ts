import type { Extras, Journey, SlideId } from "./types";

const MIN_STORY = 5;

/** Which slides this learner's story has; a slide with no data is left out, never shown empty. */
export function slidesFor(j: Journey, x: Extras): SlideId[] {
  if (!j.unlocked) return [];
  const out: SlideId[] = ["cover", "grid"];
  if ((j.written ?? 0) >= MIN_STORY) {
    if (j.main_zone) out.push("zone");
    if (j.hardest_week) out.push("week");
    if (j.darkest_night && !x.hideNight) out.push("night");
    if (j.comeback) out.push("comeback");
    if (j.attendance_rate != null || (j.badges ?? 0) > 0 || (j.ta_replies ?? 0) > 0 || x.cupMedals > 0 || x.baroName) out.push("tiles");
  }
  if (j.quote) out.push("closing");
  return out;
}
