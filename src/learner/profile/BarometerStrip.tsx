import { useState } from "react";
import type { Reflection } from "@/domain/types";
import { reflectionZones } from "@/components/reflection-zones";
import { BarometerFace, ZONES, type ZoneId } from "../today/BarometerFace";

const zoneOf = (label: string): ZoneId | undefined =>
  reflectionZones.find((z) => z.label.toLowerCase() === label.toLowerCase() || z.aliases?.some((a) => a.toLowerCase() === label.toLowerCase()))?.id as ZoneId | undefined;

export function BarometerStrip({ reflections }: { reflections: Reflection[] }) {
  const [range, setRange] = useState<"all" | "4w">("all");
  const sorted = [...reflections].sort((a, b) => ((a.day || a.date) > (b.day || b.date) ? 1 : -1));
  const days = (range === "4w" ? sorted.slice(-20) : sorted).map((r) => ({ r, z: zoneOf(r.reflection?.barometer ?? "") })).filter((x): x is { r: Reflection; z: ZoneId } => !!x.z);
  const counts = ZONES.map((z) => days.filter((d) => d.z === z.id).length);
  const top = ZONES[counts.indexOf(Math.max(...counts))];
  return (
    <section className="l-card p-[22px]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-title font-semibold">My learning barometer</h3>
          <p className="mt-0.5 text-small text-l-ink3">How each day felt. Only you and TAs can see this.</p>
        </div>
        <div className="flex rounded-[10px] bg-l-sub p-[3px]">
          {(["all", "4w"] as const).map((v) => (
            <button key={v} type="button" aria-pressed={range === v} onClick={() => setRange(v)} className={`rounded-lg px-3 py-1 text-small font-semibold ${range === v ? "bg-l-card text-l-ink shadow-sm" : "text-l-ink2"}`}>
              {v === "all" ? "All" : "Last 4 weeks"}
            </button>
          ))}
        </div>
      </div>
      {days.length === 0 ? (
        <p className="mt-4 text-body text-l-ink3">No reflections yet. Your first one opens at 16:30.</p>
      ) : (
        <>
          <div data-testid="barometer-strip" className="mt-4 flex flex-wrap gap-[3px]">
            {days.map(({ r, z }) => {
              const m = ZONES.find((x) => x.id === z)!;
              return <i key={r._id ?? r.date} data-testid="baro-bar" title={`${r.day || r.date.slice(0, 10)}: ${r.reflection.barometer}`} className="block h-[22px] w-2.5 rounded-[3px]" style={{ background: `linear-gradient(180deg, ${m.c1}, ${m.c2})` }} />;
            })}
          </div>
          <div className="mt-3.5 flex h-2.5 overflow-hidden rounded-full">
            {counts.map((c, i) => (
              <i key={ZONES[i].id} className="block h-full" style={{ width: `${(c / days.length) * 100}%`, background: ZONES[i].c2 }} />
            ))}
          </div>
          <div className="mt-2.5 flex flex-wrap gap-3.5 text-xs text-l-ink2">
            {ZONES.map((z, i) => (
              <span key={z.id} className="inline-flex items-center gap-1.5">
                <BarometerFace zone={z.id} size={18} />
                {z.a} {z.b !== "zone" ? z.b : ""} <b className="text-l-ink">{counts[i]}</b>
              </span>
            ))}
          </div>
          <p className="mt-3.5 rounded-[14px] bg-l-sub px-3.5 py-3 text-body text-l-ink2">
            Mostly <b className="text-l-ink">{top.a}{top.b !== "zone" ? `, ${top.b}` : " zone"}</b>. {counts[2] + counts[3] > 0 ? "Hard days are normal. Tell a TA when it piles up." : "Nice and steady."}
          </p>
        </>
      )}
    </section>
  );
}
