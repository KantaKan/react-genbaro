import { lazy, Suspense, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { Link } from "react-router-dom";
import { ArrowLeft, MapPin, RotateCw, Sparkles } from "lucide-react";
import { useAuth } from "@/application/contexts/AuthContext";
import { baroCharacterService } from "@/application/services/baroCharacterService";
import { showcaseLawnService, type ShowcaseEntry } from "@/application/services/showcaseLawnService";
import { BaroCharacterArt } from "@/components/character/BaroCharacterArt";
import { LawnCharacter } from "@/components/character/LawnCharacter";
import { planLawn } from "@/lib/lawn-planner";
import { GodEventPanel } from "@/components/character/GodEventPanel";
import { ShowcaseLawnEnvironment } from "@/components/character/ShowcaseLawnEnvironment";

const Character3DViewer = lazy(() => import("@/components/character/Character3DViewer").then((module) => ({ default: module.Character3DViewer })));

export default function ShowcaseLawnPage() {
  const { userId, userRole } = useAuth();
  const queryClient = useQueryClient();
  const [cohort, setCohort] = useState(0);
  const [team, setTeam] = useState("");
  const [draftCharacterId, setDraftCharacterId] = useState<string | null>(null);
  const [draftMessage, setDraftMessage] = useState<string | null>(null);
  const [inspectedEntry, setInspectedEntry] = useState<ShowcaseEntry | null>(null);
  const includeHidden = userRole === "admin";
  const baseKey = ["showcase-lawn", userId, 0, "", includeHidden];
  const base = useQuery(baseKey, () => showcaseLawnService.list(undefined, undefined, includeHidden), { enabled: Boolean(userId), retry: false });
  const filtered = useQuery(["showcase-lawn", userId, cohort, team, includeHidden], () => showcaseLawnService.list(cohort || undefined, team || undefined, includeHidden), { enabled: Boolean(userId && (cohort || team)), retry: false });
  const view = cohort || team ? filtered : base;
  const own = useQuery(["showcase-lawn-mine", userId], showcaseLawnService.mine, { enabled: Boolean(userId), retry: false });
  const collection = useQuery(["baro-character-collection", userId], baroCharacterService.collection, { enabled: Boolean(userId), retry: false });
  const selection = useQuery(["baro-character-selection", userId], baroCharacterService.selection, { enabled: Boolean(userId), retry: false });
  const mine = own.data;
  const chosenId = draftCharacterId ?? (selection.data?.pinned_id || collection.data?.[0]?.id || "");
  const message = draftMessage ?? mine?.message ?? "";
  const cohorts = [...new Set((base.data ?? []).map((entry) => entry.cohort).filter((value) => value > 0))].sort((a, b) => a - b);
  const teams = [...new Set((base.data ?? []).filter((entry) => !cohort || entry.cohort === cohort).map((entry) => entry.team).filter(Boolean))].sort();
  const save = useMutation(() => showcaseLawnService.save(chosenId, message), {
    onSuccess: () => { setDraftCharacterId(null); setDraftMessage(null); queryClient.invalidateQueries(["showcase-lawn"]); queryClient.invalidateQueries(["showcase-lawn-mine", userId]); queryClient.invalidateQueries(["baro-character-selection", userId]); },
  });
  const remove = useMutation(showcaseLawnService.remove, {
    onSuccess: () => { setDraftCharacterId(null); setDraftMessage(null); queryClient.invalidateQueries(["showcase-lawn"]); queryClient.invalidateQueries(["showcase-lawn-mine", userId]); queryClient.invalidateQueries(["baro-character-selection", userId]); },
  });
  const react = useMutation(({ ownerId, emoji }: { ownerId: string; emoji: string }) => showcaseLawnService.react(ownerId, emoji), { onSuccess: () => queryClient.invalidateQueries(["showcase-lawn"]) });
  const moderate = useMutation(({ ownerId, hidden }: { ownerId: string; hidden: boolean }) => showcaseLawnService.moderate(ownerId, hidden), { onSuccess: () => { queryClient.invalidateQueries(["showcase-lawn"]); queryClient.invalidateQueries(["showcase-lawn-mine", userId]); } });
  const busy = save.isLoading || remove.isLoading;
  const [sceneTime] = useState(() => Date.now());
  const plan = useMemo(() => planLawn({ entries: view.data ?? [], viewerId: userId, mine, now: sceneTime }), [view.data, userId, mine, sceneTime]);
  const cardActions = (entry: ShowcaseEntry) => ({ admin: includeHidden, busy: react.isLoading || moderate.isLoading, onReact: (emoji: string) => react.mutate({ ownerId: entry.owner_id, emoji }), onModerate: (hidden: boolean) => moderate.mutate({ ownerId: entry.owner_id, hidden }), onInspect: () => setInspectedEntry(entry) });

  return <main className="min-h-[calc(100vh-5rem)] bg-background px-4 py-8 font-register-body text-foreground transition-colors sm:px-8 lg:py-12">
    <div className="mx-auto max-w-6xl">
      <Link to="/character" className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><ArrowLeft className="h-4 w-4" /> กลับไปหาตัวละคร</Link>
      <div className="mb-8 mt-7 flex flex-wrap items-end justify-between gap-5"><div><p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.2em] text-primary"><MapPin className="h-4 w-4" /> THE SHOWCASE LAWN</p><h1 className="mt-2 font-register-heading text-4xl leading-tight sm:text-5xl">ลานนัดพบของเพื่อนตัวจิ๋ว</h1><p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">ปักคู่หูไว้พร้อมคำทักทาย แล้วแวะมาดูเพื่อนในรุ่นได้ทุกเมื่อ ไม่ต้องออนไลน์พร้อมกัน</p></div><span className="rounded-full border border-border bg-primary/10 px-4 py-2 font-register-mono text-xs font-bold text-primary">{base.data?.filter((entry) => !entry.hidden).length ?? 0} FRIENDS VISITING</span></div>

      <GodEventPanel userId={userId} admin={includeHidden} />

      <section aria-labelledby="my-showcase-heading" className="mb-8 rounded-2xl border border-border bg-card p-5 text-card-foreground shadow-sm sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[.18em] text-primary">YOUR PLACE ON THE LAWN</p><h2 id="my-showcase-heading" className="mt-1 font-register-heading text-2xl">ปักคู่หูของฉัน</h2></div>{mine && <span className={`rounded-full px-3 py-1 text-xs font-bold ${mine.hidden ? "bg-muted" : "bg-secondary"}`}>{mine.hidden ? "แอดมินซ่อนจากลาน · ยังแก้ไขได้" : "ปักอยู่แล้ว · แก้ไขได้"}</span>}</div>
        {own.isError && <p role="alert" className="mt-3 text-sm text-[#a9505e]">ยังโหลดรายการของคุณไม่ได้ <button type="button" onClick={() => own.refetch()} className="font-black underline">ลองใหม่</button></p>}
        {collection.isLoading && <p role="status" className="mt-5 text-sm">กำลังเปิดสมุดตัวละคร…</p>}
        {collection.isError && <div role="alert" className="mt-5 text-sm text-[#a9505e]">ยังโหลดตัวละครไม่ได้ <button type="button" onClick={() => collection.refetch()} className="font-black underline">ลองใหม่</button></div>}
        {collection.data?.length === 0 && <p className="mt-5 text-sm">ยังไม่มีตัวละครในสมุดสะสม <Link to="/character" className="font-black underline">ไปเปิดตัวละครตัวแรก</Link> แล้วกลับมาปักบนลานได้</p>}
        {collection.data && collection.data.length > 0 && <div className="mt-5 grid gap-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <fieldset><legend className="text-sm font-bold">เลือกตัวที่อยากให้เพื่อนเจอ</legend><div className="mt-2 flex max-h-44 gap-3 overflow-x-auto pb-2">{collection.data.map((character) => <button key={character.id} type="button" aria-label={`เลือก ${character.serial}`} aria-pressed={chosenId === character.id} onClick={() => setDraftCharacterId(character.id)} className={`w-28 shrink-0 rounded-xl border p-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${chosenId === character.id ? "border-primary bg-primary/10" : "border-border bg-background"}`}><div className="mx-auto h-20 w-16"><BaroCharacterArt dna={character.dna} id={`lawn-choice-${character.id}`} /></div><span className="block truncate font-register-mono text-[10px] font-bold">{character.serial.slice(-8)}</span></button>)}</div></fieldset>
          <div><label htmlFor="showcase-message" className="text-sm font-bold">ฝากข้อความไว้บนลาน</label><textarea id="showcase-message" maxLength={160} value={message} onChange={(event) => setDraftMessage(event.target.value)} placeholder="วันนี้มีอะไรอยากบอกเพื่อน ๆ ไหม?" rows={3} className="mt-2 w-full resize-none rounded-xl border border-input bg-background p-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" /><p className="mt-1 text-right font-register-mono text-xs">{[...message].length}/160</p></div>
        </div>}
        {collection.data && collection.data.length > 0 && <div className="mt-4 flex flex-wrap gap-3"><button type="button" disabled={busy || !chosenId || [...message].length > 160} onClick={() => save.mutate()} className="min-h-11 rounded-full bg-primary px-5 text-sm font-bold text-primary-foreground shadow-sm transition-transform hover:-translate-y-0.5 disabled:opacity-50 motion-reduce:transition-none">{save.isLoading ? "กำลังบันทึก…" : mine ? "บันทึกการปัก" : "ปักบนลาน"}</button>{mine && <button type="button" disabled={busy} onClick={() => remove.mutate()} className="min-h-11 rounded-full border border-border bg-background px-5 text-sm font-bold disabled:opacity-50">เอาออกจากลาน</button>}</div>}
        {save.isError && <p role="alert" className="mt-3 text-sm font-bold text-[#a9505e]">ยังปักตัวละครไม่ได้ ตรวจตัวที่เลือกแล้วลองใหม่</p>}{remove.isError && <p role="alert" className="mt-3 text-sm font-bold text-[#a9505e]">ยังเอาออกจากลานไม่ได้ ลองใหม่ได้เลย</p>}{save.isSuccess && <p role="status" className="mt-3 text-sm font-bold text-[#347c69]">บันทึกการปักแล้ว</p>}{remove.isSuccess && <p role="status" className="mt-3 text-sm font-bold text-[#347c69]">เอาออกจากลานแล้ว</p>}
      </section>

      <section aria-labelledby="lawn-friends-heading"><div className="mb-4 flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[.18em] text-primary">WANDER TOGETHER</p><h2 id="lawn-friends-heading" className="mt-1 font-register-heading text-2xl">เดินดูเพื่อนบนลาน</h2></div><div className="flex flex-wrap gap-2">{userRole === "admin" && <select aria-label="กรองรุ่น" value={cohort} onChange={(event) => { setCohort(Number(event.target.value)); setTeam(""); }} className="min-h-10 rounded-full border border-input bg-background px-3 text-sm font-bold"><option value={0}>ทุกรุ่น</option>{cohorts.map((number) => <option key={number} value={number}>รุ่น {number}</option>)}</select>}<select aria-label="กรองทีม" value={team} onChange={(event) => setTeam(event.target.value)} className="min-h-10 rounded-full border border-input bg-background px-3 text-sm font-bold"><option value="">ทุกทีม</option>{teams.map((name) => <option key={name} value={name}>{name}</option>)}</select></div></div>
        <ShowcaseLawnEnvironment>
          {view.isLoading && <p role="status" className="rounded-2xl bg-white/85 p-6 text-sm font-bold">กำลังดูว่าเพื่อน ๆ ใครมาปักไว้บ้าง…</p>}
          {view.isError && <div role="alert" className="rounded-2xl bg-white/90 p-6 text-sm"><p className="font-black">ยังเปิดลานไม่ได้</p><p className="mt-1">ลองโหลดใหม่ได้เลย การปักของคุณยังอยู่</p><button type="button" onClick={() => view.refetch()} className="mt-3 inline-flex items-center gap-2 font-black underline"><RotateCw className="h-4 w-4" /> โหลดใหม่</button></div>}
          {!view.isLoading && !view.isError && view.data && plan.placements.length === 0 && <div className="rounded-2xl bg-white/90 p-8 text-center"><Sparkles className="mx-auto h-8 w-8" /><p className="mt-2 font-black">ยังไม่มีใครปักตัวละครตรงนี้</p><p className="mt-1 text-sm">ลองเลือกทุกทีม หรือปักคู่หูของคุณเป็นคนแรกได้เลย</p></div>}
          {plan.placements.length > 0 && <>
            <ol aria-label="เพื่อนบนลานตอนนี้" className="grid grid-cols-3 gap-x-1 gap-y-4 pt-4 sm:grid-cols-4">{plan.placements.map(({ entry, offsetX, offsetY, facing }) => <li key={entry.owner_id} className="flex justify-center" style={{ transform: `translate(${offsetX}px, ${offsetY}px)` }}><LawnCharacter entry={entry} action={facing === "left" ? "walk" : "idle"} facing={facing} mine={entry.owner_id === userId} {...cardActions(entry)} /></li>)}</ol>
            {plan.total > plan.placements.length && <p className="mt-4 text-center text-xs font-bold text-[#292542]/80">ตอนนี้มีเพื่อนเดินเล่น {plan.placements.length} จาก {plan.total} คน · ผลัดกันมาทักทายทุกครึ่งชั่วโมง</p>}
          </>}
        </ShowcaseLawnEnvironment>
        {includeHidden && view.data && view.data.length > plan.placements.length && <details className="mt-4 rounded-2xl border border-border bg-card p-4 text-sm"><summary className="cursor-pointer font-bold">รายการทั้งหมดสำหรับแอดมิน ({view.data.length})</summary><ul className="mt-3 space-y-2">{view.data.map((entry) => <li key={entry.owner_id} className="flex items-center justify-between gap-3"><span className="truncate">{entry.name}{entry.hidden ? " · ซ่อนอยู่" : ""}</span><button type="button" disabled={moderate.isLoading} onClick={() => moderate.mutate({ ownerId: entry.owner_id, hidden: !entry.hidden })} className="min-h-9 shrink-0 rounded-full border border-border bg-background px-3 text-xs font-bold disabled:opacity-50">{entry.hidden ? "คืนสู่ลาน" : "ซ่อนจากลาน"}</button></li>)}</ul></details>}
        {react.isError && <p role="alert" className="mt-4 text-sm font-bold text-[#a9505e]">ยังส่งรีแอคไม่ได้ ลองอีกครั้งได้เลย</p>}
        {moderate.isError && <p role="alert" className="mt-4 text-sm font-bold text-[#a9505e]">ยังเปลี่ยนสถานะรายการไม่ได้ ลองอีกครั้งได้เลย</p>}
      </section>
      <p className="mt-4 text-xs text-muted-foreground">ลานนี้เป็นภาพที่เพื่อนฝากไว้ ไม่ใช่ห้องออนไลน์สด</p>
      {inspectedEntry && <Suspense fallback={null}><Character3DViewer entry={inspectedEntry} onClose={() => setInspectedEntry(null)} /></Suspense>}
    </div>
  </main>;
}
