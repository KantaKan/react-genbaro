import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { Crown, Play, Sparkles, X } from "lucide-react";
import { godEventService, type GodEvent, type GodEventPreset } from "@/application/services/godEventService";
import { stampService } from "@/application/services/stampService";
import { BaroCharacterArt } from "./BaroCharacterArt";

const presets: Array<{ id: GodEventPreset; title: string; cue: string }> = [
  { id: "star_rain", title: "ฝนดาว", cue: "ดาวเล็ก ๆ โปรยทั่วลาน" },
  { id: "god_entrance", title: "เทพลงลาน", cue: "เปิดตัวแบบเกินเรื่อง" },
  { id: "character_parade", title: "ขบวนเพื่อนจิ๋ว", cue: "เดินพาเหรดพร้อมกัน" },
];

function GodEventScene({ event, replay, onClose }: { event: GodEvent; replay: boolean; onClose?: () => void }) {
  const title = presets.find((item) => item.id === event.preset)?.title ?? "เหตุการณ์บนลาน";
  const stars = event.preset === "star_rain";
  const entrance = event.preset === "god_entrance";
  return <section aria-label={`${replay ? "เล่นซ้ำ" : "กำลังเกิดขึ้น"}: ${title}`} className={`relative isolate overflow-hidden rounded-[28px] border-[3px] border-[#292542] p-5 shadow-[6px_7px_0_#292542] sm:p-8 ${stars ? "bg-[#332d61] text-white" : entrance ? "bg-[#f7c677]" : "bg-[#d7efde]"}`}>
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {stars ? <><span className="absolute left-[12%] top-[12%] text-4xl motion-safe:animate-pulse">✦</span><span className="absolute right-[16%] top-[25%] text-3xl motion-safe:animate-pulse">✧</span><span className="absolute bottom-[18%] left-[22%] text-2xl motion-safe:animate-pulse">✶</span><span className="absolute bottom-[25%] right-[10%] text-5xl motion-safe:animate-pulse">✦</span></> : entrance ? <><span className="absolute -left-12 top-8 h-40 w-40 rounded-full bg-white/35 blur-xl" /><span className="absolute -right-12 bottom-5 h-48 w-48 rounded-full bg-[#f58670]/40 blur-xl" /><span className="absolute left-[11%] top-8 text-3xl">⚡</span><span className="absolute right-[14%] top-12 text-3xl">⚡</span></> : <><span className="absolute left-4 top-5 text-4xl">🌼</span><span className="absolute right-5 top-8 text-4xl">🌼</span><span className="absolute bottom-2 left-0 h-16 w-full rounded-[50%_50%_0_0] bg-[#9cd0ab]" /></>}
    </div>
    <div className="relative z-10 flex flex-wrap items-start justify-between gap-2"><span className={`rounded-full border-2 px-3 py-1 text-[11px] font-black uppercase tracking-[.16em] ${stars ? "border-white bg-white/15" : "border-[#292542] bg-white/80"}`}>{replay ? "REPLAY · เหตุการณ์ที่ผ่านมา" : "LIVE ON THE LAWN · 24H"}</span>{onClose && <button type="button" onClick={onClose} aria-label="ปิดการเล่นซ้ำ" className="rounded-full border-2 border-current p-1.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"><X className="h-4 w-4" /></button>}</div>
    <div className="relative z-10 mx-auto flex min-h-52 max-w-2xl flex-col items-center justify-center py-5 text-center sm:min-h-64">
      <div className={`relative ${entrance ? "h-32 w-32 sm:h-40 sm:w-40" : "h-28 w-28 sm:h-32 sm:w-32"} ${entrance ? "motion-safe:animate-[bounce_2s_ease-in-out_infinite]" : ""}`}>
        {event.character ? <BaroCharacterArt dna={event.character.dna} id={`god-event-${event.id}`} /> : <div className="flex h-full w-full items-center justify-center rounded-full border-[3px] border-[#292542] bg-[#fffaf0] text-[#292542]"><Crown className="h-16 w-16" /></div>}
        {entrance && <Crown aria-hidden="true" className="absolute -right-4 -top-5 h-12 w-12 rotate-12 text-[#292542] drop-shadow-[2px_2px_0_#fff]" />}
        {!entrance && !stars && <span aria-hidden="true" className="absolute -right-7 bottom-2 text-4xl motion-safe:animate-bounce">🐥</span>}
      </div>
      <p className="mt-2 text-xs font-black uppercase tracking-[.2em] opacity-80">{title} · {event.cohort === 0 ? "ทุกรุ่น" : `รุ่น ${event.cohort}`}</p>
      <p className="mt-2 max-w-xl whitespace-pre-wrap break-words text-xl font-black leading-snug sm:text-3xl">{event.caption}</p>
    </div>
    <div className="relative z-10 flex items-center justify-between gap-3 border-t border-current/20 pt-3 text-xs font-bold"><span>{replay ? "บันทึกจากลาน" : "แวะมาดูได้ตลอด 24 ชั่วโมง"}</span><time dateTime={event.created_at}>{new Date(event.created_at).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" })}</time></div>
  </section>;
}

export function GodEventPanel({ userId, admin }: { userId: string | null | undefined; admin: boolean }) {
  const queryClient = useQueryClient();
  const [preset, setPreset] = useState<GodEventPreset>("star_rain");
  const [caption, setCaption] = useState("");
  const [cohort, setCohort] = useState(0);
  const [replayId, setReplayId] = useState<string | null>(null);
  const events = useQuery(["god-events", userId], godEventService.list, { enabled: Boolean(userId), retry: false, refetchInterval: 60_000 });
  const cohorts = useQuery(["god-event-cohorts", userId], stampService.listCohorts, { enabled: Boolean(userId && admin), retry: false });
  const cast = useMutation(() => godEventService.cast(preset, caption, cohort), { onSuccess: () => { setCaption(""); setReplayId(null); queryClient.invalidateQueries(["god-events", userId]); } });
  const list = events.data ?? [];
  const active = list.find((item) => item.active);
  const replay = list.find((item) => item.id === replayId);
  const visible = replay ?? active;
  const validCaption = caption.trim().length > 0 && [...caption.trim()].length <= 160 && ![...caption].some((character) => character === "<" || character === ">" || character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127);

  return <section aria-labelledby="god-event-heading" className="mb-8 font-register-body">
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3"><div><p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.18em] text-primary"><Sparkles className="h-4 w-4" /> LAWN MOMENTS</p><h2 id="god-event-heading" className="mt-1 font-register-heading text-2xl">เรื่องพิเศษบนลาน</h2></div><p className="text-xs font-semibold text-muted-foreground">แอดมินสร้างช่วงสนุก ๆ ไว้ให้ทุกคนดูย้อนหลังได้</p></div>
    {events.isLoading && <p role="status" className="rounded-xl border border-border bg-card p-4 text-sm">กำลังดูเหตุการณ์บนลาน…</p>}
    {events.isError && <div role="alert" className="rounded-xl border border-border bg-card p-4 text-sm">ยังโหลดเหตุการณ์ไม่ได้ <button type="button" onClick={() => events.refetch()} className="font-bold underline">ลองใหม่</button></div>}
    {visible && <GodEventScene event={visible} replay={Boolean(replay)} onClose={replay ? () => setReplayId(null) : undefined} />}
    {!events.isLoading && !events.isError && !visible && <div className="rounded-xl border border-dashed border-border bg-card p-6 text-sm text-muted-foreground">ตอนนี้ลานเงียบ ๆ แต่ยังมีที่ให้ทุกคนปักตัวละครและทักทายกัน 🌱</div>}
    {list.length > 0 && <div className="mt-5"><h3 className="text-sm font-bold">สมุดเหตุการณ์</h3><div className="mt-2 flex gap-3 overflow-x-auto pb-2">{list.map((event) => <button key={event.id} type="button" onClick={() => setReplayId(event.id)} aria-label={`ดูซ้ำ ${event.caption}`} className={`min-w-44 max-w-64 shrink-0 rounded-xl border p-3 text-left text-xs shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${replayId === event.id ? "border-primary bg-primary/10" : "border-border bg-card"}`}><span className="flex items-center gap-1 font-bold"><Play className="h-3 w-3" /> {presets.find((item) => item.id === event.preset)?.title}</span><span className="mt-1 block truncate">{event.caption}</span><span className="mt-1 block text-[10px] text-muted-foreground">{event.cohort === 0 ? "ทุกรุ่น" : `รุ่น ${event.cohort}`} · {event.active ? "กำลังแสดง" : "ย้อนหลัง"}</span></button>)}</div></div>}
    {admin && <div className="mt-6 rounded-2xl border border-border bg-card p-5 text-card-foreground shadow-sm sm:p-6"><p className="text-xs font-bold uppercase tracking-[.18em] text-primary">GOD MODE · ADMIN ONLY</p><h3 className="mt-1 font-register-heading text-xl">แคสต์เรื่องใหม่บนลาน</h3><p className="mt-1 text-xs text-muted-foreground">ฉากใหม่อยู่ 24 ชั่วโมง แล้วเก็บไว้ในสมุดเหตุการณ์ ไม่แตะ streak หรือรางวัล</p><fieldset className="mt-4"><legend className="text-sm font-bold">เลือกฉาก</legend><div className="mt-2 grid gap-2 sm:grid-cols-3">{presets.map((item) => <button key={item.id} type="button" aria-pressed={preset === item.id} onClick={() => setPreset(item.id)} className={`min-h-20 rounded-xl border p-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${preset === item.id ? "border-primary bg-primary/10" : "border-border bg-background"}`}><span className="block text-sm font-bold">{item.title}</span><span className="mt-1 block text-xs text-muted-foreground">{item.cue}</span></button>)}</div></fieldset><div className="mt-4 grid gap-4 sm:grid-cols-[minmax(0,1fr)_12rem]"><div><label htmlFor="god-event-caption" className="text-sm font-bold">ข้อความจากแอดมิน</label><textarea id="god-event-caption" value={caption} onChange={(event) => setCaption(event.target.value)} maxLength={160} rows={3} placeholder="วันนี้ลานมีอะไรพิเศษ?" className="mt-2 w-full resize-none rounded-xl border border-input bg-background p-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" /><p className="mt-1 text-right font-register-mono text-xs">{[...caption].length}/160</p></div><div><label htmlFor="god-event-cohort" className="text-sm font-bold">ให้ใครเห็น</label><select id="god-event-cohort" value={cohort} onChange={(event) => setCohort(Number(event.target.value))} className="mt-2 min-h-11 w-full rounded-xl border border-input bg-background px-3 text-sm font-bold"><option value={0}>ทุกรุ่น</option>{cohorts.data?.map((item) => <option key={item.cohortNumber} value={item.cohortNumber}>รุ่น {item.cohortNumber}</option>)}</select>{cohorts.isError && <p role="alert" className="mt-2 text-xs text-destructive">ยังโหลดรายชื่อรุ่นไม่ได้ เลือกได้เฉพาะทุกรุ่น</p>}</div></div><button type="button" disabled={!validCaption || cast.isLoading} onClick={() => cast.mutate()} className="mt-3 min-h-11 rounded-full bg-primary px-5 text-sm font-bold text-primary-foreground shadow-sm transition-transform hover:-translate-y-0.5 disabled:opacity-50 motion-reduce:transition-none">{cast.isLoading ? "กำลังแคสต์…" : "ปล่อยเหตุการณ์ ✨"}</button>{cast.isError && <p role="alert" className="mt-3 text-sm font-bold text-destructive">ยังแคสต์ไม่ได้ อาจเกินจำนวนครั้งต่อชั่วโมงหรือตรวจข้อความอีกที</p>}{cast.isSuccess && <p role="status" className="mt-3 text-sm font-bold text-primary">แคสต์แล้ว! เพื่อนในกลุ่มเป้าหมายจะเห็นบนลาน</p>}</div>}
  </section>;
}
