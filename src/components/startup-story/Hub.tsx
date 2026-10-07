import { useState } from "react";
import type { StartupDeskPrices, StartupInfraCatalog, StartupOffice, StartupItem, StartupPerk, StartupRole, StartupRun } from "@/application/services/startupStoryService";
import { baht, bossInfo, comboKey, deskUpgrade, nextDeskPrice, passMarkFor, roleLook, teamHints, ui, upcomingBoss } from "./startupStoryCatalog";
import { DevCard } from "./DevCard";
import { Desk } from "./office/OfficeRoom";
import { InfraPanel } from "./InfraPanel";
import { PixelIcon } from "./office/PixelIcon";
import { PitchCards } from "./PitchCards";

type HubProps = {
  run: StartupRun;
  types: string[];
  themes: string[];
  items: StartupItem[];
  roles?: StartupRole[];
  perks?: StartupPerk[];
  discovered: string[];
  skin?: string;
  pending: boolean;
  onStart: (type: string, theme: string, staffIds: string[]) => void;
  onStartPitch: (pitchIndex: number, staffIds: string[]) => void;
  ratings?: Record<string, string>;
  onHire: (candidateId: string) => void;
  deskPrices?: StartupDeskPrices;
  onBuyDesk: () => void;
  onUpgradeDesk: (index: number) => void;
  offices?: StartupOffice[];
  onMoveOffice: (id: string) => void;
  infraCatalog?: StartupInfraCatalog;
  onInfra: (action: string, index?: number, id?: string) => void;
  onDismiss: (staffId: string) => void;
  onAbandon: () => void;
};

export function Hub({ run, types, themes, roles, perks, discovered, ratings, pending, onStart, onStartPitch, onHire, onDismiss, onAbandon, deskPrices, onBuyDesk, onUpgradeDesk, offices = [], onMoveOffice, infraCatalog, onInfra }: HubProps) {
  const [tab, setTab] = useState<"project" | "team" | "hire" | "office" | "infra" | null>("project");
  const [type, setType] = useState("");
  const [theme, setTheme] = useState("");
  const [excluded, setExcluded] = useState<string[]>([]);
  const [confirmPivot, setConfirmPivot] = useState(false);
  const [customProject, setCustomProject] = useState(false);
  const team = run.staff.filter((s) => !excluded.includes(s.id));
  const boss = upcomingBoss(run);
  const desks = run.desks ?? [1, 1];
  const cap = desks.length;
  const deskLimit = run.desk_limit ?? cap;
  const nextDesk = deskPrices ? nextDeskPrice(deskPrices, desks.length) : 0;
  const officeAt = Math.max(0, offices.findIndex((o) => o.id === run.office));
  const currentOffice = offices[officeAt];
  const nextOffice = offices[officeAt + 1];
  const hot = run.market?.hot ?? [];
  const cold = run.market?.cold ?? [];
  const pitches = run.pitches ?? [];
  const showPicker = customProject || pitches.length === 0;

  const choice = (value: string, selected: boolean, onClick: () => void, extra?: string) =>
    <button key={value} className={`${ui.chipBase} ${selected ? "bg-[#292542] text-[#fffaf0]" : "bg-white text-[#292542]"}`} aria-pressed={selected} onClick={onClick}>{value}{extra}</button>;
  const tabButton = (id: NonNullable<typeof tab>, label: string, icon: string) =>
    <button role="tab" aria-selected={tab === id} aria-controls="ss-sheet"
      className={`ss-pixel flex min-w-0 flex-col items-center gap-1 px-1 py-2 text-xs font-semibold ${tab === id ? "bg-[#fbe39a] text-[#292542] shadow-[inset_0_-3px_0_#e2a12b]" : "text-[#d8d4ea] shadow-[inset_0_-3px_0_#15122a] hover:bg-[#3b3f6b]"}`}
      onClick={() => setTab(tab === id ? null : id)}>
      <PixelIcon name={icon} size={2} />
      <span className="max-w-full truncate">{label}</span>
    </button>;

  return <section className="space-y-4">
    <nav role="tablist" aria-label="Game menu" className="grid grid-cols-5 gap-1 bg-[#292542] p-1 shadow-[0_-4px_0_#292542,0_4px_0_#292542,-4px_0_0_#292542,4px_0_0_#292542]">
      {tabButton("project", boss ? "Boss" : "Project", boss ? "skull" : "clipboard")}
      {tabButton("team", `Team ${run.staff.length}/${cap}`, "team")}
      {tabButton("hire", `Hire (${run.candidates?.length ?? 0})`, "hire")}
      {tabButton("office", "Office", "desk")}
      {tabButton("infra", "Infra", "server")}
    </nav>
    {tab && <div id="ss-sheet" className="ss-sheet space-y-4">

    {tab === "project" && <div className={`${ui.card} space-y-4 p-4`}>
      {boss && bossInfo(boss, run.oss) && <div className="rounded-2xl border-2 border-[#292542] bg-[#f7c6d9] p-3">
        <p className="text-xs font-black uppercase tracking-widest">Boss fight</p>
        <p className="text-lg font-black">{bossInfo(boss, run.oss).name}</p>
        <p className="text-sm font-bold">{bossInfo(boss, run.oss).twist} Reach {passMarkFor(run)}/{boss === "ipo-pitch" ? 50 : 40} to pass.</p>
      </div>}
      <h2 className="text-xl font-black">{boss ? "Build for the boss" : "New project"}</h2>
      <div>
        <p className="mb-2 text-xs font-black uppercase tracking-wider">Team on this project</p>
        <div className="flex flex-wrap gap-2">{run.staff.map((s) => choice(`${s.name} · ${roleLook(s.role).short}`, !excluded.includes(s.id), () => setExcluded((prev) => prev.includes(s.id) ? prev.filter((id) => id !== s.id) : [...prev, s.id])))}</div>
      </div>
      {team.length > 0 && <ul className="space-y-1" aria-label="Team check">
        {teamHints(team, boss).map((h) => <li key={h.text} className={`rounded-xl border-2 border-[#292542] px-3 py-1 text-xs font-bold ${h.tone === "warn" ? "bg-[#f7c6d9]" : "bg-[#d6f0e4]"}`}>{h.text}</li>)}
      </ul>}
      {!showPicker && <>
        <PitchCards pitches={pitches} hot={hot} ratings={ratings ?? {}} pending={pending || team.length === 0} onStartPitch={(i) => onStartPitch(i, team.map((s) => s.id))} />
        <button className="text-sm font-bold underline underline-offset-4" onClick={() => setCustomProject(true)}>Custom project</button>
      </>}
      {showPicker && <>
        {pitches.length > 0 && <button className="text-sm font-bold underline underline-offset-4" onClick={() => setCustomProject(false)}>← Today's pitches</button>}
        <div><p className="mb-2 text-xs font-black uppercase tracking-wider">Product</p><div className="flex flex-wrap gap-2">{types.map((t) => choice(t, type === t, () => setType(t)))}</div></div>
        <div>
          <p className="mb-2 text-xs font-black uppercase tracking-wider">Theme <span className="normal-case tracking-normal opacity-70">· hot and cold this run are marked</span></p>
          <div className="flex flex-wrap gap-2">{themes.map((t) => choice(t, theme === t, () => setTheme(t), hot.includes(t) ? " · hot" : cold.includes(t) ? " · cold" : ""))}</div>
        </div>
        {type && theme && discovered.includes(comboKey(type, theme)) && <p className="text-xs font-black">You've shipped {type} × {theme} before.</p>}
        <button className={`${ui.button} w-full bg-[#7bc4a8]`} disabled={!type || !theme || team.length === 0 || pending} onClick={() => onStart(type, theme, team.map((s) => s.id))}>
          {boss ? "Face the boss" : "Start building"}
        </button>
      </>}
    </div>}

    {tab === "team" && <div className="grid gap-3 sm:grid-cols-2">
      {run.staff.map((dev) => <div key={dev.id} className={`${ui.card} space-y-3 p-4`}>
        <DevCard dev={dev} showSalary roles={roles} perks={perks} />
        {run.staff.length > 1 && dev.wildcard !== "vim" && <button className={`${ui.button} w-full bg-white py-2`} disabled={pending} onClick={() => onDismiss(dev.id)}>Let go</button>}
      </div>)}
    </div>}

    {tab === "hire" && <div className="grid gap-3 sm:grid-cols-3">
      {(run.candidates ?? []).length === 0 && <p className={`${ui.card} p-4 text-sm font-bold`}>No candidates right now. New ones show up after every ship.</p>}
      {(run.candidates ?? []).map((dev) => {
        const full = run.staff.length >= cap;
        const broke = run.money < dev.salary;
        return <div key={dev.id} className={`${ui.card} space-y-3 p-4`}>
          <DevCard dev={dev} showSalary roles={roles} />
          <button className={`${ui.button} w-full bg-[#7bc4a8] py-2`} disabled={pending || full || broke} onClick={() => onHire(dev.id)}>
            {full ? "No free desk" : broke ? "Not enough ฿" : "Hire"}
          </button>
        </div>;
      })}
    </div>}

    {tab === "office" && <div className="space-y-3">
      {currentOffice && <div className={`${ui.card} flex flex-wrap items-center justify-between gap-3 p-4`}>
        <div>
          <p className="text-xs font-black uppercase tracking-widest">Your office</p>
          <p className="text-lg font-black">{currentOffice.name} · {currentOffice.desks} desks</p>
        </div>
        {nextOffice
          ? <button className={`${ui.button} bg-[#cab2f1] py-2`} disabled={pending || run.act < nextOffice.act || run.money < nextOffice.price} onClick={() => onMoveOffice(nextOffice.id)}>
              {run.act < nextOffice.act ? `${nextOffice.name} unlocks in Act ${nextOffice.act}` : `Move to ${nextOffice.name} (${nextOffice.desks} desks) ${baht(nextOffice.price)}`}
            </button>
          : <p className="text-sm font-bold">Top floor. Nowhere higher to go.</p>}
      </div>}
      <p className={`${ui.card} p-4 text-sm font-bold`}>
        Every person needs a desk. Better desks give +1 per tier to the best skill of whoever sits there, and the best desks go to your earliest hires.
        {" "}You can also tap a desk in the office.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        {desks.map((tier, i) => {
          const up = deskUpgrade(tier, run.act, run.money, deskPrices);
          return <div key={i} className={`${ui.card} flex items-center gap-3 p-3`}>
            <svg viewBox="0 0 64 40" className="h-auto w-20 shrink-0" shapeRendering="crispEdges" aria-hidden="true"><Desk x={32} y={40} tier={tier} busy={false} /></svg>
            <div className="min-w-0 flex-1 space-y-2">
              <p className="text-sm font-black">Desk {i + 1} · Tier {tier}{tier > 1 && <span className="font-bold opacity-70"> · +{tier - 1} skill</span>}</p>
              <button className={`${ui.button} w-full bg-[#fbe39a] py-2`} disabled={pending || Boolean(up.blocked)} onClick={() => onUpgradeDesk(i)}>
                {up.blocked ?? `Upgrade ${baht(up.price)}`}
              </button>
            </div>
          </div>;
        })}
      </div>
      {desks.length < deskLimit
        ? <button className={`${ui.button} w-full bg-[#7bc4a8]`} disabled={pending || run.money < nextDesk} onClick={onBuyDesk}>Buy a desk ฿{nextDesk.toLocaleString()}</button>
        : <p className="text-center text-sm font-bold text-foreground">This office is full. Move to a bigger office to add desks.</p>}
    </div>}

    {tab === "infra" && <InfraPanel run={run} catalog={infraCatalog} pending={pending} onAction={onInfra} />}

    {tab === "project" && <div className="text-right">
      {confirmPivot
        ? <span className="inline-flex flex-wrap items-center justify-end gap-2 text-sm font-bold text-foreground">End this run as a pivot?
            <button className={`${ui.button} bg-[#f7c6d9] py-2`} disabled={pending} onClick={onAbandon}>Yes, pivot</button>
            <button className={`${ui.button} bg-white py-2`} onClick={() => setConfirmPivot(false)}>Keep going</button>
          </span>
        : <button className="text-sm font-bold text-foreground underline underline-offset-4" onClick={() => setConfirmPivot(true)}>Pivot early</button>}
    </div>}
    </div>}
  </section>;
}
