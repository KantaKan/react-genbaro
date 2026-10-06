import type { StartupPitch } from "@/application/services/startupStoryService";
import { comboKey, ui } from "./startupStoryCatalog";

const ratingLabel: Record<string, string> = { great: "⭐⭐⭐ Great combo (shipped before)", good: "⭐⭐ Good combo (shipped before)", meh: "⭐ Meh combo (shipped before)" };

type PitchCardsProps = {
  pitches: StartupPitch[];
  hot: string[];
  ratings: Record<string, string>;
  pending: boolean;
  onStartPitch: (index: number) => void;
};

export function PitchCards({ pitches, hot, ratings, pending, onStartPitch }: PitchCardsProps) {
  return <div className="space-y-3">
    <p className="text-xs font-black uppercase tracking-wider">Today's pitches · one tap to build</p>
    <ul className="grid gap-3 sm:grid-cols-3" aria-label="Pitch cards">
      {pitches.map((pitch, index) => {
        const key = comboKey(pitch.type, pitch.theme);
        const isHot = hot.includes(pitch.theme);
        const rating = ratings[key];
        return <li key={key} className={`${ui.card} flex flex-col space-y-3 p-4`}>
          <div className="flex items-start justify-between gap-2">
            <p className="text-lg font-black leading-snug">{pitch.title}</p>
            {isHot && <span role="img" aria-label="Hot theme">🔥</span>}
          </div>
          <p className="text-xs font-bold uppercase tracking-widest opacity-70">{pitch.type} × {pitch.theme}</p>
          {rating && <p className="text-xs font-black">{ratingLabel[rating] ?? rating}</p>}
          <button className={`${ui.button} mt-auto w-full bg-[#7bc4a8]`} disabled={pending} aria-label={`Start ${pitch.title}`} onClick={() => onStartPitch(index)}>
            Build this 🛠️
          </button>
        </li>;
      })}
    </ul>
  </div>;
}
