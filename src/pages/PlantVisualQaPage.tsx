import { useMemo, useState } from "react";
import { GenmateField, type FarmFrameMetrics, type GenmateFieldMember } from "@/components/farm/GenmateField";
import { SeedlingPlant } from "@/components/streak-components";
import { resolvePlantAppearance } from "@/lib/plant-appearance";
import { getAllPalettes, SPECIES } from "@/lib/plant-variants";
import { getTierDayThreshold, type PlantTier } from "@/lib/streak-milestones";

const palettes = getAllPalettes();
const tiers: PlantTier[] = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

export default function PlantVisualQaPage() {
  const [tier, setTier] = useState<PlantTier>(7);
  const [active, setActive] = useState(true);
  const [frameMetrics, setFrameMetrics] = useState<FarmFrameMetrics | null>(null);
  const members: GenmateFieldMember[] = useMemo(() => SPECIES.map((species, index) => ({
    id: `qa-${species}`,
    name: species,
    appearance: resolvePlantAppearance({
      userId: `qa-${species}`,
      tier,
      active,
      growthPoints: 120,
      overrides: {
        species,
        palette: palettes[index % palettes.length]?.name,
      },
    }),
    displayStreakDays: active ? getTierDayThreshold(tier) : 0,
  })), [tier, active]);

  return (
    <main className="min-h-screen bg-[#15241f] p-4 text-[#ecf5e9] md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="border-b border-[#547a64] pb-5">
          <p className="font-mono text-xs font-semibold uppercase tracking-[0.22em] text-[#d4a950]">Plant field guide · development</p>
          <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="font-serif text-4xl">One plant, two views</h1>
              <p className="mt-2 text-sm text-[#b7ccb9]">Compare the same 23 species in the 3D farm and 2D collection before release.</p>
            </div>
            <p className="rounded-full border border-[#547a64] px-3 py-1 font-mono text-xs text-[#b7ccb9]">23 species · 10 growth tiers</p>
          </div>
        </header>

        <section aria-label="Appearance controls" className="flex flex-wrap items-center gap-4 rounded-xl border border-[#547a64] bg-[#1d3028] p-4">
          <label className="flex items-center gap-2 text-sm font-medium" htmlFor="qa-tier">
            Growth tier
            <select id="qa-tier" value={tier} onChange={(event) => setTier(Number(event.target.value) as PlantTier)} className="rounded-md border border-[#668773] bg-[#15241f] px-3 py-2 text-[#ecf5e9] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#d4a950]">
              {tiers.map((value) => <option key={value} value={value}>{value} · {getTierDayThreshold(value)} days</option>)}
            </select>
          </label>
          <div className="flex items-center gap-2 text-sm" role="group" aria-label="Plant state">
            <span className="font-medium">State</span>
            <button type="button" aria-pressed={active} onClick={() => setActive(true)} className={`rounded-full border px-3 py-1.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#d4a950] ${active ? "border-[#d4a950] bg-[#375c43]" : "border-[#668773]"}`}>Growing</button>
            <button type="button" aria-pressed={!active} onClick={() => setActive(false)} className={`rounded-full border px-3 py-1.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#d4a950] ${!active ? "border-[#d4a950] bg-[#375c43]" : "border-[#668773]"}`}>Resting</button>
          </div>
          <p className="basis-full text-xs text-[#b7ccb9]">These controls change appearance only. They do not update streaks or learner data.</p>
        </section>

        <section aria-labelledby="farm-heading">
          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="farm-heading" className="font-serif text-2xl">3D field</h2>
            <output className="font-mono text-xs text-[#b7ccb9]" aria-label="Farm rendering metrics">
              {frameMetrics ? `${frameMetrics.fps} observed fps · ${frameMetrics.pixelRatio.toFixed(1)}× DPR` : "Measuring while visible…"}
            </output>
          </div>
          <GenmateField members={members} onFrameMetrics={setFrameMetrics} renderDetails={(id) => {
            const member = members.find((candidate) => candidate.id === id);
            return member ? <div className="flex items-center gap-2 overflow-hidden rounded-xl border border-[#547a64] bg-[#15241f] px-3 py-1"><SeedlingPlant appearance={member.appearance} showParticles={false} className="h-16 w-14" /><span className="text-xs">2D match</span></div> : null;
          }} />
        </section>

        <section aria-labelledby="specimens-heading" className="border-t border-[#547a64] pt-6">
          <h2 id="specimens-heading" className="font-serif text-2xl">2D specimens</h2>
          <p className="mt-1 text-sm text-[#b7ccb9]">Same appearance data as the field above; scan the silhouette, pot, and palette.</p>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {members.map((member, index) => <article key={member.id} className="rounded-xl border border-[#547a64] bg-[#1d3028] p-3">
              <div className="flex min-h-28 items-center justify-center overflow-hidden rounded-lg bg-[#dcebd8]"><SeedlingPlant appearance={member.appearance} showParticles={false} className="h-24 w-20" /></div>
              <p className="mt-3 font-mono text-[10px] text-[#d4a950]">{String(index + 1).padStart(2, "0")}</p>
              <h3 className="text-sm font-semibold capitalize">{member.name}</h3>
              <p className="text-xs text-[#b7ccb9]">{member.appearance.tierCapabilities.name} · {member.appearance.state}</p>
            </article>)}
          </div>
        </section>
      </div>
    </main>
  );
}
