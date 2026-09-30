import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { StartupDev, StartupItem, StartupResult, StartupRun } from "@/application/services/startupStoryService";
import { baht, bosses, bossThreshold, comboKey, rarityStyle, reviewerIcons, spriteFor, teamCap, traits, ui, upcomingBoss } from "./startupStoryCatalog";

function Stat({ label, value }: { label: string; value: number }) {
  return <div className="flex items-center gap-2 text-xs font-bold">
    <span className="w-14 uppercase tracking-wide">{label}</span>
    <span className="h-2 flex-1 overflow-hidden rounded-full border border-[#292542] bg-white">
      <span className="block h-full bg-[#7bc4a8]" style={{ width: `${Math.min(100, value * 10)}%` }} />
    </span>
    <span className="w-4 text-right">{value}</span>
  </div>;
}

function DevCard({ dev, showSalary }: { dev: StartupDev; showSalary?: boolean }) {
  const trait = dev.trait ? traits[dev.trait] : undefined;
  return <div className="space-y-1">
    <p className="text-lg font-black">{spriteFor(dev)} {dev.name}{dev.genmate_id && <span title="A real genmate from your cohort" aria-label="genmate"> 🎓</span>}</p>
    <p className="text-xs font-bold opacity-70">{dev.title}{dev.perk ? ` · ${dev.perk}` : ""}</p>
    {trait && <p className="text-xs font-black" title={trait.desc}>{trait.label} <span className="font-bold opacity-70">· {trait.desc}</span></p>}
    <Stat label="Front" value={dev.frontend} />
    <Stat label="Back" value={dev.backend} />
    <Stat label="Design" value={dev.design} />
    <Stat label="Debug" value={dev.debug} />
    {showSalary && dev.salary > 0 && <p className="pt-1 text-xs font-black">💰 {baht(dev.salary)} / project</p>}
  </div>;
}

export function OfficeScene({ staff, busy, skin }: { staff: StartupDev[]; busy: boolean; skin?: string }) {
  const floor = skin === "rooftop-bangkok" ? "bg-[#f7c6a3]" : "bg-[#f4e3c3]";
  return <div className={`${ui.cardBase} ${floor} grid grid-cols-3 gap-3 p-4 sm:grid-cols-6`} aria-label="Office">
    {staff.map((dev) => <div key={dev.id} className="flex flex-col items-center gap-1">
      <span className={`text-4xl ${busy ? "motion-safe:animate-bounce" : ""}`}>{spriteFor(dev)}</span>
      <span className="h-3 w-14 rounded-sm border-2 border-[#292542] bg-[#b98b5e]" />
      <span className="max-w-full truncate text-xs font-black">{dev.name}</span>
    </div>)}
    {skin === "rooftop-bangkok" && <span className="col-span-full text-center text-xs font-black">🌆 Rooftop Bangkok</span>}
  </div>;
}

export function Hud({ run, items }: { run: StartupRun; items: StartupItem[] }) {
  const owned = (run.items ?? []).map((id) => items.find((it) => it.id === id)).filter((it): it is StartupItem => Boolean(it));
  return <div className="space-y-2">
    <div className="flex flex-wrap gap-2">
      {run.mode === "ranked" && <span className={`${ui.chip} bg-[#292542] !text-[#fffaf0]`}>🏆 Weekly Seed</span>}
      <span className={`${ui.chip} bg-[#fbe39a]`}>💰 {baht(run.money)}</span>
      <span className={`${ui.chip} bg-[#f7c6d9]`}>❤️ {run.fans.toLocaleString()} fans</span>
      <span className={`${ui.chip} bg-white`}>🗺️ Act {run.act}/3 · Project {(run.project_index % 3) + 1}/3</span>
    </div>
    {owned.length > 0 && <ul className="flex flex-wrap gap-1" aria-label="Your items">
      {owned.map((it, i) => <li key={`${it.id}-${i}`} title={`${it.name}: ${it.desc}`} className={`${ui.chip} ${rarityStyle[it.rarity]} px-2 py-1`}>{it.icon} <span className="sr-only">{it.name}</span></li>)}
    </ul>}
  </div>;
}

export function FounderPick({ offer, onPick, pending }: { offer: StartupDev[]; onPick: (index: number) => void; pending: boolean }) {
  return <section className="space-y-4">
    <h2 className="text-2xl font-black text-foreground">Pick your founder</h2>
    <div className="grid gap-4 sm:grid-cols-3">
      {offer.map((dev, i) => <button key={dev.id} className={`${ui.card} p-4 text-left transition hover:-translate-y-1 disabled:opacity-50`} onClick={() => onPick(i)} disabled={pending}>
        <DevCard dev={dev} />
      </button>)}
    </div>
  </section>;
}

type HubProps = {
  run: StartupRun;
  types: string[];
  themes: string[];
  items: StartupItem[];
  discovered: string[];
  skin?: string;
  pending: boolean;
  onStart: (type: string, theme: string, staffIds: string[]) => void;
  onHire: (candidateId: string) => void;
  onDismiss: (staffId: string) => void;
  onAbandon: () => void;
};

export function Hub({ run, types, themes, items, discovered, skin, pending, onStart, onHire, onDismiss, onAbandon }: HubProps) {
  const [tab, setTab] = useState<"project" | "team" | "hire">("project");
  const [type, setType] = useState("");
  const [theme, setTheme] = useState("");
  const [excluded, setExcluded] = useState<string[]>([]);
  const [confirmPivot, setConfirmPivot] = useState(false);
  const team = run.staff.filter((s) => !excluded.includes(s.id));
  const boss = upcomingBoss(run);
  const cap = teamCap(run.act);
  const hot = run.market?.hot ?? [];
  const cold = run.market?.cold ?? [];

  const choice = (value: string, selected: boolean, onClick: () => void, extra?: string) =>
    <button key={value} className={`${ui.chipBase} ${selected ? "bg-[#292542] text-[#fffaf0]" : "bg-white text-[#292542]"}`} aria-pressed={selected} onClick={onClick}>{value}{extra}</button>;
  const tabButton = (id: typeof tab, label: string) =>
    <button role="tab" aria-selected={tab === id} className={`${ui.chipBase} flex-1 ${tab === id ? "bg-[#292542] text-[#fffaf0]" : "bg-white text-[#292542]"}`} onClick={() => setTab(id)}>{label}</button>;

  return <section className="space-y-4">
    <Hud run={run} items={items} />
    <OfficeScene staff={run.staff} busy={false} skin={skin} />
    <div role="tablist" className="flex gap-2">
      {tabButton("project", boss ? "👹 Boss" : "🛠️ Project")}
      {tabButton("team", `👥 Team ${run.staff.length}/${cap}`)}
      {tabButton("hire", `🤝 Hire (${run.candidates?.length ?? 0})`)}
    </div>

    {tab === "project" && <div className={`${ui.card} space-y-4 p-4`}>
      {boss && bosses[boss] && <div className="rounded-2xl border-2 border-[#292542] bg-[#f7c6d9] p-3">
        <p className="text-xs font-black uppercase tracking-widest">Boss fight</p>
        <p className="text-lg font-black">{bosses[boss].name}</p>
        <p className="text-sm font-bold">{bosses[boss].twist} Reach {bossThreshold(run.act)}/40 to pass.</p>
      </div>}
      <h2 className="text-xl font-black">{boss ? "Build for the boss" : "New project"}</h2>
      <div><p className="mb-2 text-xs font-black uppercase tracking-wider">Product</p><div className="flex flex-wrap gap-2">{types.map((t) => choice(t, type === t, () => setType(t)))}</div></div>
      <div>
        <p className="mb-2 text-xs font-black uppercase tracking-wider">Theme <span className="normal-case tracking-normal opacity-70">· 🔥 hot · 🧊 cold this run</span></p>
        <div className="flex flex-wrap gap-2">{themes.map((t) => choice(t, theme === t, () => setTheme(t), hot.includes(t) ? " 🔥" : cold.includes(t) ? " 🧊" : ""))}</div>
      </div>
      {type && theme && discovered.includes(comboKey(type, theme)) && <p className="text-xs font-black">📒 You've shipped {type} × {theme} before.</p>}
      <div>
        <p className="mb-2 text-xs font-black uppercase tracking-wider">Team on this project</p>
        <div className="flex flex-wrap gap-2">{run.staff.map((s) => choice(`${spriteFor(s)} ${s.name}`, !excluded.includes(s.id), () => setExcluded((prev) => prev.includes(s.id) ? prev.filter((id) => id !== s.id) : [...prev, s.id])))}</div>
      </div>
      <button className={`${ui.button} w-full bg-[#7bc4a8]`} disabled={!type || !theme || team.length === 0 || pending} onClick={() => onStart(type, theme, team.map((s) => s.id))}>
        {boss ? "Face the boss 👹" : "Start building 🛠️"}
      </button>
    </div>}

    {tab === "team" && <div className="grid gap-3 sm:grid-cols-2">
      {run.staff.map((dev) => <div key={dev.id} className={`${ui.card} space-y-3 p-4`}>
        <DevCard dev={dev} showSalary />
        {run.staff.length > 1 && <button className={`${ui.button} w-full bg-white py-2`} disabled={pending} onClick={() => onDismiss(dev.id)}>Let go 👋</button>}
      </div>)}
    </div>}

    {tab === "hire" && <div className="grid gap-3 sm:grid-cols-3">
      {(run.candidates ?? []).length === 0 && <p className={`${ui.card} p-4 text-sm font-bold`}>No candidates right now. New ones show up after every ship.</p>}
      {(run.candidates ?? []).map((dev) => {
        const full = run.staff.length >= cap;
        const broke = run.money < dev.salary;
        return <div key={dev.id} className={`${ui.card} space-y-3 p-4`}>
          <DevCard dev={dev} showSalary />
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

function useSecondsLeft(endsAt: string, clockOffset: number) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(id);
  }, []);
  return Math.max(0, Math.ceil((Date.parse(endsAt) - (now + clockOffset)) / 1000));
}

const statKeys = [["frontend", "FE"], ["backend", "BE"], ["design", "Design"], ["debug", "Debug"]] as const;

function useBubbles(team: StartupDev[], active: boolean) {
  const [bubbles, setBubbles] = useState<{ id: number; x: number; text: string }[]>([]);
  const reduced = useReducedMotion();
  useEffect(() => {
    if (!active || reduced || team.length === 0) return;
    let next = 0;
    const id = window.setInterval(() => {
      const dev = team[Math.floor(Math.random() * team.length)];
      const [key, label] = statKeys[Math.floor(Math.random() * statKeys.length)];
      const text = Math.random() < 0.15 ? "🐛" : `+${Math.max(1, Math.round(dev[key] / 2))} ${label}`;
      const bubble = { id: next++, x: 10 + Math.random() * 80, text };
      setBubbles((prev) => [...prev.slice(-6), bubble]);
    }, 700);
    return () => window.clearInterval(id);
  }, [active, reduced, team]);
  return bubbles;
}

export function DevPhase({ run, clockOffset, onShip, pending, items, skin }: { run: StartupRun; clockOffset: number; onShip: () => void; pending: boolean; items: StartupItem[]; skin?: string }) {
  const project = run.project!;
  const left = useSecondsLeft(project.ends_at, clockOffset);
  const total = Math.max(1, (Date.parse(project.ends_at) - Date.parse(project.started_at)) / 1000);
  const percent = Math.min(100, Math.max(0, 100 - (left / total) * 100));
  const [team] = useState(() => run.staff.filter((s) => project.staff_ids.includes(s.id)));
  const bubbles = useBubbles(team, left > 0);
  const boss = project.boss ? bosses[project.boss] : undefined;
  return <section className="space-y-4">
    <Hud run={run} items={items} />
    <div className="relative">
      <OfficeScene staff={team} busy={left > 0} skin={skin} />
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <AnimatePresence>
          {bubbles.map((b) => <motion.span key={b.id} className="absolute bottom-6 rounded-full border-2 border-[#292542] bg-white px-2 py-0.5 text-xs font-black text-[#292542]" style={{ left: `${b.x}%` }}
            initial={{ opacity: 0, y: 0 }} animate={{ opacity: [0, 1, 0], y: -70 }} exit={{ opacity: 0 }} transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}>{b.text}</motion.span>)}
        </AnimatePresence>
      </div>
    </div>
    <div className={`${ui.card} space-y-3 p-4`}>
      {boss && <p className="text-xs font-black uppercase tracking-widest">👹 {boss.name}</p>}
      <h2 className="text-xl font-black">{project.type} · {project.theme}</h2>
      <div className="h-4 overflow-hidden rounded-full border-2 border-[#292542] bg-white" role="progressbar" aria-label="Build progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(percent)}>
        <div className="h-full bg-[#7bc4a8] transition-[width]" style={{ width: `${percent}%` }} />
      </div>
      <p className="text-sm font-bold">{left > 0 ? `Building... ${left}s` : "Ready to ship! 🚀"}</p>
      <button className={`${ui.button} w-full bg-[#f4ba87]`} disabled={left > 0 || pending} onClick={onShip}>Ship it</button>
    </div>
  </section>;
}

export function ItemDraft({ run, items, onPick, pending }: { run: StartupRun; items: StartupItem[]; onPick: (index: number) => void; pending: boolean }) {
  const offer = (run.item_offer ?? []).map((id) => items.find((it) => it.id === id));
  return <section className="space-y-4">
    <Hud run={run} items={items} />
    <h2 className="text-2xl font-black text-foreground">Pick an item 🎁</h2>
    <p className="text-sm font-bold text-foreground opacity-80">Items stack for the rest of this run. ☠️ Cursed ones hit hard both ways.</p>
    <div className="grid gap-4 sm:grid-cols-3">
      {offer.map((it, i) => <button key={`${run.item_offer?.[i]}-${i}`} className={`${ui.cardBase} ${it ? rarityStyle[it.rarity] : "bg-white"} space-y-2 p-4 text-left transition hover:-translate-y-1 disabled:opacity-50`} disabled={pending} onClick={() => onPick(i)}>
        <p className="text-4xl">{it?.icon ?? "🎁"}</p>
        <p className="text-lg font-black">{it?.name ?? run.item_offer?.[i]}</p>
        {it && <p className="text-xs font-black uppercase tracking-widest">{it.rarity === "cursed" ? "☠️ cursed" : it.rarity}</p>}
        {it && <p className="text-sm font-bold">{it.desc}</p>}
      </button>)}
    </div>
  </section>;
}

export type BossOutcome = { name: string; passed: boolean; threshold: number };

export function ReviewDialog({ result, boss, onClose }: { result: StartupResult; boss?: BossOutcome; onClose: () => void }) {
  const reduced = useReducedMotion();
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#292542]/60 p-4" role="dialog" aria-modal="true" aria-label="Reviews">
    <div className={`${ui.card} max-h-[90vh] w-full max-w-md space-y-3 overflow-y-auto p-5`}>
      <p className="text-xs font-black uppercase tracking-widest">{result.type} · {result.theme} · {result.combo} combo</p>
      <h2 className="text-3xl font-black">{result.total}/40</h2>
      {boss && <p className={`rounded-2xl border-2 border-[#292542] p-3 text-sm font-black ${boss.passed ? "bg-[#7bc4a8]" : "bg-[#f7c6d9]"}`}>
        {boss.passed ? `${boss.name} defeated! 🎉` : `${boss.name} needed ${boss.threshold}. Time to pivot 🐱`}
      </p>}
      {result.reviews.map((r, i) => <motion.div key={r.reviewer} className="rounded-2xl border-2 border-[#292542] bg-white p-3"
        initial={reduced ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: reduced ? 0 : 0.25 + i * 0.35, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}>
        <div className="flex items-center justify-between font-black"><span>{reviewerIcons[r.reviewer]} {r.reviewer}</span><span>{r.score}/10</span></div>
        <p className="mt-1 text-sm">{r.line}</p>
      </motion.div>)}
      <p className="text-sm font-bold">💰 {result.money_delta >= 0 ? "+" : ""}{baht(result.money_delta)} · ❤️ +{result.fans_delta.toLocaleString()} fans · 🐛 {result.bugs} bugs</p>
      <button className={`${ui.button} w-full bg-[#7bc4a8]`} onClick={onClose} autoFocus>Nice!</button>
    </div>
  </div>;
}

export function RunEnd({ run, fameGain, newUnlocks, onDone }: { run: StartupRun; fameGain: number | null; newUnlocks: string[]; onDone: () => void }) {
  const ipo = run.outcome === "ipo";
  return <section className={`${ui.card} space-y-3 p-6 text-center`}>
    <p className="text-5xl">{ipo ? "🔔🔥" : "🐱"}</p>
    <h2 className="text-3xl font-black">{ipo ? "IPO! You rang the bell!" : "Your startup pivoted"}</h2>
    <p className="text-sm font-bold">{ipo ? "From garage to IPO. สุดยอดมาก!" : "Every founder pivots. Your studio keeps everything you learned. ไปต่อกัน!"}</p>
    <p className="text-sm font-bold">{baht(run.money)} · {run.fans.toLocaleString()} fans · {run.bosses_passed} bosses beaten</p>
    <div className="flex flex-wrap justify-center gap-2">
      <span className={`${ui.chip} bg-[#fbe39a]`}>Score {run.score.toLocaleString()}</span>
      {fameGain !== null && <span className={`${ui.chip} bg-[#cab2f1]`}>⭐ +{fameGain} fame</span>}
    </div>
    {newUnlocks.length > 0 && <p className="text-sm font-black">🔓 Unlocked: {newUnlocks.join(", ")}</p>}
    <div><button className={`${ui.button} bg-[#7bc4a8]`} onClick={onDone}>Back to lobby</button></div>
  </section>;
}
