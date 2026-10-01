import { useState } from "react";
import type { StartupItem, StartupPerk, StartupRole, StartupRun } from "@/application/services/startupStoryService";
import { bossInfo, comboKey, passMarkFor, roleLook, teamCap, teamHints, ui, upcomingBoss } from "./startupStoryCatalog";
import { DevCard } from "./DevCard";
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
  onDismiss: (staffId: string) => void;
  onAbandon: () => void;
};

export function Hub({ run, types, themes, roles, perks, discovered, ratings, pending, onStart, onStartPitch, onHire, onDismiss, onAbandon }: HubProps) {
  const [tab, setTab] = useState<"project" | "team" | "hire">("project");
  const [type, setType] = useState("");
  const [theme, setTheme] = useState("");
  const [excluded, setExcluded] = useState<string[]>([]);
  const [confirmPivot, setConfirmPivot] = useState(false);
  const [customProject, setCustomProject] = useState(false);
  const team = run.staff.filter((s) => !excluded.includes(s.id));
  const boss = upcomingBoss(run);
  const cap = teamCap(run.act);
  const hot = run.market?.hot ?? [];
  const cold = run.market?.cold ?? [];
  const pitches = run.pitches ?? [];
  const showPicker = customProject || pitches.length === 0;

  const choice = (value: string, selected: boolean, onClick: () => void, extra?: string) =>
    <button key={value} className={`${ui.chipBase} ${selected ? "bg-[#292542] text-[#fffaf0]" : "bg-white text-[#292542]"}`} aria-pressed={selected} onClick={onClick}>{value}{extra}</button>;
  const tabButton = (id: typeof tab, label: string) =>
    <button role="tab" aria-selected={tab === id} className={`${ui.chipBase} flex-1 ${tab === id ? "bg-[#292542] text-[#fffaf0]" : "bg-white text-[#292542]"}`} onClick={() => setTab(id)}>{label}</button>;

  return <section className="space-y-4">
    <div role="tablist" className="flex gap-2">
      {tabButton("project", boss ? "👹 Boss" : "🛠️ Project")}
      {tabButton("team", `👥 Team ${run.staff.length}/${cap}`)}
      {tabButton("hire", `🤝 Hire (${run.candidates?.length ?? 0})`)}
    </div>

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
        <button className="text-sm font-bold underline underline-offset-4" onClick={() => setCustomProject(true)}>✏️ Custom project</button>
      </>}
      {showPicker && <>
        {pitches.length > 0 && <button className="text-sm font-bold underline underline-offset-4" onClick={() => setCustomProject(false)}>← Today's pitches</button>}
        <div><p className="mb-2 text-xs font-black uppercase tracking-wider">Product</p><div className="flex flex-wrap gap-2">{types.map((t) => choice(t, type === t, () => setType(t)))}</div></div>
        <div>
          <p className="mb-2 text-xs font-black uppercase tracking-wider">Theme <span className="normal-case tracking-normal opacity-70">· 🔥 hot · 🧊 cold this run</span></p>
          <div className="flex flex-wrap gap-2">{themes.map((t) => choice(t, theme === t, () => setTheme(t), hot.includes(t) ? " 🔥" : cold.includes(t) ? " 🧊" : ""))}</div>
        </div>
        {type && theme && discovered.includes(comboKey(type, theme)) && <p className="text-xs font-black">📒 You've shipped {type} × {theme} before.</p>}
        <button className={`${ui.button} w-full bg-[#7bc4a8]`} disabled={!type || !theme || team.length === 0 || pending} onClick={() => onStart(type, theme, team.map((s) => s.id))}>
          {boss ? "Face the boss 👹" : "Start building 🛠️"}
        </button>
      </>}
    </div>}

    {tab === "team" && <div className="grid gap-3 sm:grid-cols-2">
      {run.staff.map((dev) => <div key={dev.id} className={`${ui.card} space-y-3 p-4`}>
        <DevCard dev={dev} showSalary roles={roles} perks={perks} />
        {run.staff.length > 1 && <button className={`${ui.button} w-full bg-white py-2`} disabled={pending} onClick={() => onDismiss(dev.id)}>Let go 👋</button>}
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
            {full ? "Team full" : broke ? "Not enough ฿" : "Hire"}
          </button>
        </div>;
      })}
    </div>}

    <div className="text-right">
      {confirmPivot
        ? <span className="inline-flex flex-wrap items-center justify-end gap-2 text-sm font-bold text-foreground">End this run as a pivot?
            <button className={`${ui.button} bg-[#f7c6d9] py-2`} disabled={pending} onClick={onAbandon}>Yes, pivot 🐱</button>
            <button className={`${ui.button} bg-white py-2`} onClick={() => setConfirmPivot(false)}>Keep going</button>
          </span>
        : <button className="text-sm font-bold text-foreground underline underline-offset-4" onClick={() => setConfirmPivot(true)}>Pivot early</button>}
    </div>
  </section>;
}
