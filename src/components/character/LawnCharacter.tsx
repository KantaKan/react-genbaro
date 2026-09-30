import { useRef, useState, type CSSProperties, type ReactNode } from "react";
import { Box, X } from "lucide-react";
import type { ShowcaseEntry } from "@/application/services/showcaseLawnService";
import { useIsMobile } from "@/hooks/use-mobile";
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { BaroCharacterArt } from "./BaroCharacterArt";


const rarityTone: Record<string, string> = {
  normal: "bg-[hsl(var(--character-normal))] text-[hsl(var(--character-normal-foreground))]",
  meme_rare: "bg-[hsl(var(--character-meme))] text-[hsl(var(--character-meme-foreground))]",
  legendary: "bg-[hsl(var(--character-legendary))] text-[hsl(var(--character-legendary-foreground))]",
};
const reactionChoices = ["❤️", "✨", "😂", "🙌"];
const traitLabels = [["body", "ทรง"], ["ears", "หู"], ["eyes", "ตา"], ["mark", "ลาย"], ["palette", "สี"], ["pattern", "แพทเทิร์น"]] as const;

export interface LawnCardActions {
  admin: boolean;
  busy: boolean;
  onReact: (emoji: string) => void;
  onModerate: (hidden: boolean) => void;
  onInspect: () => void;
}

export function LawnCharacterCard({ entry, admin, busy, onReact, onModerate, onInspect }: { entry: ShowcaseEntry } & LawnCardActions) {
  const { dna } = entry.character;
  return <div className="text-sm text-foreground">
    <div className={`rounded-xl p-3 ${rarityTone[dna.rarity] ?? rarityTone.normal}`}>
      <div className="flex items-start justify-between gap-2"><p className="font-register-heading text-base font-bold">{entry.name}</p>{entry.hidden && <span className="rounded-full bg-card px-2 py-0.5 text-[10px] font-bold text-card-foreground">ซ่อนอยู่</span>}</div>
      <div className="mx-auto h-36 w-28"><BaroCharacterArt dna={dna} id={`lawn-card-${entry.character.id}`} prop={entry.prop} /></div>
      <div className="flex items-center justify-between gap-2 font-register-mono text-[10px] font-bold"><span>{dna.rarity.replace("_", " ")}</span><span>{entry.character.serial}</span></div>
    </div>
    <dl className="mt-3 grid grid-cols-3 gap-x-3 gap-y-1 text-xs">
      {traitLabels.map(([key, label]) => <div key={key} className="min-w-0"><dt className="text-muted-foreground">{label}</dt><dd className="truncate font-bold">{dna[key]}</dd></div>)}
      {entry.prop && <div className="col-span-3"><dt className="text-muted-foreground">ของที่สวมอยู่</dt><dd className="font-bold">{entry.prop.replace(/-/g, " ")}</dd></div>}
    </dl>
    <p className="mt-3 whitespace-pre-wrap break-words leading-6">{entry.message || "แวะมาทักทายกันได้นะ 🌱"}</p>
    {!entry.hidden && <div className="mt-3 flex flex-wrap gap-2" aria-label={`รีแอคให้ ${entry.name}`}>{reactionChoices.map((emoji) => {
      const reaction = entry.reactions?.find((item) => item.emoji === emoji);
      return <button key={emoji} type="button" aria-label={`ส่ง ${emoji} ให้ ${entry.name}`} aria-pressed={reaction?.reacted ?? false} disabled={busy} onClick={() => onReact(emoji)} className={`min-h-9 rounded-full border border-border px-2.5 text-xs font-bold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 motion-reduce:transition-none ${reaction?.reacted ? "bg-primary text-primary-foreground" : "bg-background"}`}>{emoji} <span className="font-register-mono">{reaction?.count ?? 0}</span></button>;
    })}</div>}
    <div className="mt-3 flex flex-wrap gap-2">
      {!entry.hidden && <button type="button" onClick={onInspect} className="inline-flex min-h-9 items-center gap-2 rounded-full border border-border bg-secondary px-3 text-xs font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><Box className="h-4 w-4" /> ดูคู่หู 3D</button>}
      {admin && <button type="button" disabled={busy} onClick={() => onModerate(!entry.hidden)} className="min-h-9 rounded-full border border-border bg-background px-3 text-xs font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50">{entry.hidden ? "คืนสู่ลาน" : "ซ่อนจากลาน"}</button>}
    </div>
  </div>;
}

export function LawnCardSurface({ entry, actions, anchorClassName, anchorStyle, anchorData, renderTrigger }: { entry: ShowcaseEntry; actions: LawnCardActions; anchorClassName?: string; anchorStyle?: CSSProperties; anchorData?: Record<string, string>; renderTrigger: (open: () => void) => ReactNode }) {
  const [open, setOpen] = useState(false);
  const mobile = useIsMobile();
  const anchor = useRef<HTMLSpanElement>(null);
  const returnFocus = (event: Event) => { event.preventDefault(); anchor.current?.querySelector("button")?.focus(); };
  const trigger = <span ref={anchor} className={anchorClassName} style={anchorStyle} {...anchorData}>{renderTrigger(() => setOpen(true))}</span>;
  const card = <LawnCharacterCard entry={entry} {...actions} onInspect={() => { setOpen(false); actions.onInspect(); }} />;
  if (mobile) {
    return <>
      {trigger}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent data-lawn-card side="bottom" onCloseAutoFocus={returnFocus} className="max-h-[85vh] overflow-y-auto rounded-t-3xl">
          <SheetTitle>การ์ดของ {entry.name}</SheetTitle>
          <SheetDescription className="sr-only">ข้อมูลสาธารณะของตัวละครบนลาน</SheetDescription>
          <div className="mt-3">{card}</div>
        </SheetContent>
      </Sheet>
    </>;
  }
  return <Popover open={open} onOpenChange={setOpen}>
    <PopoverAnchor asChild>{trigger}</PopoverAnchor>
    <PopoverContent data-lawn-card role="dialog" aria-label={`การ์ดของ ${entry.name}`} onCloseAutoFocus={returnFocus} className="w-80 rounded-2xl">
      <button type="button" onClick={() => setOpen(false)} aria-label="ปิดการ์ด" className="float-right -mr-1 -mt-1 rounded-full p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><X className="h-4 w-4" /></button>
      {card}
    </PopoverContent>
  </Popover>;
}
