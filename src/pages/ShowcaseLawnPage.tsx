import { lazy, Suspense, useMemo, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { Link } from "react-router-dom";
import { ArrowLeft, Pencil, RotateCw, Sparkles } from "lucide-react";
import { useAuth } from "@/application/contexts/AuthContext";
import { baroCharacterService } from "@/application/services/baroCharacterService";
import { showcaseLawnService, type LawnEmote, type ShowcaseEntry } from "@/application/services/showcaseLawnService";
import { BaroCharacterArt } from "@/components/character/BaroCharacterArt";
import { LawnEmoteBar, LawnMoodPicker } from "@/components/character/LawnMoodPicker";
import { LawnYard, YardScenePicker } from "@/components/character/LawnYard";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { useYardScene } from "@/hooks/use-yard-scene";
import { YARD_SCENES } from "@/lib/lawn-scenes";
import { LAWN_LITE_LIMIT, LAWN_SCENE_LIMIT, planLawn } from "@/lib/lawn-planner";
import { useLawnSceneTime } from "@/hooks/use-lawn-scene-time";
import { isConstrainedDevice, supportsCssAnimation } from "@/hooks/use-lawn-device";
import { GodEventHistory, LawnGodEvent } from "@/components/character/GodEventPanel";
import { godEventService } from "@/application/services/godEventService";

const Character3DViewer = lazy(() => import("@/components/character/Character3DViewer").then((module) => ({ default: module.Character3DViewer })));

const chip = "pointer-events-auto rounded-full border border-border bg-card/90 text-card-foreground shadow-sm backdrop-blur focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export default function ShowcaseLawnPage() {
  const { userId, userRole } = useAuth();
  const queryClient = useQueryClient();
  const mobile = useIsMobile();
  const [panelOpen, setPanelOpen] = useState(false);
  const [cohort, setCohort] = useState(0);
  const [team, setTeam] = useState("");
  const [draftCharacterId, setDraftCharacterId] = useState<string | null>(null);
  const [draftMessage, setDraftMessage] = useState<string | null>(null);
  const [inspectedEntry, setInspectedEntry] = useState<ShowcaseEntry | null>(null);
  const [replayId, setReplayId] = useState<string | null>(null);
  const [picking, setPicking] = useState(false);
  const includeHidden = userRole === "admin";
  const baseKey = ["showcase-lawn", userId, 0, "", includeHidden];
  const base = useQuery(baseKey, () => showcaseLawnService.list(undefined, undefined, includeHidden), { enabled: Boolean(userId), retry: false });
  const filtered = useQuery(["showcase-lawn", userId, cohort, team, includeHidden], () => showcaseLawnService.list(cohort || undefined, team || undefined, includeHidden), { enabled: Boolean(userId && (cohort || team)), retry: false });
  const view = cohort || team ? filtered : base;
  const own = useQuery(["showcase-lawn-mine", userId], showcaseLawnService.mine, { enabled: Boolean(userId), retry: false });
  const collection = useQuery(["baro-character-collection", userId], baroCharacterService.collection, { enabled: Boolean(userId), retry: false });
  const selection = useQuery(["baro-character-selection", userId], baroCharacterService.selection, { enabled: Boolean(userId), retry: false });
  const events = useQuery(["god-events", userId], godEventService.list, { enabled: Boolean(userId), retry: false, refetchInterval: 60_000 });
  const mine = own.data;
  const chosenId = draftCharacterId ?? (selection.data?.pinned_id || collection.data?.[0]?.id || "");
  const message = draftMessage ?? mine?.message ?? "";
  const cohorts = [...new Set((base.data ?? []).map((entry) => entry.cohort).filter((value) => value > 0))].sort((a, b) => a - b);
  const teams = [...new Set((base.data ?? []).filter((entry) => !cohort || entry.cohort === cohort).map((entry) => entry.team).filter(Boolean))].sort();
  const refreshMine = () => { setDraftCharacterId(null); setDraftMessage(null); queryClient.invalidateQueries(["showcase-lawn"]); queryClient.invalidateQueries(["showcase-lawn-mine", userId]); queryClient.invalidateQueries(["baro-character-selection", userId]); };
  const save = useMutation(() => showcaseLawnService.save(chosenId, message), { onSuccess: refreshMine });
  const remove = useMutation(showcaseLawnService.remove, { onSuccess: refreshMine });
  const react = useMutation(({ ownerId, emoji }: { ownerId: string; emoji: string }) => showcaseLawnService.react(ownerId, emoji), { onSuccess: () => queryClient.invalidateQueries(["showcase-lawn"]) });
  const moderate = useMutation(({ ownerId, hidden }: { ownerId: string; hidden: boolean }) => showcaseLawnService.moderate(ownerId, hidden), { onSuccess: () => { queryClient.invalidateQueries(["showcase-lawn"]); queryClient.invalidateQueries(["showcase-lawn-mine", userId]); } });
  const emote = useMutation(({ value, target }: { value: LawnEmote | ""; target?: string }) => showcaseLawnService.setEmote(value, target), { onSuccess: () => { queryClient.invalidateQueries(["showcase-lawn"]); queryClient.invalidateQueries(["showcase-lawn-mine", userId]); } });
  const activeEmote = mine?.emote && mine.emote_until && Date.parse(mine.emote_until) > Date.now() ? mine.emote : undefined;
  const busy = save.isLoading || remove.isLoading;
  const reducedMotion = useReducedMotion();
  const motion = !reducedMotion && supportsCssAnimation();
  const sceneTime = useLawnSceneTime(Boolean(reducedMotion));
  const [lite, setLite] = useState(() => isConstrainedDevice());
  const [sceneId, setSceneId] = useYardScene();
  const scene = YARD_SCENES[sceneId];
  const plan = useMemo(() => planLawn({ entries: view.data ?? [], scene, viewerId: userId, mine, now: sceneTime, limit: lite ? LAWN_LITE_LIMIT : LAWN_SCENE_LIMIT }), [view.data, scene, userId, mine, sceneTime, lite]);
  const cardActions = (entry: ShowcaseEntry) => ({ admin: includeHidden, busy: react.isLoading || moderate.isLoading, onReact: (emoji: string) => react.mutate({ ownerId: entry.owner_id, emoji }), onModerate: (hidden: boolean) => moderate.mutate({ ownerId: entry.owner_id, hidden }), onInspect: () => setInspectedEntry(entry), onPick: picking ? () => { if (entry.owner_id !== userId) emote.mutate({ value: "visit", target: entry.owner_id }); setPicking(false); } : undefined });
  const replay = events.data?.find((item) => item.id === replayId);
  const shownEvent = replay ?? events.data?.find((item) => item.active);
  const visitors = base.data?.filter((entry) => !entry.hidden).length ?? 0;

  return <main className="relative -m-4 h-[calc(100dvh-4rem)] min-h-[440px] overflow-hidden bg-[#bfe3ee] font-register-body text-foreground">
    <LawnGodEvent event={shownEvent} replay={Boolean(replay)} entries={plan.placements.map((placement) => placement.entry)} motion={motion} onCloseReplay={() => setReplayId(null)}>
      {plan.placements.length > 0 && <LawnYard plan={plan} scene={scene} userId={userId} lite={lite} cardActions={cardActions} />}
    </LawnGodEvent>

    <div className="pointer-events-none absolute inset-x-0 top-0 z-[970] flex items-center gap-2 overflow-x-auto p-3 [scrollbar-width:none] md:flex-wrap [&::-webkit-scrollbar]:hidden">
      <Link to="/character" aria-label="กลับไปหาตัวละคร" className={`${chip} inline-flex h-10 w-10 shrink-0 items-center justify-center`}><ArrowLeft className="h-4 w-4" /></Link>
      <h1 className={`${chip} inline-flex h-10 shrink-0 items-center gap-2 px-4 font-register-heading text-sm sm:text-base`}>ลานนัดพบ <span className="font-register-mono text-xs text-primary">{visitors} คน</span></h1>
      <div className="ml-auto flex shrink-0 items-center gap-2">
        <div className="pointer-events-auto"><YardScenePicker value={sceneId} onChange={setSceneId} /></div>
        {userRole === "admin" && <select aria-label="กรองรุ่น" value={cohort} onChange={(event) => { setCohort(Number(event.target.value)); setTeam(""); }} className={`${chip} h-10 px-3 text-sm font-bold`}><option value={0}>ทุกรุ่น</option>{cohorts.map((number) => <option key={number} value={number}>รุ่น {number}</option>)}</select>}
        <select aria-label="กรองทีม" value={team} onChange={(event) => setTeam(event.target.value)} className={`${chip} h-10 px-3 text-sm font-bold`}><option value="">ทุกทีม</option>{teams.map((name) => <option key={name} value={name}>{name}</option>)}</select>
        <button type="button" aria-pressed={lite} onClick={() => setLite((value) => !value)} className={`${chip} h-10 px-3 text-sm font-bold ${lite ? "!border-primary !bg-primary/15" : ""}`}>ลานแบบเบา</button>
      </div>
    </div>

    {view.isLoading && <p role="status" className="absolute left-1/2 top-1/2 z-[960] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-card p-6 text-sm font-bold text-card-foreground shadow-sm">กำลังดูว่าเพื่อน ๆ ใครมาปักไว้บ้าง…</p>}
    {view.isError && <div role="alert" className="absolute left-1/2 top-1/2 z-[960] w-[min(90%,24rem)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-card p-6 text-sm text-card-foreground shadow-sm"><p className="font-bold">ยังเปิดลานไม่ได้</p><p className="mt-1">ลองโหลดใหม่ได้เลย การปักของคุณยังอยู่</p><button type="button" onClick={() => view.refetch()} className="mt-3 inline-flex items-center gap-2 font-black underline"><RotateCw className="h-4 w-4" /> โหลดใหม่</button></div>}
    {!view.isLoading && !view.isError && view.data && plan.placements.length === 0 && <div className="absolute left-1/2 top-1/2 z-[960] w-[min(90%,24rem)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-card p-8 text-center text-card-foreground shadow-sm"><Sparkles className="mx-auto h-8 w-8" /><p className="mt-2 font-black">ยังไม่มีใครปักตัวละครตรงนี้</p><p className="mt-1 text-sm">ลองเลือกทุกทีม หรือปักคู่หูของคุณเป็นคนแรกได้เลย</p></div>}

    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[970] flex items-end justify-between gap-2 p-3">
      <p className={`${chip} min-w-0 truncate px-3 py-1.5 text-xs font-bold`}>{plan.total > plan.placements.length ? `ตอนนี้มีเพื่อนเดินเล่น ${plan.placements.length} จาก ${plan.total} คน · ผลัดกันทุกครึ่งชั่วโมง` : "ลานนี้เป็นภาพที่เพื่อนฝากไว้ ไม่ใช่ห้องออนไลน์สด"}</p>
      <button type="button" onClick={() => setPanelOpen(true)} className="pointer-events-auto inline-flex min-h-12 shrink-0 items-center gap-2 rounded-full border-2 border-[#292542] bg-primary px-5 text-sm font-black text-primary-foreground shadow-[3px_4px_0_#292542] transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none"><Pencil className="h-4 w-4" /> {mine ? "คู่หูของฉัน" : "ปักคู่หูของฉัน"}</button>
    </div>
    {mine && !mine.hidden && <div className="pointer-events-none absolute inset-x-0 bottom-20 z-[970] flex justify-center px-3 md:bottom-4"><LawnEmoteBar active={activeEmote} busy={emote.isLoading} picking={picking} onEmote={(value) => emote.mutate({ value })} onPickStart={() => setPicking(true)} onPickCancel={() => setPicking(false)} /></div>}
    {emote.isError && <p role="alert" className="absolute bottom-36 left-1/2 z-[970] -translate-x-1/2 rounded-full bg-card px-4 py-2 text-sm font-bold text-destructive shadow-sm">ยังส่งท่าไม่ได้ ลองอีกครั้งได้เลย</p>}
    {react.isError && <p role="alert" className="absolute bottom-20 left-1/2 z-[970] -translate-x-1/2 rounded-full bg-card px-4 py-2 text-sm font-bold text-destructive shadow-sm">ยังส่งรีแอคไม่ได้ ลองอีกครั้งได้เลย</p>}
    {moderate.isError && <p role="alert" className="absolute bottom-20 left-1/2 z-[970] -translate-x-1/2 rounded-full bg-card px-4 py-2 text-sm font-bold text-destructive shadow-sm">ยังเปลี่ยนสถานะรายการไม่ได้ ลองอีกครั้งได้เลย</p>}

    <Sheet open={panelOpen} onOpenChange={setPanelOpen} modal={false}>
      <SheetContent side={mobile ? "bottom" : "right"} onInteractOutside={(event) => event.preventDefault()} className={`overflow-y-auto ${mobile ? "max-h-[75vh] rounded-t-3xl" : "w-full sm:max-w-md"}`}>
        <SheetTitle className="sr-only">แผงลานของฉัน</SheetTitle>
        <SheetDescription className="sr-only">ปักคู่หู ตั้งอารมณ์ และดูเหตุการณ์บนลาน</SheetDescription>
        <section aria-labelledby="my-showcase-heading">
          <div className="flex flex-wrap items-start justify-between gap-3 pr-6"><div><p className="text-xs font-bold uppercase tracking-[.18em] text-primary">YOUR PLACE ON THE LAWN</p><h2 id="my-showcase-heading" className="mt-1 font-register-heading text-xl">ปักคู่หูของฉัน</h2></div>{mine && <span className={`rounded-full px-3 py-1 text-xs font-bold ${mine.hidden ? "bg-muted" : "bg-secondary"}`}>{mine.hidden ? "แอดมินซ่อนจากลาน · ยังแก้ไขได้" : "ปักอยู่แล้ว · แก้ไขได้"}</span>}</div>
          {own.isError && <p role="alert" className="mt-3 text-sm text-destructive">ยังโหลดรายการของคุณไม่ได้ <button type="button" onClick={() => own.refetch()} className="font-black underline">ลองใหม่</button></p>}
          {collection.isLoading && <p role="status" className="mt-5 text-sm">กำลังเปิดสมุดตัวละคร…</p>}
          {collection.isError && <div role="alert" className="mt-5 text-sm text-destructive">ยังโหลดตัวละครไม่ได้ <button type="button" onClick={() => collection.refetch()} className="font-black underline">ลองใหม่</button></div>}
          {collection.data?.length === 0 && <p className="mt-5 text-sm">ยังไม่มีตัวละครในสมุดสะสม <Link to="/character" className="font-black underline">ไปเปิดตัวละครตัวแรก</Link> แล้วกลับมาปักบนลานได้</p>}
          {collection.data && collection.data.length > 0 && <div className="mt-4 grid gap-4">
            <fieldset><legend className="text-sm font-bold">เลือกตัวที่อยากให้เพื่อนเจอ</legend><div className="mt-2 flex gap-3 overflow-x-auto pb-2">{collection.data.map((character) => <button key={character.id} type="button" aria-label={`เลือก ${character.serial}`} aria-pressed={chosenId === character.id} onClick={() => setDraftCharacterId(character.id)} className={`w-24 shrink-0 rounded-xl border p-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${chosenId === character.id ? "border-primary bg-primary/10" : "border-border bg-background"}`}><div className="mx-auto h-20 w-16"><BaroCharacterArt dna={character.dna} id={`lawn-choice-${character.id}`} /></div><span className="block truncate font-register-mono text-[10px] font-bold">{character.serial.slice(-8)}</span></button>)}</div></fieldset>
            <div><label htmlFor="showcase-message" className="text-sm font-bold">ฝากข้อความไว้บนลาน</label><textarea id="showcase-message" maxLength={160} value={message} onChange={(event) => setDraftMessage(event.target.value)} placeholder="วันนี้มีอะไรอยากบอกเพื่อน ๆ ไหม?" rows={3} className="mt-2 w-full resize-none rounded-xl border border-input bg-background p-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" /><p className="mt-1 text-right font-register-mono text-xs">{[...message].length}/160</p></div>
          </div>}
          {collection.data && collection.data.length > 0 && <div className="mt-2 flex flex-wrap gap-3"><button type="button" disabled={busy || !chosenId || [...message].length > 160} onClick={() => save.mutate()} className="min-h-11 rounded-full bg-primary px-5 text-sm font-bold text-primary-foreground shadow-sm disabled:opacity-50">{save.isLoading ? "กำลังบันทึก…" : mine ? "บันทึกการปัก" : "ปักบนลาน"}</button>{mine && <button type="button" disabled={busy} onClick={() => remove.mutate()} className="min-h-11 rounded-full border border-border bg-background px-5 text-sm font-bold disabled:opacity-50">เอาออกจากลาน</button>}</div>}
          {save.isError && <p role="alert" className="mt-3 text-sm font-bold text-destructive">ยังปักตัวละครไม่ได้ ตรวจตัวที่เลือกแล้วลองใหม่</p>}{remove.isError && <p role="alert" className="mt-3 text-sm font-bold text-destructive">ยังเอาออกจากลานไม่ได้ ลองใหม่ได้เลย</p>}{save.isSuccess && <p role="status" className="mt-3 text-sm font-bold text-primary">บันทึกการปักแล้ว</p>}{remove.isSuccess && <p role="status" className="mt-3 text-sm font-bold text-primary">เอาออกจากลานแล้ว</p>}
          {mine && <LawnMoodPicker mine={mine} userId={userId} />}
        </section>
        <div className="mt-6 border-t border-border pt-5"><GodEventHistory userId={userId} admin={includeHidden} replayId={replayId} onReplay={(id) => { setReplayId(id); setPanelOpen(false); }} onCast={() => { setReplayId(null); setPanelOpen(false); }} /></div>
        {includeHidden && view.data && view.data.length > plan.placements.length && <details className="mt-6 rounded-2xl border border-border bg-card p-4 text-sm"><summary className="cursor-pointer font-bold">รายการทั้งหมดสำหรับแอดมิน ({view.data.length})</summary><ul className="mt-3 space-y-2">{view.data.map((entry) => <li key={entry.owner_id} className="flex items-center justify-between gap-3"><span className="truncate">{entry.name}{entry.hidden ? " · ซ่อนอยู่" : ""}</span><button type="button" disabled={moderate.isLoading} onClick={() => moderate.mutate({ ownerId: entry.owner_id, hidden: !entry.hidden })} className="min-h-9 shrink-0 rounded-full border border-border bg-background px-3 text-xs font-bold disabled:opacity-50">{entry.hidden ? "คืนสู่ลาน" : "ซ่อนจากลาน"}</button></li>)}</ul></details>}
      </SheetContent>
    </Sheet>
    {inspectedEntry && <Suspense fallback={null}><Character3DViewer entry={inspectedEntry} onClose={() => setInspectedEntry(null)} /></Suspense>}
  </main>;
}
