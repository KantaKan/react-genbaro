import type { StartupPitch } from "@/application/services/startupStoryService";
import { comboKey, ui } from "./startupStoryCatalog";

type PitchCardsProps = {
  pitches: StartupPitch[];
  hot: string[];
  discovered: string[];
  pending: boolean;
  onStartPitch: (index: number) => void;
};

export function PitchCards({ pitches, hot, discovered, pending, onStartPitch }: PitchCardsProps) {
  return <div className="space-y-3">
    <p className="text-xs font-black uppercase tracking-wider">Today's pitches · one tap to build</p>
    <ul className="grid gap-3 sm:grid-cols-3" aria-label="Pitch cards">
      {pitches.map((pitch, index) => {
        const key = comboKey(pitch.type, pitch.theme);
        const isHot = hot.includes(pitch.theme);
        const known = discovered.includes(key);
        return <li key={key} className={`${ui.card} flex flex-col space-y-3 p-4`}>
          <div className="flex items-start justify-between gap-2">
            <p className="text-lg font-black leading-snug">{pitch.title}</p>
            {isHot && <span role="img" aria-label="Hot theme">🔥</span>}
          </div>
          <p className="text-xs font-bold uppercase tracking-widest opacity-70">{pitch.type} × {pitch.theme}</p>
          {known && <p className="text-xs font-black">⭐ Great combo already discovered</p>}
          <button className={`${ui.button} mt-auto w-full bg-[#7bc4a8]`} disabled={pending} aria-label={`Start ${pitch.title}`} onClick={() => onStartPitch(index)}>
            Build this 🛠️
          </button>
        </li>;
      })}
    </ul>
  </div>;
}
