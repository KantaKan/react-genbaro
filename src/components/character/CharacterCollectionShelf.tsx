import type { BaroCharacter, CharacterGrowthSnapshot, CharacterSelection } from "@/application/services/baroCharacterService";
import { BaroCharacterArt } from "./BaroCharacterArt";

const cardColors: Record<string, string> = {
  normal: "#ccebdd",
  meme_rare: "#f8d7b7",
  legendary: "#dfcdf8",
};

interface CharacterCollectionShelfProps {
  characters: BaroCharacter[];
  selection?: CharacterSelection;
  growth?: CharacterGrowthSnapshot;
  busy: boolean;
  onEquip: (id: string) => void;
  onPin: (id: string) => void;
}

export function CharacterCollectionShelf({ characters, selection, growth, busy, onEquip, onPin }: CharacterCollectionShelfProps) {
  return <section aria-labelledby="baro-collection-heading" className="mt-14 border-t-[3px] border-[#292542] pt-7">
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div><p className="text-xs font-black uppercase tracking-[.2em] text-[#8b699d]">THE BINDER</p><h2 id="baro-collection-heading" className="mt-1 text-3xl font-black">สมุดสะสมของฉัน</h2></div>
      <p className="rounded-full border-2 border-[#292542] bg-white px-4 py-2 font-mono text-xs font-black">{characters.length} ตัวถาวร</p>
    </div>
    <p className="mt-3 max-w-2xl text-sm leading-7 text-[#5b5870]">เลือกตัวที่ใช้เป็นคู่หู กับตัวที่ปักไว้บนลานได้แยกกัน เปลี่ยนเมื่อไรก็ได้โดยไม่ทำให้ DNA หรือการ์ดใบอื่นหาย</p>
    {!selection && <p role="status" className="mt-5 text-sm">กำลังดูตัวที่คุณเลือกไว้…</p>}
    <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {characters.map((character) => {
        const equipped = selection?.equipped_id === character.id;
        const pinned = selection?.pinned_id === character.id;
        return <article key={character.id} className="min-w-0 overflow-hidden rounded-[24px] border-[3px] border-[#292542] bg-[#fffaf0] p-2 shadow-[5px_6px_0_#d5c9db]">
          <div className="relative flex min-h-48 items-center gap-2 overflow-hidden rounded-[17px] p-3" style={{ backgroundColor: cardColors[character.dna.rarity] ?? cardColors.normal }}>
            <div className="h-40 w-32 shrink-0"><BaroCharacterArt dna={character.dna} id={`${character.id}-shelf`} growth={growth} /></div>
            <div className="relative z-10 min-w-0 self-end pb-2"><p className="text-[10px] font-black uppercase tracking-wider">{character.is_starter ? "STARTER" : "GIFTED"}</p><p className="mt-1 text-lg font-black capitalize">{character.dna.pattern}</p><p className="mt-1 text-xs font-bold">{character.dna.palette}</p></div>
            <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full border-[14px] border-white/25" />
          </div>
          <div className="px-2 pb-2 pt-3">
            <p className="break-all font-mono text-[10px] font-bold tracking-wide">{character.serial}</p>
            <div className="mt-2 flex min-h-7 flex-wrap gap-1 text-[10px] font-black">
              {equipped && <span className="rounded-full bg-[#d4efe1] px-2 py-1">กำลังใช้งาน</span>}
              {pinned && <span className="rounded-full bg-[#f8dbb8] px-2 py-1">ปักบนลาน</span>}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs font-black">
              <button type="button" aria-label={`ใช้ ${character.serial}`} disabled={!selection || busy || equipped} onClick={() => onEquip(character.id)} className="min-h-10 rounded-full border-2 border-[#292542] bg-[#d4efe1] px-2 disabled:cursor-default disabled:opacity-55 enabled:hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#292542]">{equipped ? "ใช้อยู่" : "ใช้ตัวนี้"}</button>
              <button type="button" aria-label={pinned ? `เอา ${character.serial} ออกจากลาน` : `ปัก ${character.serial}`} disabled={!selection || busy} onClick={() => onPin(pinned ? "" : character.id)} className="min-h-10 rounded-full border-2 border-[#292542] bg-[#f8dbb8] px-2 disabled:cursor-default disabled:opacity-55 enabled:hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#292542]">{pinned ? "เอาออก" : "ปักบนลาน"}</button>
            </div>
          </div>
        </article>;
      })}
    </div>
  </section>;
}
