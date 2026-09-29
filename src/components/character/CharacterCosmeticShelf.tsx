import type { CosmeticCollectionItem } from "@/domain/types";
import { characterBackgroundStyle } from "./characterCosmeticAppearance";

interface CharacterCosmeticShelfProps {
  items: CosmeticCollectionItem[];
  previewId: string | null;
  busy: boolean;
  onPreview: (id: string | null) => void;
  onEquip: (item: CosmeticCollectionItem) => void;
}

const slotLabels = { card_background: "ฉากหลังการ์ด", character_prop: "พร็อพตัวละคร" };

export function CharacterCosmeticShelf({ items, previewId, busy, onPreview, onEquip }: CharacterCosmeticShelfProps) {
  return <section aria-labelledby="baro-cosmetics-heading" className="mt-14 border-t border-border pt-8">
    <p className="text-xs font-bold uppercase tracking-[.2em] text-primary">THE DRESS-UP DRAWER</p>
    <h2 id="baro-cosmetics-heading" className="mt-1 font-register-heading text-3xl">ลิ้นชักของแต่ง</h2>
    <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">ลองแตะเพื่อพรีวิวได้ทุกชิ้น ของที่ได้รับจะอยู่ถาวรและสลับใช้ได้โดย DNA ไม่เปลี่ยน</p>
    {previewId && <button type="button" onClick={() => onPreview(null)} className="mt-4 rounded-full border border-border bg-card px-4 py-2 text-xs font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">ปิดพรีวิว</button>}
    <div className="mt-6 grid gap-5 lg:grid-cols-2">
      {(["card_background", "character_prop"] as const).map((slot) => <div key={slot} className="rounded-2xl border border-border bg-card p-4 text-card-foreground shadow-sm sm:p-5">
        <h3 className="font-register-heading text-lg">{slotLabels[slot]}</h3>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {items.filter((item) => item.slot === slot).map((item) => <div key={item.id} className={`rounded-xl border p-2 ${previewId === item.id ? "border-primary bg-primary/10" : "border-border bg-background"}`}>
            <button type="button" aria-label={`พรีวิว ${item.name}`} aria-pressed={previewId === item.id} onClick={() => onPreview(previewId === item.id ? null : item.id)} className="w-full text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#292542]">
              <span className="flex h-20 items-center justify-center overflow-hidden rounded-xl border border-[#292542]/20 text-3xl" style={slot === "card_background" ? characterBackgroundStyle(item.preview_value) : { background: "#dcefe4" }} aria-hidden="true">{slot === "character_prop" && ({ flower: "✿", "cat-ears": "🐱", egg: "🍳", halo: "✧", headphones: "🎧", "pixel-glasses": "▦", "tiny-crown": "♛" }[item.preview_value] ?? "✦")}</span>
              <span className="mt-2 block text-sm font-black leading-5">{item.name}</span>
              <span className="mt-1 block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{item.rarity} · {item.owned ? item.equipped ? "ใช้อยู่" : "มีแล้ว" : "ยังไม่ปลดล็อก"}</span>
            </button>
            <button type="button" aria-label={`${item.equipped ? "ถอด" : "ใช้"} ${item.name}`} disabled={!item.owned || busy} onClick={() => onEquip(item)} className="mt-2 min-h-9 w-full rounded-full bg-primary px-2 text-[11px] font-bold text-primary-foreground disabled:cursor-default disabled:opacity-45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{item.equipped ? "ถอดออก" : item.owned ? "ใช้ชิ้นนี้" : "ยังไม่มี"}</button>
          </div>)}
        </div>
      </div>)}
    </div>
  </section>;
}
