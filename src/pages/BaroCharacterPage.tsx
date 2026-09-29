import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, Fingerprint, Heart, RotateCw, Sparkles } from "lucide-react";
import { baroCharacterService, type BaroCharacter, type CharacterGrowthSnapshot } from "@/application/services/baroCharacterService";
import { BaroCharacterArt } from "@/components/character/BaroCharacterArt";
import { useAuth } from "@/application/contexts/AuthContext";
import { CharacterCollectionShelf } from "@/components/character/CharacterCollectionShelf";
import { CharacterCosmeticShelf } from "@/components/character/CharacterCosmeticShelf";
import { characterBackgroundStyle } from "@/components/character/characterCosmeticAppearance";
import { characterCosmeticService } from "@/application/services/characterCosmeticService";
import { careEnergyService, type CareEnergyState } from "@/application/services/careEnergyService";
import { CharacterCarePanel } from "@/components/character/CharacterCarePanel";
import type { CosmeticCollectionItem } from "@/domain/types";
import type { CharacterCosmeticSlot } from "@/domain/types/cosmetic";

const rarityLabels = {
  normal: "เพื่อนตัวนุ่ม",
  meme_rare: "Meme rare",
  legendary: "Legendary",
};

const rarityStyle = {
  normal: { label: "NORMAL", bg: "#a7dbc8", accent: "#347c69" },
  meme_rare: { label: "MEME RARE", bg: "#f4ba87", accent: "#ae613e" },
  legendary: { label: "LEGENDARY", bg: "#cab2f1", accent: "#7957a2" },
};

const patternNames: Record<string, string> = {
  freckles: "กระดาว", polka: "จุดกลม", stripes: "ริ้วขนม", waves: "คลื่นนุ่ม", marble: "หินอ่อน",
  checker: "ตารางจิ๋ว", sprouts: "ยอดอ่อน", hearts: "หัวใจ", bubbles: "ฟองสบู่", zigzag: "ซิกแซก",
  mosaic: "โมเสก", constellation: "กลุ่มดาว", paint: "สีหก", petals: "กลีบดอก", egg: "ไข่ดาวหลงทาง",
  potato: "มันฝรั่งฮาเฮ", ramen: "บะหมี่วน", error404: "บั๊ก 404",
};

const formNames = ["ตัวจิ๋ว", "ตัวป่วน", "ตัวมั่นใจ", "ตัวในตำนาน"];

function CharacterCard({ character, growth, background, prop, careEffect }: { character: BaroCharacter; growth?: CharacterGrowthSnapshot; background?: string; prop?: string; careEffect: number }) {
  const rarity = rarityStyle[character.dna.rarity] ?? rarityStyle.normal;
  return <article className="relative mx-auto w-full max-w-[390px] overflow-hidden rounded-[30px] border-[5px] border-[#292542] bg-[#fffaf0] p-3 text-[#292542] shadow-[12px_14px_0_#292542]">
    <div className="relative overflow-hidden rounded-[20px] p-5" style={characterBackgroundStyle(background, rarity.bg)}>
      <div className="relative z-10 flex items-start justify-between gap-2">
        <div><p className="text-[10px] font-black tracking-[.2em]">BARO CHARACTER / 001</p><h2 className="mt-1 text-3xl font-black tracking-tight">คู่หูของฉัน</h2></div>
        <span className="rounded-full border-2 border-[#292542] bg-[#fffaf0] px-3 py-1 text-[10px] font-black tracking-wider">{rarity.label}</span>
      </div>
      <div className="pointer-events-none absolute -right-12 top-16 h-44 w-44 rounded-full border-[18px] border-white/25" />
      <div className="pointer-events-none absolute -left-10 bottom-20 h-32 w-32 rounded-full bg-white/20" />
      <div key={careEffect} className={careEffect > 0 ? "relative mx-auto mt-4 h-[300px] w-[240px] max-w-full motion-safe:animate-[bounce_.65s_ease-in-out_1]" : "relative mx-auto mt-4 h-[300px] w-[240px] max-w-full"}>
        <BaroCharacterArt dna={character.dna} id={character.id} growth={growth} prop={prop} />
        {careEffect > 0 && <span role="status" className="absolute right-0 top-4 rounded-full border-2 border-[#292542] bg-white px-3 py-1 text-sm font-black shadow-[2px_3px_0_#292542]">เย้! ✨</span>}
      </div>
      <div className="relative mt-1 rounded-[18px] border-2 border-[#292542] bg-[#fffaf0] px-4 py-3">
        <div className="flex items-center justify-between gap-2"><span className="text-xs font-black uppercase tracking-widest" style={{ color: rarity.accent }}>{rarityLabels[character.dna.rarity]}</span><Heart className="h-4 w-4 fill-[#f7a5a4] text-[#292542]" /></div>
        <p className="mt-1 text-2xl font-black">{patternNames[character.dna.pattern] ?? character.dna.pattern}</p>
        <p className="mt-1 font-mono text-[10px] font-bold tracking-wide" data-testid="character-serial">{character.serial}</p>
        {growth && <div className="mt-3 flex flex-wrap items-center gap-2 border-t-2 border-[#292542]/15 pt-3 text-[11px] font-black"><span>ร่าง{formNames[growth.form_index] ?? formNames[0]}</span><span className="text-[#a49cab]">✦</span><span>ดีเทลขั้น {growth.detail_index}/10</span><span className="text-[#a49cab]">✦</span><span>{growth.mood === "active" ? "กำลังลุย" : "กำลังพัก"}</span></div>}
      </div>
    </div>
    <div className="flex items-center justify-between px-2 pt-3 font-mono text-[10px] font-bold uppercase tracking-wide"><span>ONE OF A KIND</span><span>BARO • GEN THAILAND</span></div>
  </article>;
}

export default function BaroCharacterPage() {
  const { userId } = useAuth();
  const queryClient = useQueryClient();
  const [previewCosmeticId, setPreviewCosmeticId] = useState<string | null>(null);
  const [careEffect, setCareEffect] = useState(0);
  const collectionKey = ["baro-character-collection", userId];
  const collection = useQuery(collectionKey, baroCharacterService.collection, { enabled: Boolean(userId), retry: false });
  const reveal = useMutation(baroCharacterService.revealStarter, {
    onSuccess: (character) => {
      queryClient.setQueryData<BaroCharacter[]>(collectionKey, (current) => {
        const withoutStarter = (current ?? []).filter((item) => !item.is_starter);
        return [character, ...withoutStarter];
      });
    },
  });
  const selectionKey = ["baro-character-selection", userId];
  const selection = useQuery(selectionKey, baroCharacterService.selection, { enabled: Boolean(userId && collection.data?.length), retry: false });
  const equip = useMutation(baroCharacterService.equip, { onSuccess: (updated) => { queryClient.setQueryData(selectionKey, updated); } });
  const pin = useMutation(baroCharacterService.pin, { onSuccess: (updated) => { queryClient.setQueryData(selectionKey, updated); } });
  const starter = collection.data?.find((item) => item.is_starter);
  const character = collection.data?.find((item) => item.id === selection.data?.equipped_id) ?? starter ?? collection.data?.[0];
  const growth = useQuery(["baro-character-growth", userId], baroCharacterService.growth, { enabled: Boolean(userId && character), retry: false });
  const careEnergyKey = ["care-energy", userId];
  const careEnergy = useQuery(careEnergyKey, () => careEnergyService.state(userId!), { enabled: Boolean(userId && character), retry: false });
  const care = useMutation(() => careEnergyService.careForCharacter(userId!), {
    onSuccess: (result) => {
      queryClient.setQueryData<CareEnergyState>(careEnergyKey, result.state);
      setCareEffect((current) => current + 1);
    },
  });
  const cosmeticKey = ["character-cosmetic-collection", userId];
  const cosmetics = useQuery(cosmeticKey, characterCosmeticService.collection, { enabled: Boolean(userId && character), retry: false });
  const cosmeticEquip = useMutation(async (item: CosmeticCollectionItem) => {
    const slot = item.slot as CharacterCosmeticSlot;
    if (item.equipped) await characterCosmeticService.unequip(slot);
    else await characterCosmeticService.equip(slot, item.id);
  }, { onSuccess: () => { setPreviewCosmeticId(null); queryClient.invalidateQueries(cosmeticKey); } });
  const previewItem = cosmetics.data?.items.find((item) => item.id === previewCosmeticId);
  const appearance = (slot: CharacterCosmeticSlot) => previewItem?.slot === slot
    ? previewItem.preview_value
    : cosmetics.data?.items.find((item) => item.slot === slot && item.equipped)?.preview_value;

  return <main className="min-h-[calc(100vh-5rem)] bg-[#f7f0e6] px-4 py-8 font-['Trebuchet_MS',sans-serif] text-[#292542] sm:px-8 lg:py-12">
    <div className="mx-auto max-w-6xl">
      <Link to="/" className="inline-flex items-center gap-2 rounded-full border-2 border-[#292542] bg-white/75 px-4 py-2 text-sm font-bold transition-transform hover:-translate-x-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#292542]"><ArrowLeft className="h-4 w-4" /> กลับหน้าแรก</Link>
      <div className="mt-7 grid items-center gap-12 lg:grid-cols-[1.08fr_.92fr]">
        <div className="order-2 lg:order-1">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#292542] px-4 py-2 text-xs font-black uppercase tracking-[.18em] text-[#fffaf0]"><Sparkles className="h-4 w-4" /> Your little companion</div>
          <h1 className="mt-5 max-w-[15ch] text-4xl font-black leading-[1.08] tracking-tight sm:text-5xl">เพื่อนตัวจิ๋ว<br />ที่เป็นคุณคนเดียว</h1>
          <p className="mt-5 max-w-xl text-base leading-8 text-[#5b5870]">ตัวละคร Baro จะอยู่กับคุณตลอดทาง หน้าตาและลายเกิดจากชุดลักษณะเฉพาะของคุณ ส่วนการเติบโตและของแต่งจะค่อย ๆ ตามมาเมื่อคุณใช้ชีวิตใน Baro</p>

          {collection.isLoading && <div className="mt-9 rounded-3xl border-2 border-[#292542] bg-white/65 p-6" role="status">กำลังตามหาเพื่อนตัวจิ๋วของคุณ…</div>}
          {collection.isError && <div className="mt-9 rounded-3xl border-2 border-[#a9505e] bg-[#fff4f1] p-6"><p className="font-bold">ยังโหลดสมุดตัวละครไม่ได้</p><p className="mt-1 text-sm">ข้อมูลยังไม่เปลี่ยน ลองอีกครั้งได้เลย</p><button type="button" onClick={() => collection.refetch()} className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#292542] px-5 py-3 font-bold text-white"><RotateCw className="h-4 w-4" /> ลองใหม่</button></div>}

          {!collection.isLoading && !collection.isError && !starter && <div className="mt-9 rounded-[28px] border-2 border-[#292542] bg-white/75 p-6 shadow-[7px_8px_0_#d5c9db] sm:p-8">
            <p className="text-xs font-black uppercase tracking-[.2em] text-[#8b699d]">FIRST REVEAL</p>
            <h2 className="mt-2 text-2xl font-black">อยากเจอคู่หูของคุณไหม?</h2>
            <p className="mt-2 text-sm leading-7 text-[#5b5870]">กดเปิดเมื่อพร้อมได้เลย ไม่จำเป็นต้องเปิดก่อนเขียน reflection และเปิดแล้วจะเป็นตัวเดิมถาวร ไม่มีการสุ่มใหม่</p>
            <div className="mt-6 grid grid-cols-3 gap-2" aria-label="โอกาสได้ตัวละครแต่ละระดับ">
              <div className="rounded-2xl bg-[#e3f3e7] p-3 text-center"><span className="block text-2xl font-black">83%</span><span className="text-[11px] font-bold">ปกติ</span></div>
              <div className="rounded-2xl bg-[#fde3ca] p-3 text-center"><span className="block text-2xl font-black">15%</span><span className="text-[11px] font-bold">มีมแรร์</span></div>
              <div className="rounded-2xl bg-[#eadcf7] p-3 text-center"><span className="block text-2xl font-black">2%</span><span className="text-[11px] font-bold">ตำนาน</span></div>
            </div>
            <button type="button" disabled={reveal.isLoading} onClick={() => reveal.mutate()} className="mt-6 inline-flex min-h-14 w-full items-center justify-center gap-3 rounded-full border-2 border-[#292542] bg-[#f4bd80] px-6 text-base font-black shadow-[4px_5px_0_#292542] transition-transform hover:-translate-y-1 disabled:cursor-wait disabled:opacity-70">{reveal.isLoading ? "กำลังเปิดตัวละคร…" : "เปิดตัวละครของฉัน"}<ArrowRight className="h-5 w-5" /></button>
            {reveal.isError && <p role="alert" className="mt-4 text-sm font-bold text-[#a9505e]">เปิดไม่สำเร็จ ลองกดใหม่ได้เลย ข้อมูลเดิมยังปลอดภัย</p>}
          </div>}

          {character && <div className="mt-9 rounded-[28px] border-2 border-[#292542] bg-white/75 p-6 shadow-[7px_8px_0_#d5c9db] sm:p-8">
            <div className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#dcefe4]"><Fingerprint className="h-6 w-6" /></div><div><p className="text-xs font-black uppercase tracking-[.15em] text-[#7c7990]">PERMANENT DNA</p><h2 className="text-xl font-black">เจอกันแล้ว!</h2></div></div>
            <p className="mt-5 text-sm leading-7 text-[#5b5870]">นี่คือคู่หูของคุณ จะกลับมาดูอีกกี่ครั้งก็ยังเป็นตัวเดิม ลาย {patternNames[character.dna.pattern] ?? character.dna.pattern} และชุดลักษณะนี้ไม่ซ้ำใคร</p>
            <div className="mt-5 flex flex-wrap gap-2 text-xs font-bold"><span className="rounded-full bg-[#e3f3e7] px-3 py-2">สี {character.dna.palette}</span><span className="rounded-full bg-[#fde3ca] px-3 py-2">{rarityLabels[character.dna.rarity]}</span><span className="rounded-full bg-[#eadcf7] px-3 py-2">ลาย #{character.dna.pattern_seed}</span></div>
            {growth.data && <div className="mt-6 rounded-2xl bg-[#e8f2e9] p-4 text-sm leading-6"><p className="font-black">โตตามวันที่คุณตั้งใจ 🔥</p><p className="mt-1">สถิติสูงสุด {growth.data.best_streak} วันทำงาน · ตอนนี้ {growth.data.current_streak} วัน</p><p className="text-[#5b5870]">{growth.data.mood === "resting" ? "ช่วงพักก็ไม่ทำให้ร่างที่เคยโตหดลงนะ" : growth.data.next_detail_at ? `อีกก้าวที่ ${growth.data.next_detail_at} วัน จะมีดีเทลใหม่` : "ปลดล็อกดีเทลครบแล้ว"}</p></div>}
            {growth.isError && <p className="mt-6 text-sm text-[#a9505e]">ยังอ่านสถานะการโตไม่ได้ <button type="button" onClick={() => growth.refetch()} className="font-black underline">ลองใหม่</button></p>}
            <CharacterCarePanel state={careEnergy.data} loading={careEnergy.isLoading} caring={care.isLoading} error={careEnergy.isError || care.isError} onCare={() => care.mutate()} onRetry={() => careEnergy.refetch()} />
            {selection.isError && <p className="mt-4 text-sm text-[#a9505e]">ยังอ่านตัวที่เลือกไว้ไม่ได้ <button type="button" onClick={() => selection.refetch()} className="font-black underline">ลองใหม่</button></p>}
            {(equip.isError || pin.isError) && <p role="alert" className="mt-4 text-sm text-[#a9505e]">เปลี่ยนตัวละครไม่สำเร็จ ลองอีกครั้งได้เลย</p>}
            <p className="mt-6 text-xs leading-6 text-[#79758a]">การ์ดและตัวละครเป็นของสะสมใน Baro เท่านั้น ไม่มีการซื้อขายหรือเงินจริง</p>
          </div>}
        </div>

        <div className="order-1 flex justify-center lg:order-2">
          {character ? <CharacterCard character={character} growth={growth.data} background={appearance("card_background")} prop={appearance("character_prop")} careEffect={careEffect} /> : <div className="relative flex aspect-[390/530] w-full max-w-[390px] items-center justify-center overflow-hidden rounded-[30px] border-[5px] border-[#292542] bg-[#dcefe4] shadow-[12px_14px_0_#292542]" aria-label="การ์ดตัวละครที่ยังไม่ได้เปิด"><div className="absolute -left-20 top-12 h-64 w-64 rounded-full border-[30px] border-white/30" /><div className="absolute -right-16 bottom-16 h-56 w-56 rounded-full bg-[#f4bd80]/40" /><div className="relative text-center"><div className="text-[120px] font-black leading-none text-white/85">?</div><p className="mt-2 rounded-full bg-[#292542] px-6 py-2 text-xs font-black tracking-[.2em] text-white">WHO WILL YOU MEET?</p></div></div>}
        </div>
      </div>
      {collection.data && collection.data.length > 0 && <CharacterCollectionShelf characters={collection.data} selection={selection.data} growth={growth.data} busy={equip.isLoading || pin.isLoading} onEquip={(id) => equip.mutate(id)} onPin={(id) => pin.mutate(id)} />}
      {character && <>
        {cosmetics.isLoading && <p className="mt-12 text-sm" role="status">กำลังเปิดลิ้นชักของแต่ง…</p>}
        {cosmetics.isError && <p className="mt-12 text-sm text-[#a9505e]">ยังโหลดของแต่งไม่ได้ <button type="button" onClick={() => cosmetics.refetch()} className="font-black underline">ลองใหม่</button></p>}
        {cosmeticEquip.isError && <p className="mt-6 text-sm text-[#a9505e]" role="alert">เปลี่ยนของแต่งไม่สำเร็จ ลองอีกครั้งได้เลย</p>}
        {cosmetics.data && <CharacterCosmeticShelf items={cosmetics.data.items} previewId={previewCosmeticId} busy={cosmeticEquip.isLoading} onPreview={setPreviewCosmeticId} onEquip={(item) => cosmeticEquip.mutate(item)} />}
      </>}
    </div>
  </main>;
}
