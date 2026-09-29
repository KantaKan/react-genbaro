import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { Sparkles } from "lucide-react";
import { baroCharacterService, type BaroCharacter, type CharacterSelection } from "@/application/services/baroCharacterService";
import { characterCosmeticService } from "@/application/services/characterCosmeticService";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { BaroCharacterArt } from "./BaroCharacterArt";

const rarityColors: Record<string, string> = {
  normal: "#ccebdd",
  meme_rare: "#f8d7b7",
  legendary: "#dfcdf8",
};

export function AdminCharacterDialog({ userId, learnerName }: { userId: string; learnerName: string }) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const collectionKey = ["admin-baro-character-collection", userId];
  const selectionKey = ["admin-baro-character-selection", userId];
  const collection = useQuery(collectionKey, () => baroCharacterService.adminCollection(userId), { enabled: open, retry: false });
  const selection = useQuery(selectionKey, () => baroCharacterService.adminSelection(userId), { enabled: open, retry: false });
  const cosmeticKey = ["admin-character-cosmetics", userId];
  const cosmetics = useQuery(cosmeticKey, () => characterCosmeticService.adminCollection(userId), { enabled: open, retry: false });
  const exactGrant = useMutation((id: string) => characterCosmeticService.grant(userId, id), {
    onSuccess: () => {
      queryClient.invalidateQueries(cosmeticKey);
      queryClient.invalidateQueries(["character-cosmetic-collection", userId]);
    },
  });
  const grant = useMutation(() => baroCharacterService.adminGrant(userId), {
    onSuccess: (character) => {
      queryClient.setQueryData<BaroCharacter[]>(collectionKey, (current) => [...(current ?? []), character]);
      queryClient.invalidateQueries(["baro-character-collection", userId]);
    },
  });
  const equip = useMutation((id: string) => baroCharacterService.adminEquip(userId, id), {
    onSuccess: (updated) => {
      queryClient.setQueryData<CharacterSelection>(selectionKey, updated);
      queryClient.invalidateQueries(["baro-character-selection", userId]);
    },
  });
  const pin = useMutation((id: string) => baroCharacterService.adminPin(userId, id), {
    onSuccess: (updated) => {
      queryClient.setQueryData<CharacterSelection>(selectionKey, updated);
      queryClient.invalidateQueries(["baro-character-selection", userId]);
    },
  });
  const busy = grant.isLoading || equip.isLoading || pin.isLoading || exactGrant.isLoading;

  return <Dialog open={open} onOpenChange={setOpen}>
    <DialogTrigger asChild><Button variant="outline" className="gap-2"><Sparkles className="h-4 w-4" /> Baro Character</Button></DialogTrigger>
    <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
      <DialogHeader><DialogTitle className="text-xl font-black">สมุดตัวละครของ {learnerName}</DialogTitle></DialogHeader>
      <p className="text-sm text-muted-foreground">แอดมินสุ่มตัวใหม่ให้ได้โดยไม่ทับตัวเดิม และช่วยเลือกตัวใช้งานหรือตัวปักลานแยกกันได้ ประวัติการเปลี่ยนจะอยู่ใน Admin History</p>
      <div className="rounded-2xl border border-border bg-muted/40 p-4">
        <p className="text-xs font-black uppercase tracking-widest">ADMIN GRANT · 83 / 15 / 2</p>
        <p className="mt-1 text-sm text-muted-foreground">ตัวปกติ 83% · มีมแรร์ 15% · ตำนาน 2%</p>
        <Button type="button" disabled={busy} onClick={() => grant.mutate()} className="mt-3 w-full sm:w-auto">{grant.isLoading ? "กำลังสุ่ม…" : `สุ่มตัวละครให้ ${learnerName}`}</Button>
      </div>
      {(collection.isError || selection.isError) && <div className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive">โหลดสมุดไม่ได้ <button type="button" onClick={() => { collection.refetch(); selection.refetch(); }} className="font-bold underline">ลองใหม่</button></div>}
      {(grant.isError || equip.isError || pin.isError) && <p role="alert" className="text-sm font-bold text-destructive">บันทึกไม่สำเร็จ ลองอีกครั้งได้เลย</p>}
      {(collection.isLoading || selection.isLoading) && <p role="status" className="py-8 text-center text-sm">กำลังเปิดสมุดสะสม…</p>}
      {collection.data && collection.data.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">ยังไม่มีตัวละครในสมุด แอดมินสุ่มให้ตัวแรกได้</p>}
      <div className="grid gap-3 sm:grid-cols-2">
        {(collection.data ?? []).map((character) => {
          const equipped = selection.data?.equipped_id === character.id;
          const pinned = selection.data?.pinned_id === character.id;
          return <article key={character.id} className="overflow-hidden rounded-2xl border-2 border-[#292542] bg-[#fffaf0] p-2 text-[#292542]">
            <div className="flex items-center gap-3 rounded-xl p-2" style={{ backgroundColor: rarityColors[character.dna.rarity] ?? rarityColors.normal }}>
              <div className="h-28 w-24 shrink-0"><BaroCharacterArt dna={character.dna} id={`${character.id}-admin`} /></div>
              <div className="min-w-0"><p className="text-xs font-black uppercase">{character.is_starter ? "STARTER" : "GIFTED"}</p><p className="mt-1 font-black capitalize">{character.dna.pattern}</p><p className="text-xs">{character.dna.palette}</p></div>
            </div>
            <p className="mt-2 break-all px-1 font-mono text-[11px] font-bold">{character.serial}</p>
            <div className="mt-2 flex gap-2 px-1 pb-1 text-xs font-bold">
              <button type="button" aria-label={`ให้ใช้ ${character.serial}`} disabled={!selection.data || busy || equipped} onClick={() => equip.mutate(character.id)} className="min-h-9 flex-1 rounded-full border-2 border-[#292542] bg-[#d4efe1] px-2 disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#292542]">{equipped ? "ใช้อยู่" : "ให้ใช้"}</button>
              <button type="button" aria-label={pinned ? `เอา ${character.serial} ออกจากลาน` : `ปัก ${character.serial}`} disabled={!selection.data || busy} onClick={() => pin.mutate(pinned ? "" : character.id)} className="min-h-9 flex-1 rounded-full border-2 border-[#292542] bg-[#f8dbb8] px-2 disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#292542]">{pinned ? "เอาออกจากลาน" : "ปักลาน"}</button>
            </div>
          </article>;
        })}
      </div>
      <section className="mt-5 border-t border-border pt-5" aria-label="ของแต่งตัวละคร">
        <h3 className="text-lg font-black">แจกของแต่งแบบเลือกชิ้น</h3>
        <p className="mt-1 text-sm text-muted-foreground">แจกฉากหลังหรือพร็อพชิ้นที่เลือกได้ตรง ๆ ไม่สุ่มและไม่แตะของต้นไม้เดิม</p>
        {cosmetics.isLoading && <p role="status" className="mt-3 text-sm">กำลังโหลดของแต่ง…</p>}
        {cosmetics.isError && <p className="mt-3 text-sm text-destructive">โหลดของแต่งไม่ได้ <button type="button" className="font-bold underline" onClick={() => cosmetics.refetch()}>ลองใหม่</button></p>}
        {exactGrant.isError && <p role="alert" className="mt-3 text-sm text-destructive">แจกของแต่งไม่สำเร็จ ลองอีกครั้งได้เลย</p>}
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {(cosmetics.data?.items ?? []).map((item) => <div key={item.id} className="flex items-center justify-between gap-2 rounded-xl border border-border p-3">
            <div className="min-w-0"><p className="text-sm font-bold">{item.name}</p><p className="text-xs text-muted-foreground">{item.slot === "card_background" ? "ฉากหลัง" : "พร็อพ"} · {item.rarity}</p></div>
            <Button type="button" size="sm" variant="outline" disabled={busy || item.owned || item.starter} onClick={() => exactGrant.mutate(item.id)} aria-label={`แจก ${item.name}`}>{item.owned ? "มีแล้ว" : "แจก"}</Button>
          </div>)}
        </div>
      </section>
    </DialogContent>
  </Dialog>;
}
