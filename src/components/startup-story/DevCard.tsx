import type { StartupDev, StartupRole } from "@/application/services/startupStoryService";
import { baht, roleLook, spriteFor, traits } from "./startupStoryCatalog";

function Stat({ label, value }: { label: string; value: number }) {
  return <div className="flex items-center gap-2 text-xs font-bold">
    <span className="w-14 uppercase tracking-wide">{label}</span>
    <span className="h-2 flex-1 overflow-hidden rounded-full border border-[#292542] bg-white">
      <span className="block h-full bg-[#7bc4a8]" style={{ width: `${Math.min(100, value * 10)}%` }} />
    </span>
    <span className="w-4 text-right">{value}</span>
  </div>;
}

export function RoleBadge({ role, roles }: { role?: string; roles?: StartupRole[] }) {
  const look = roleLook(role);
  const job = roles?.find((r) => r.id === role)?.job;
  return <span className="inline-flex items-center gap-1 rounded-full border-2 border-[#292542] px-2 py-0.5 text-xs font-black text-white" style={{ background: look.color }} title={job}>{look.short} · {look.label}</span>;
}

export function DevCard({ dev, showSalary, roles }: { dev: StartupDev; showSalary?: boolean; roles?: StartupRole[] }) {
  const trait = dev.trait ? traits[dev.trait] : undefined;
  const job = roles?.find((r) => r.id === dev.role)?.job;
  return <div className="space-y-1">
    <p className="text-lg font-black">{spriteFor(dev)} {dev.name}{dev.genmate_id && <span title="A real genmate from your cohort" aria-label="genmate"> 🎓</span>}</p>
    {dev.role && <RoleBadge role={dev.role} roles={roles} />}
    {job && <p className="text-xs font-bold">{job}</p>}
    {(!dev.role || dev.perk) && <p className="text-xs font-bold opacity-70">{dev.role ? dev.perk : [dev.title, dev.perk].filter(Boolean).join(" · ")}</p>}
    {trait && <p className="text-xs font-black" title={trait.desc}>{trait.label} <span className="font-bold opacity-70">· {trait.desc}</span></p>}
    <Stat label="Front" value={dev.frontend} />
    <Stat label="Back" value={dev.backend} />
    <Stat label="Design" value={dev.design} />
    <Stat label="Debug" value={dev.debug} />
    {showSalary && dev.salary > 0 && <p className="pt-1 text-xs font-black">💰 {baht(dev.salary)} / project</p>}
  </div>;
}
