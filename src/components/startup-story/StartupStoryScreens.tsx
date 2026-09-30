import { useEffect, useState } from "react";
import type { StartupDev, StartupResult, StartupRun } from "@/application/services/startupStoryService";

const card = "rounded-[22px] border-[4px] border-[#292542] bg-[#fffaf0] text-[#292542] shadow-[6px_7px_0_#292542]";
const button = "rounded-full border-[3px] border-[#292542] px-5 py-3 text-sm font-black shadow-[3px_4px_0_#292542] transition active:translate-y-[2px] active:shadow-[1px_2px_0_#292542] disabled:opacity-50";
const chipBase = "rounded-full border-2 border-[#292542] px-3 py-2 text-xs font-black";
const chip = `${chipBase} text-[#292542]`;

const sprites: Record<string, string> = { hustler: "🧑‍💻", designer: "🧑‍🎨", wizard: "🧙", grad: "🎓" };
const reviewerIcons: Record<string, string> = { "Tech Lead": "🧔", Users: "🙋", Investor: "💼", "Dev Community": "🌐" };

const baht = (n: number) => `฿${n.toLocaleString()}`;

function Stat({ label, value }: { label: string; value: number }) {
  return <div className="flex items-center gap-2 text-xs font-bold">
    <span className="w-14 uppercase tracking-wide">{label}</span>
    <span className="h-2 flex-1 overflow-hidden rounded-full border border-[#292542] bg-white">
      <span className="block h-full bg-[#7bc4a8]" style={{ width: `${Math.min(100, value * 10)}%` }} />
    </span>
    <span className="w-4 text-right">{value}</span>
  </div>;
}

function DevCard({ dev }: { dev: StartupDev }) {
  return <div className="space-y-1">
    <p className="text-lg font-black">{sprites[dev.sprite] ?? "🧑‍💻"} {dev.name}</p>
    <p className="text-xs font-bold opacity-70">{dev.title}{dev.perk ? ` · ${dev.perk}` : ""}</p>
    <Stat label="Front" value={dev.frontend} />
    <Stat label="Back" value={dev.backend} />
    <Stat label="Design" value={dev.design} />
    <Stat label="Debug" value={dev.debug} />
  </div>;
}

export function OfficeScene({ staff, busy }: { staff: StartupDev[]; busy: boolean }) {
  return <div className={`${card} grid grid-cols-3 gap-3 bg-[#f4e3c3] p-4`} aria-label="Office">
    {staff.map((dev) => <div key={dev.id} className="flex flex-col items-center gap-1">
      <span className={`text-4xl ${busy ? "motion-safe:animate-bounce" : ""}`}>{sprites[dev.sprite] ?? "🧑‍💻"}</span>
      <span className="h-3 w-14 rounded-sm border-2 border-[#292542] bg-[#b98b5e]" />
      <span className="text-xs font-black">{dev.name}</span>
    </div>)}
  </div>;
}

export function Hud({ run }: { run: StartupRun }) {
  return <div className="flex flex-wrap gap-2 text-xs font-black">
    <span className={`${chip} bg-[#fbe39a]`}>💰 {baht(run.money)}</span>
    <span className={`${chip} bg-[#f7c6d9]`}>❤️ {run.fans.toLocaleString()} fans</span>
    <span className={`${chip} bg-white`}>📦 Project {run.project_index + 1}</span>
  </div>;
}

export function Lobby({ fame, onStart, pending }: { fame: number; onStart: () => void; pending: boolean }) {
  return <section className={`${card} space-y-4 p-6 text-center`}>
    <p className="text-5xl">🚀</p>
    <h1 className="text-3xl font-black tracking-tight">Baro Startup Story</h1>
    <p className="text-sm font-bold opacity-80">Found a startup, build apps, survive the reviews. ทุกรอบไม่เหมือนกัน!</p>
    <p className={`${chip} mx-auto inline-block bg-[#cab2f1]`}>⭐ Fame {fame}</p>
    <div><button className={`${button} bg-[#7bc4a8]`} onClick={onStart} disabled={pending}>Free Play</button></div>
  </section>;
}

export function FounderPick({ offer, onPick, pending }: { offer: StartupDev[]; onPick: (index: number) => void; pending: boolean }) {
  return <section className="space-y-4">
    <h2 className="text-2xl font-black text-foreground">Pick your founder</h2>
    <div className="grid gap-4 sm:grid-cols-3">
      {offer.map((dev, i) => <button key={dev.id} className={`${card} p-4 text-left transition hover:-translate-y-1 disabled:opacity-50`} onClick={() => onPick(i)} disabled={pending}>
        <DevCard dev={dev} />
      </button>)}
    </div>
  </section>;
}

export function Hub({ run, types, themes, onStart, pending }: { run: StartupRun; types: string[]; themes: string[]; onStart: (type: string, theme: string) => void; pending: boolean }) {
  const [type, setType] = useState("");
  const [theme, setTheme] = useState("");
  const pick = (value: string, selected: string, set: (v: string) => void) =>
    <button key={value} className={`${chipBase} ${selected === value ? "bg-[#292542] text-[#fffaf0]" : "bg-white text-[#292542]"}`} aria-pressed={selected === value} onClick={() => set(value)}>{value}</button>;
  return <section className="space-y-4">
    <Hud run={run} />
    <OfficeScene staff={run.staff} busy={false} />
    <div className={`${card} space-y-4 p-4`}>
      <h2 className="text-xl font-black">New project</h2>
      <div><p className="mb-2 text-xs font-black uppercase tracking-wider">Product</p><div className="flex flex-wrap gap-2">{types.map((t) => pick(t, type, setType))}</div></div>
      <div><p className="mb-2 text-xs font-black uppercase tracking-wider">Theme</p><div className="flex flex-wrap gap-2">{themes.map((t) => pick(t, theme, setTheme))}</div></div>
      <button className={`${button} w-full bg-[#7bc4a8]`} disabled={!type || !theme || pending} onClick={() => onStart(type, theme)}>Start building 🛠️</button>
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

export function DevPhase({ run, clockOffset, onShip, pending }: { run: StartupRun; clockOffset: number; onShip: () => void; pending: boolean }) {
  const project = run.project!;
  const left = useSecondsLeft(project.ends_at, clockOffset);
  const total = Math.max(1, (Date.parse(project.ends_at) - Date.parse(project.started_at)) / 1000);
  const percent = Math.min(100, Math.max(0, 100 - (left / total) * 100));
  return <section className="space-y-4">
    <Hud run={run} />
    <OfficeScene staff={run.staff} busy={left > 0} />
    <div className={`${card} space-y-3 p-4`}>
      <h2 className="text-xl font-black">{project.type} · {project.theme}</h2>
      <div className="h-4 overflow-hidden rounded-full border-2 border-[#292542] bg-white" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(percent)}>
        <div className="h-full bg-[#7bc4a8] transition-[width]" style={{ width: `${percent}%` }} />
      </div>
      <p className="text-sm font-bold">{left > 0 ? `Building... ${left}s` : "Ready to ship! 🚀"}</p>
      <button className={`${button} w-full bg-[#f4ba87]`} disabled={left > 0 || pending} onClick={onShip}>Ship it</button>
    </div>
  </section>;
}

export function ReviewDialog({ result, onClose }: { result: StartupResult; onClose: () => void }) {
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#292542]/60 p-4" role="dialog" aria-modal="true" aria-label="Reviews">
    <div className={`${card} max-h-[90vh] w-full max-w-md space-y-3 overflow-y-auto p-5`}>
      <p className="text-xs font-black uppercase tracking-widest">{result.type} · {result.theme} · {result.combo} combo</p>
      <h2 className="text-3xl font-black">{result.total}/40</h2>
      {result.reviews.map((r) => <div key={r.reviewer} className="rounded-2xl border-2 border-[#292542] bg-white p-3">
        <div className="flex items-center justify-between font-black"><span>{reviewerIcons[r.reviewer]} {r.reviewer}</span><span>{r.score}/10</span></div>
        <p className="mt-1 text-sm">{r.line}</p>
      </div>)}
      <p className="text-sm font-bold">💰 {result.money_delta >= 0 ? "+" : ""}{baht(result.money_delta)} · ❤️ +{result.fans_delta.toLocaleString()} fans · 🐛 {result.bugs} bugs</p>
      <button className={`${button} w-full bg-[#7bc4a8]`} onClick={onClose} autoFocus>Nice!</button>
    </div>
  </div>;
}

export function RunEnd({ run, onDone }: { run: StartupRun; onDone: () => void }) {
  return <section className={`${card} space-y-3 p-6 text-center`}>
    <p className="text-5xl">🔥</p>
    <h2 className="text-3xl font-black">Startup complete!</h2>
    <p className="text-sm font-bold">{baht(run.money)} · {run.fans.toLocaleString()} fans</p>
    <p className={`${chip} mx-auto inline-block bg-[#fbe39a]`}>Score {run.score.toLocaleString()}</p>
    <div><button className={`${button} bg-[#7bc4a8]`} onClick={onDone}>Back to lobby</button></div>
  </section>;
}

