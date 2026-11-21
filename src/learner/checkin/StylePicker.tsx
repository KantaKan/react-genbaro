import { useState } from "react";
import { useQueryClient } from "react-query";
import { toast } from "react-toastify";
import { Lock } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { learnerApi, LearnerApiError } from "../api";
import type { MySummary } from "../types";
import { STYLES, type StyleMeta } from "./styles/registry";
import { styleUnlocked, unlockProgress } from "./styles/unlock";
import { StyleThumb } from "./StyleThumb";
import { setSound, soundOn, play } from "./sound";

const GROUPS: [StyleMeta["group"], string][] = [
  ["clean", "Clean"],
  ["fun", "Fun"],
  ["unlock", "Unlock with your streak"],
];

function Switch({ on, label, onChange }: { on: boolean; label: string; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => onChange(!on)}
      className={`relative h-5 w-[34px] shrink-0 rounded-full transition-colors ${on ? "bg-l-ink" : "bg-l-hair"}`}
    >
      <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform duration-300 ${on ? "translate-x-4" : "translate-x-0.5"}`} />
    </button>
  );
}

export function StylePicker({ open, onOpenChange, summary }: { open: boolean; onOpenChange: (o: boolean) => void; summary: MySummary }) {
  const qc = useQueryClient();
  const prefs = summary.preferences ?? { checkin_style: "slide", checkin_random: false };
  const [sound, setSoundState] = useState(soundOn);
  const [shake, setShake] = useState<string | null>(null);

  const save = async (p: Partial<MySummary["preferences"]>) => {
    const prev = qc.getQueryData<MySummary>(["my-summary"]);
    if (prev) qc.setQueryData(["my-summary"], { ...prev, preferences: { ...prev.preferences, ...p } });
    try {
      await learnerApi.savePreferences(p);
    } catch (e) {
      if (prev) qc.setQueryData(["my-summary"], prev);
      toast.error(e instanceof LearnerApiError && e.status === 403 ? "Locked: keep your streak going" : e instanceof Error ? e.message : "Couldn't save");
    } finally {
      qc.invalidateQueries(["my-summary"]);
    }
  };

  const pick = (m: StyleMeta, unlocked: boolean) => {
    if (!unlocked) {
      setShake(m.id);
      setTimeout(() => setShake(null), 350);
      return;
    }
    play("blip");
    save({ checkin_style: m.id, checkin_random: false });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="learner flex w-full flex-col gap-0 overflow-y-auto border-l-0 bg-l-card p-0 text-l-ink sm:max-w-[460px]">
        <SheetHeader className="p-6 pb-2 text-left">
          <SheetTitle className="text-lg text-l-ink">Check-in style</SheetTitle>
          <SheetDescription className="text-l-ink3">Saved to your account. Every style follows the same rules.</SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-2 px-6">
          <div className="flex items-center gap-3 rounded-2xl bg-gradient-to-br from-orange-50 to-pink-50 px-4 py-3 dark:from-orange-500/10 dark:to-pink-500/10">
            <b className="text-2xl font-bold tracking-tight text-orange-600">{summary.streak}</b>
            <span className="text-[13px] text-l-ink2">day on-time streak. Longer streaks unlock more styles.</span>
          </div>
          <label className="flex items-center justify-between gap-3 rounded-2xl px-1 py-2 text-[13.5px]">
            <span>
              <b className="block font-semibold">Surprise me every day</b>
              <span className="text-[12px] text-l-ink3">A random unlocked style each morning, with one reroll</span>
            </span>
            <Switch on={prefs.checkin_random} label="Surprise me every day" onChange={(v) => save({ checkin_random: v })} />
          </label>
          <label className="flex items-center justify-between gap-3 px-1 pb-1 text-[13.5px]">
            <span className="font-semibold">Sound</span>
            <Switch
              on={sound}
              label="Sound"
              onChange={(v) => {
                setSound(v);
                setSoundState(v);
                if (v) play("blip");
              }}
            />
          </label>
        </div>
        <div className="flex flex-col gap-5 p-6 pt-3">
          {GROUPS.map(([g, title]) => (
            <section key={g}>
              <h4 className="mb-2.5 text-[12px] font-semibold uppercase tracking-[.08em] text-l-ink3">{title}</h4>
              <div className="grid grid-cols-3 gap-2.5">
                {STYLES.filter((m) => m.group === g).map((m) => {
                  const unlocked = styleUnlocked(m, summary.streak, summary.perfect_week);
                  const prog = unlockProgress(m, summary.streak);
                  const selected = !prefs.checkin_random && (prefs.checkin_style || "slide") === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => pick(m, unlocked)}
                      className={`relative rounded-2xl p-2 pb-2.5 text-center transition duration-300 hover:-translate-y-0.5 ${
                        selected ? "shadow-[0_0_0_2px_var(--l-ink)]" : "shadow-[0_0_0_1px_var(--l-hair)]"
                      } ${shake === m.id ? "animate-[l-shake_.3s]" : ""}`}
                    >
                      <span className={`mb-2 grid h-[70px] place-items-center rounded-xl bg-l-sub ${unlocked ? "" : "opacity-40 blur-[1px] grayscale"}`}>
                        <StyleThumb id={m.id} />
                      </span>
                      <b className="block text-[12.5px] font-semibold">{m.name}</b>
                      <small className="text-[11px] text-l-ink3">{m.sub}</small>
                      {!unlocked && (
                        <span className="absolute inset-x-2 top-[52px] text-center">
                          <span className="flex items-center justify-center gap-1 text-[10px] font-semibold">
                            <Lock className="h-2.5 w-2.5" />
                            {prog ? `${prog.have} / ${prog.need} days` : "Perfect week"}
                          </span>
                          {prog && (
                            <span className="mt-0.5 block h-1 overflow-hidden rounded-full bg-l-hair">
                              <i className="block h-full rounded-full bg-gradient-to-r from-orange-500 to-pink-500" style={{ width: `${(prog.have / prog.need) * 100}%` }} />
                            </span>
                          )}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
        <style>{`@keyframes l-shake{0%,100%{transform:translateX(0)}33%{transform:translateX(-5px)}66%{transform:translateX(5px)}}`}</style>
      </SheetContent>
    </Sheet>
  );
}
