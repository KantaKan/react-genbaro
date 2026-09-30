import { useMutation, useQueryClient } from "react-query";
import { showcaseLawnService, type LawnMood, type ShowcaseEntry } from "@/application/services/showcaseLawnService";

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
    {active && <p role="status" className="mt-2 text-xs font-bold text-[#347c69]">ใช้ได้ถึง {until}</p>}
    {setMood.isError && <p role="alert" className="mt-2 text-xs font-bold text-[#a9505e]">ยังบันทึกอารมณ์ไม่ได้ ลองอีกครั้งได้เลย</p>}
  </fieldset>;
}
