import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { Crown, Play, RotateCcw, Sparkles, X } from "lucide-react";
import { godEventService, type GodEvent, type GodEventPreset } from "@/application/services/godEventService";
import type { ShowcaseEntry } from "@/application/services/showcaseLawnService";
import { stampService } from "@/application/services/stampService";
import { BaroCharacterArt } from "./BaroCharacterArt";

const INTRO_MS = 6500;

const presets: Array<{ id: GodEventPreset; title: string; cue: string }> = [
  { id: "star_rain", title: "ฝนดาว", cue: "ฟ้ามืดลง ดาวตกทั่วลาน" },
  { id: "god_entrance", title: "เทพลงลาน", cue: "คู่หูผู้แคสต์ลอยลงกลางลาน" },
  { id: "character_parade", title: "ขบวนเพื่อนจิ๋ว", cue: "ทุกคนเดินพาเหรดข้ามลาน" },
];

function godEventTitle(preset: GodEventPreset) {
  return presets.find((item) => item.id === preset)?.title ?? "เหตุการณ์บนลาน";
}

function useGodEvents(userId: string | null | undefined) {
  return useQuery(["god-events", userId], godEventService.list, { enabled: Boolean(userId), retry: false, refetchInterval: 60_000 });
}

function StarRain({ intro }: { intro: boolean }) {
  return <>{Array.from({ length: intro ? 28 : 6 }, (_, i) => <span key={i} className="god-star absolute text-[#fff4b8] drop-shadow-[0_0_6px_#fff4b8]" style={{ left: `${(i * 37) % 100}%`, fontSize: `${10 + (i % 4) * 5}px`, "--fall": `${intro ? 1.6 + (i % 5) * 0.35 : 5 + (i % 3)}s`, "--delay": `${(i % 9) * (intro ? 0.35 : 1.4)}s` } as CSSProperties}>{i % 3 ? "✦" : "✧"}</span>)}</>;
}

function Entrance({ event, intro }: { event: GodEvent; intro: boolean }) {
  return <>
    {intro && <span className="god-flash absolute inset-0 bg-white" />}
    <span className={`absolute left-1/2 w-[clamp(90px,14%,150px)] -translate-x-1/2 ${intro ? "god-descend" : "god-hover top-[38%]"}`}>
      <Crown className="absolute -top-[22%] left-1/2 h-1/3 w-1/2 -translate-x-1/2 rotate-6 text-[#f5c451] drop-shadow-[2px_2px_0_#292542]" />
      <span className="block" style={{ aspectRatio: "220 / 280" }}>{event.character ? <BaroCharacterArt dna={event.character.dna} id={`god-${event.id}`} /> : <Crown className="h-full w-full text-[#292542]" />}</span>
      <span className="absolute inset-x-0 -bottom-2 mx-auto h-3 w-3/4 rounded-[50%] bg-[#fff4b8]/70 blur-sm" />
    </span>
  </>;
}

function Parade({ entries, intro }: { entries: ShowcaseEntry[]; intro: boolean }) {
  return <>
    <svg viewBox="0 0 100 10" preserveAspectRatio="none" className="absolute inset-x-0 top-14 h-[8%] w-full">
      <path d="M0 1 Q25 7 50 2 T100 1" fill="none" stroke="#292542" strokeWidth=".3" />
      {Array.from({ length: 16 }, (_, i) => <path key={i} d={`M${3 + i * 6.2} ${2.6 + Math.sin(i) * 1.4} l1.6 4 l1.6 -4 Z`} fill={["#f48fb1", "#ffd166", "#8fd3f0", "#9fd8a0"][i % 4]} />)}
    </svg>
    {intro && <span className="god-parade absolute bottom-[6%] flex items-end gap-2">
      {entries.slice(0, 12).map((entry, i) => <span key={entry.owner_id} className="god-march block w-[clamp(56px,9vw,110px)] shrink-0" style={{ aspectRatio: "220 / 280", animationDelay: `${(i % 2) * 0.35}s` }}><BaroCharacterArt dna={entry.character.dna} id={`parade-${entry.owner_id}`} prop={entry.prop} /></span>)}
      <span className="mb-[4%] text-3xl">🎉</span>
    </span>}
  </>;
}

export function LawnGodEvent({ event, replay, entries, motion, onCloseReplay, children }: { event?: GodEvent; replay: boolean; entries: ShowcaseEntry[]; motion: boolean; onCloseReplay: () => void; children: ReactNode }) {
  const [playKey, setPlayKey] = useState(0);
  const [intro, setIntro] = useState(false);
  const eventId = event?.id;
  useEffect(() => {
    if (!eventId || !motion) return setIntro(false);
    setIntro(true);
    const timer = window.setTimeout(() => setIntro(false), INTRO_MS);
    return () => window.clearTimeout(timer);
  }, [eventId, motion, playKey]);
  if (!event) return <div className="relative h-full">{children}</div>;
  const title = godEventTitle(event.preset);
  return <div className="relative h-full" data-god-event={event.preset} data-god-phase={intro ? "intro" : "ambient"}>
    {children}
    <div aria-hidden="true" data-god-event-layer={event.preset} className="pointer-events-none absolute inset-0 z-[950] overflow-hidden">
      {event.preset === "star_rain" && <><span className={`absolute inset-0 bg-[#1b1640] transition-opacity duration-1000 ${intro ? "opacity-45" : "opacity-10"}`} /><StarRain intro={intro} /></>}
      {event.preset === "god_entrance" && <Entrance event={event} intro={intro} />}
      {event.preset === "character_parade" && <Parade entries={entries} intro={intro} />}
    </div>
    <section aria-label={`${replay ? "เล่นซ้ำ" : "กำลังเกิดขึ้น"}: ${title}`} className="absolute left-1/2 top-16 z-[960] flex w-[min(92%,34rem)] -translate-x-1/2 items-center gap-3 rounded-2xl border-2 border-[#292542] bg-[#fffaf0]/95 px-4 py-2 text-[#292542] shadow-[3px_4px_0_#292542]">
      <Sparkles aria-hidden="true" className="h-5 w-5 shrink-0 text-[#f5a524] motion-safe:animate-pulse" />
      <div className="min-w-0 flex-1"><p className="text-xs font-black uppercase tracking-[.16em]">{replay ? "เล่นซ้ำ" : "LIVE"} · {title} · {event.cohort === 0 ? "ทุกรุ่น" : `รุ่น ${event.cohort}`}</p><p className="break-words text-sm font-black leading-snug">{event.caption}</p></div>
      {motion && <button type="button" onClick={() => setPlayKey((value) => value + 1)} aria-label="ดูอีกครั้ง" className="shrink-0 rounded-full border-2 border-[#292542] p-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><RotateCcw className="h-4 w-4" /></button>}
      {replay && <button type="button" onClick={onCloseReplay} aria-label="ปิดการเล่นซ้ำ" className="shrink-0 rounded-full border-2 border-[#292542] p-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><X className="h-4 w-4" /></button>}
    </section>
  </div>;
}

export function GodEventHistory({ userId, admin, replayId, onReplay, onCast }: { userId: string | null | undefined; admin: boolean; replayId: string | null; onReplay: (id: string) => void; onCast: () => void }) {
  const queryClient = useQueryClient();
  const [preset, setPreset] = useState<GodEventPreset>("star_rain");
  const [caption, setCaption] = useState("");
  const [cohort, setCohort] = useState(0);
  const events = useGodEvents(userId);
  const cohorts = useQuery(["god-event-cohorts", userId], stampService.listCohorts, { enabled: Boolean(userId && admin), retry: false });
  const cast = useMutation(() => godEventService.cast(preset, caption, cohort), { onSuccess: async () => { setCaption(""); await queryClient.invalidateQueries(["god-events", userId]); onCast(); } });
  const list = events.data ?? [];
  const validCaption = caption.trim().length > 0 && [...caption.trim()].length <= 160 && ![...caption].some((character) => character === "<" || character === ">" || character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127);

  return <section aria-labelledby="god-event-heading" className="font-register-body">
    <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.18em] text-primary"><Sparkles className="h-4 w-4" /> LAWN MOMENTS</p>
    <h2 id="god-event-heading" className="mt-1 font-register-heading text-xl">สมุดเหตุการณ์</h2>
    {events.isLoading && <p role="status" className="mt-3 text-sm">กำลังดูเหตุการณ์บนลาน…</p>}
    {events.isError && <div role="alert" className="mt-3 text-sm">ยังโหลดเหตุการณ์ไม่ได้ <button type="button" onClick={() => events.refetch()} className="font-bold underline">ลองใหม่</button></div>}
    {!events.isLoading && !events.isError && list.length === 0 && <p className="mt-3 text-sm text-muted-foreground">ยังไม่มีเหตุการณ์พิเศษ ลานเงียบ ๆ ก็น่าอยู่นะ 🌱</p>}
    {list.length > 0 && <div className="mt-3 grid gap-2">{list.map((event) => <button key={event.id} type="button" onClick={() => onReplay(event.id)} aria-label={`ดูซ้ำ ${event.caption}`} className={`rounded-xl border p-3 text-left text-xs shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${replayId === event.id ? "border-primary bg-primary/10" : "border-border bg-card"}`}><span className="flex items-center gap-1 font-bold"><Play className="h-3 w-3" /> {godEventTitle(event.preset)}</span><span className="mt-1 block truncate">{event.caption}</span><span className="mt-1 block text-xs text-muted-foreground">{event.cohort === 0 ? "ทุกรุ่น" : `รุ่น ${event.cohort}`} · {event.active ? "กำลังแสดง" : "ย้อนหลัง"}</span></button>)}</div>}
    {admin && <div className="mt-6 rounded-2xl border border-border bg-card p-4 text-card-foreground shadow-sm"><p className="text-xs font-bold uppercase tracking-[.18em] text-primary">GOD MODE · ADMIN ONLY</p><h3 className="mt-1 font-register-heading text-lg">แคสต์เรื่องใหม่บนลาน</h3><p className="mt-1 text-xs text-muted-foreground">อยู่บนลาน 24 ชั่วโมง แล้วเก็บไว้ในสมุดเหตุการณ์ ไม่แตะ streak หรือรางวัล</p><fieldset className="mt-4"><legend className="text-sm font-bold">เลือกฉาก</legend><div className="mt-2 grid gap-2">{presets.map((item) => <button key={item.id} type="button" aria-pressed={preset === item.id} onClick={() => setPreset(item.id)} className={`rounded-xl border p-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${preset === item.id ? "border-primary bg-primary/10" : "border-border bg-background"}`}><span className="block text-sm font-bold">{item.title}</span><span className="mt-1 block text-xs text-muted-foreground">{item.cue}</span></button>)}</div></fieldset><div className="mt-4"><label htmlFor="god-event-caption" className="text-sm font-bold">ข้อความจากแอดมิน</label><textarea id="god-event-caption" value={caption} onChange={(event) => setCaption(event.target.value)} maxLength={160} rows={3} placeholder="วันนี้ลานมีอะไรพิเศษ?" className="mt-2 w-full resize-none rounded-xl border border-input bg-background p-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" /><p className="mt-1 text-right font-register-mono text-xs">{[...caption].length}/160</p></div><div className="mt-2"><label htmlFor="god-event-cohort" className="text-sm font-bold">ให้ใครเห็น</label><select id="god-event-cohort" value={cohort} onChange={(event) => setCohort(Number(event.target.value))} className="mt-2 min-h-11 w-full rounded-xl border border-input bg-background px-3 text-sm font-bold"><option value={0}>ทุกรุ่น</option>{cohorts.data?.map((item) => <option key={item.cohortNumber} value={item.cohortNumber}>รุ่น {item.cohortNumber}</option>)}</select>{cohorts.isError && <p role="alert" className="mt-2 text-xs text-destructive">ยังโหลดรายชื่อรุ่นไม่ได้ เลือกได้เฉพาะทุกรุ่น</p>}</div><button type="button" disabled={!validCaption || cast.isLoading} onClick={() => cast.mutate()} className="mt-4 min-h-11 w-full rounded-full bg-primary px-5 text-sm font-bold text-primary-foreground shadow-sm disabled:opacity-50">{cast.isLoading ? "กำลังแคสต์…" : "ปล่อยเหตุการณ์ ✨"}</button>{cast.isError && <p role="alert" className="mt-3 text-sm font-bold text-destructive">ยังแคสต์ไม่ได้ อาจเกินจำนวนครั้งต่อชั่วโมงหรือตรวจข้อความอีกที</p>}</div>}
  </section>;
}
