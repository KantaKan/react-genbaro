import { DevAvatar } from "./office/DevAvatar";
import type { StartupDev, StartupPerk, StartupRole } from "@/application/services/startupStoryService";
import { baht, isSassy, roleLook, traits } from "./startupStoryCatalog";
import { BurnoutBar } from "./BurnoutBar";

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

function LevelLine({ dev, perks }: { dev: StartupDev; perks?: StartupPerk[] }) {
  const level = Math.max(1, dev.level ?? 1);
  const next = dev.xp_next ?? 0;
  return <div className="space-y-1">
    <div className="flex items-center gap-2 text-xs font-bold">
      <span className="w-14 rounded-full border-2 border-[#292542] bg-[#fbe39a] px-1 text-center font-black">Lv {level}</span>
      {next > 0 && <span className="h-2 flex-1 overflow-hidden rounded-full border border-[#292542] bg-white" role="progressbar" aria-label="XP to next level" aria-valuemin={0} aria-valuemax={next} aria-valuenow={dev.xp ?? 0}>
        <span className="block h-full bg-[#cab2f1]" style={{ width: `${Math.min(100, ((dev.xp ?? 0) / next) * 100)}%` }} />
      </span>}
    </div>
    {(dev.perks ?? []).length > 0 && <ul className="flex flex-wrap gap-1" aria-label="Perks">
      {(dev.perks ?? []).map((id) => {
        const perk = perks?.find((p) => p.id === id);
        return <li key={id} title={perk?.desc} className="rounded-full border-2 border-[#292542] bg-[#cab2f1] px-2 py-0.5 text-xs font-black">{perk?.name ?? id}</li>;
      })}
    </ul>}
  </div>;
}

export function DevCard({ dev, showSalary, roles, perks }: { dev: StartupDev; showSalary?: boolean; roles?: StartupRole[]; perks?: StartupPerk[] }) {
  const trait = dev.trait ? traits[dev.trait] : undefined;
  const job = roles?.find((r) => r.id === dev.role)?.job;
  return <div className="space-y-1">
    <p className="flex items-center gap-2 text-lg font-black"><DevAvatar dev={dev} />{dev.name}{dev.genmate_id && <span title="A real genmate from your cohort" className="rounded-full border-2 border-[#292542] bg-[#fbe39a] px-2 text-xs">Genmate</span>}</p>
    {dev.wildcard && <p className="inline-flex rounded-full border-2 border-[#292542] bg-[#cab2f1] px-2 py-0.5 text-xs font-black">Wildcard · {dev.title}</p>}
    {dev.wildcard_desc && <p className="text-xs font-bold">{dev.wildcard_desc}</p>}
    {dev.role && !dev.wildcard && <RoleBadge role={dev.role} roles={roles} />}
    {isSassy(dev) && <span className="ml-1 inline-flex rounded-full border-2 border-[#292542] bg-[#f7c6d9] px-2 py-0.5 text-xs font-black" title="ชอบแซะเพื่อนร่วมทีม ศัพท์ Gen Z เต็มปาก">ปากแซ่บ</span>}
    {job && <p className="text-xs font-bold">{job}</p>}
    {!dev.wildcard && (!dev.role || dev.perk) && <p className="text-xs font-bold opacity-70">{dev.role ? dev.perk : [dev.title, dev.perk].filter(Boolean).join(" · ")}</p>}
    {trait && <p className="text-xs font-black" title={trait.desc}>{trait.label} <span className="font-bold opacity-70">· {trait.desc}</span></p>}
    {(dev.level || dev.xp || dev.perks?.length) ? <LevelLine dev={dev} perks={perks} /> : null}
    <Stat label="Front" value={dev.frontend} />
    <Stat label="Back" value={dev.backend} />
    <Stat label="Design" value={dev.design} />
    <Stat label="Debug" value={dev.debug} />
    {(dev.burnout ?? 0) > 0 && <BurnoutBar value={dev.burnout ?? 0} />}
    {showSalary && dev.salary > 0 && <p className="pt-1 text-xs font-black">{baht(dev.salary)} / project</p>}
  </div>;
}
