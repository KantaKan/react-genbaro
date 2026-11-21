import { useMutation, useQueryClient } from "react-query";
import { showcaseLawnService, type LawnEmote, type LawnMood, type ShowcaseEntry } from "@/application/services/showcaseLawnService";

const lawnEmotes: Array<{ value: LawnEmote; emoji: string; label: string }> = [
  { value: "wave", emoji: "👋", label: "โบกมือ" },
  { value: "dance", emoji: "💃", label: "เต้น" },
  { value: "jump", emoji: "🦘", label: "กระโดด" },
  { value: "heart", emoji: "💗", label: "ส่งหัวใจ" },
  { value: "nap", emoji: "😴", label: "งีบ" },
  { value: "visit", emoji: "🙌", label: "ไปหาเพื่อน" },
];

export function LawnEmoteBar({ active, busy, picking, onEmote, onPickStart, onPickCancel }: { active?: LawnEmote; busy: boolean; picking: boolean; onEmote: (emote: LawnEmote | "") => void; onPickStart: () => void; onPickCancel: () => void }) {
  if (picking) return <div role="status" className="pointer-events-auto flex items-center gap-2 rounded-full border-2 border-[#292542] bg-[#fffaf0] px-4 py-2 text-sm font-black text-[#292542] shadow-[3px_4px_0_#292542]">🙌 แตะเพื่อนที่อยากไปแปะมือด้วย<button type="button" onClick={onPickCancel} className="rounded-full px-2 underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">ยกเลิก</button></div>;
  return <div role="group" aria-label="ท่าของคู่หูบนลาน · อยู่ 30 นาที" className="pointer-events-auto flex gap-1 rounded-full border-2 border-[#292542] bg-[#fffaf0] p-1 shadow-[3px_4px_0_#292542]">
    {lawnEmotes.map((emote) => <button key={emote.value} type="button" title={emote.label} aria-label={emote.label} aria-pressed={active === emote.value} disabled={busy} onClick={() => active === emote.value ? onEmote("") : emote.value === "visit" ? onPickStart() : onEmote(emote.value)}
      className={`flex h-10 w-10 items-center justify-center rounded-full text-xl transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 motion-reduce:transition-none ${active === emote.value ? "bg-primary/20 ring-2 ring-primary" : ""}`}>{emote.emoji}</button>)}
  </div>;
}

const moods: Array<{ value: LawnMood; label: string }> = [
  { value: "greeting", label: "👋 อยากทักทาย" },
  { value: "relaxing", label: "🌿 ขอชิล ๆ" },
  { value: "meal", label: "🍙 อยากกินข้าวกับเพื่อน" },
  { value: "playful", label: "🎈 อยากเล่นสนุก" },
  { value: "quiet", label: "🤫 ขอเวลาเงียบ ๆ" },
  { value: "surprise", label: "🎲 ให้ลานเลือกให้" },
];

export function LawnMoodPicker({ mine, userId }: { mine: ShowcaseEntry; userId?: string | null }) {
  const queryClient = useQueryClient();
  const active = mine.mood && mine.mood_until && Date.parse(mine.mood_until) > Date.now() ? mine.mood : undefined;
  const setMood = useMutation((mood: LawnMood | "") => showcaseLawnService.setMood(mood), {
    onSuccess: () => { queryClient.invalidateQueries(["showcase-lawn"]); queryClient.invalidateQueries(["showcase-lawn-mine", userId]); },
  });
  const until = active && mine.mood_until ? new Date(mine.mood_until).toLocaleString("th-TH", { timeZone: "Asia/Bangkok", hour: "2-digit", minute: "2-digit", day: "numeric", month: "short" }) : "";
  return <fieldset className="mt-6 border-t border-border pt-5">
    <legend className="sr-only">อารมณ์ของคู่หูบนลาน</legend>
    <p className="text-sm font-bold">วันนี้คู่หูอยากทำอะไรบนลาน?</p>
    <p className="mt-1 text-xs leading-5 text-muted-foreground">เลือกได้ครั้งละหนึ่งอารมณ์ อยู่ 24 ชั่วโมงแล้วกลับเป็นปกติเอง คู่หูจะเอนไปทางกิจกรรมนั้น แต่ลานจะจับคู่เพื่อนให้เองเสมอ ไม่มีใครถูกเรียกหรือถูกบังคับให้มาเล่นด้วย</p>
    <div className="mt-3 flex flex-wrap gap-2">
      {moods.map((mood) => <button key={mood.value} type="button" aria-pressed={active === mood.value} disabled={setMood.isLoading} onClick={() => setMood.mutate(mood.value)} className={`min-h-10 rounded-full border px-3 text-xs font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 ${active === mood.value ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background"}`}>{mood.label}</button>)}
      {active && <button type="button" disabled={setMood.isLoading} onClick={() => setMood.mutate("")} className="min-h-10 rounded-full px-3 text-xs font-bold underline disabled:opacity-50">กลับเป็นปกติ</button>}
    </div>
    {active === "quiet" && <p className="mt-2 text-xs text-muted-foreground">คู่หูจะเดิน นั่ง หรืองีบคนเดียว ไม่ถูกจับคู่กับใคร</p>}
    {active && <p role="status" className="mt-2 text-xs font-bold text-primary">ใช้ได้ถึง {until}</p>}
    {setMood.isError && <p role="alert" className="mt-2 text-xs font-bold text-destructive">ยังบันทึกอารมณ์ไม่ได้ ลองอีกครั้งได้เลย</p>}
  </fieldset>;
}
