import { useMemo, useState } from "react";
import { toast } from "react-toastify";
import { Lock, Shuffle } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { UserAvatar } from "@/components/user-avatar";
import { learnerApi } from "../api";
import { avatarDataUri, optionsFor, type OptionRow } from "./dicebear";
import { DICE_STYLES, type AvatarConfig, type AvatarStyle } from "./types";

const BGS = ["d1fae5", "e0e7ff", "fce7f3", "fef3c7", "e0f2fe", "ede9fe", "ffe4e6", "ccfbf1", "f4f4f5", "18181b"];
const GROUP: Record<string, string[]> = {
  Hair: ["hair", "hairColor", "hairAccessories", "hairAccessoriesColor", "hat", "hatColor"],
  Face: ["face", "head", "skinColor", "eyes", "eyesColor", "eyebrows", "brows", "eyebrowsColor", "nose", "noseColor", "mouth", "lips", "mouthColor", "freckles", "frecklesColor", "features"],
  Extras: ["glasses", "glassesColor", "earrings", "earringsColor", "beard", "accessories", "accessoriesColor"],
  Outfit: ["body", "bodyIcon", "clothing", "clothingColor", "gesture", "shapeColor"],
};
const LABEL: Record<string, string> = {
  hair: "Hair", hairColor: "Hair color", hat: "Hat", eyes: "Eyes", eyebrows: "Brows", brows: "Brows", nose: "Nose", mouth: "Mouth", lips: "Mouth",
  skinColor: "Skin tone", glasses: "Glasses", beard: "Beard", earrings: "Earrings", body: "Top", bodyIcon: "Shirt badge", clothing: "Clothes",
  clothingColor: "Clothes color", gesture: "Pose", face: "Face", head: "Head shape", features: "Extras", accessories: "Accessories",
};
const LOCK: Record<string, number> = { saturn: 15, galaxy: 30 };

function tabsFor(style: AvatarStyle): { tab: string; rows: OptionRow[] | null }[] {
  if (style === "blobatar") return [{ tab: "Background", rows: null }];
  const rows = optionsFor(style);
  const out: { tab: string; rows: OptionRow[] | null }[] = [];
  const used = new Set<string>();
  for (const [tab, keys] of Object.entries(GROUP)) {
    const r = keys.map((k) => rows.find((x) => x.key === k)).filter((x): x is OptionRow => !!x);
    r.forEach((x) => used.add(x.key));
    if (r.length) out.push({ tab, rows: r });
  }
  const rest = rows.filter((x) => !used.has(x.key));
  if (rest.length) out.push({ tab: "More", rows: rest });
  out.push({ tab: "Background", rows: null });
  return out;
}

export function AvatarEditor({
  open,
  onOpenChange,
  current,
  seed,
  name,
  streak,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  current: AvatarConfig | null | undefined;
  seed: string;
  name: string;
  streak: number;
  onSaved: (a: AvatarConfig) => void;
}) {
  const [draft, setDraft] = useState<AvatarConfig>(() => current ?? { style: "blobatar", seed, bg: "d1fae5", options: {} });
  const tabs = useMemo(() => tabsFor(draft.style), [draft.style]);
  const [tab, setTab] = useState(tabs[0].tab);
  const active = tabs.find((t) => t.tab === tab) ?? tabs[0];
  const [saving, setSaving] = useState(false);
  const sel = draft.style === "blobatar" ? {} : draft.options?.[draft.style] ?? {};

  const setPart = (key: string, v: string | null) =>
    setDraft((d) => ({ ...d, options: { ...d.options, [d.style]: { ...(d.options?.[d.style] ?? {}), [key]: v } } }));
  const setStyle = (s: AvatarStyle) => {
    setDraft((d) => ({ ...d, style: s }));
    setTab(tabsFor(s)[0].tab);
  };
  const shuffle = () => setDraft((d) => ({ ...d, seed: Math.random().toString(36).slice(2, 8), options: { ...d.options, [d.style]: {} }, bg: BGS[Math.floor(Math.random() * 8)] }));

  const save = async () => {
    setSaving(true);
    try {
      await learnerApi.savePreferences({ avatar: draft });
      onSaved(draft);
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't save your avatar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="learner grid max-h-[92vh] w-full max-w-[880px] grid-cols-1 gap-0 overflow-hidden rounded-[26px] border-0 bg-l-card p-0 text-l-ink md:grid-cols-[300px_1fr]">
        <div className="flex flex-col items-center gap-3.5 border-b border-l-hair bg-l-sub p-6 md:border-b-0 md:border-r">
          <DialogTitle className="self-start text-heading font-semibold">Your avatar</DialogTitle>
          <div className="grid h-[200px] w-[200px] place-items-center overflow-hidden rounded-full shadow-[0_0_0_6px_var(--l-card),0_24px_44px_-20px_rgba(0,0,0,.35)]" style={{ background: draft.bg ? `#${draft.bg}` : undefined }}>
            <UserAvatar userId={draft.seed} name={name} avatar={draft} className="h-full w-full" />
          </div>
          <button type="button" onClick={shuffle} className="inline-flex items-center gap-1.5 rounded-full bg-l-card px-3.5 py-2 text-body font-medium shadow-[0_0_0_1px_var(--l-hair)]">
            <Shuffle className="h-4 w-4" strokeWidth={1.5} />
            Shuffle
          </button>
          <div className="text-xs text-l-ink3">Style</div>
          <div className="flex flex-wrap justify-center gap-1.5">
            {(["blobatar", ...DICE_STYLES.map(([s]) => s)] as AvatarStyle[]).map((s) => (
              <button
                key={s}
                type="button"
                aria-label={`Style: ${s === "blobatar" ? "Blobatar" : DICE_STYLES.find(([x]) => x === s)![1]}`}
                aria-pressed={draft.style === s}
                onClick={() => setStyle(s)}
                className={`grid h-12 w-12 place-items-center overflow-hidden rounded-[14px] bg-l-card transition ${draft.style === s ? "shadow-[0_0_0_2px_var(--l-ink)]" : "shadow-[0_0_0_1px_var(--l-hair)]"}`}
              >
                {s === "blobatar" ? <UserAvatar userId={draft.seed} name={name} className="h-10 w-10" /> : <img src={avatarDataUri({ ...draft, style: s })} alt="" className="h-full w-full" />}
              </button>
            ))}
          </div>
        </div>

        <div className="flex min-h-0 flex-col">
          <div role="tablist" className="flex shrink-0 gap-1 overflow-x-auto px-4 pt-4">
            {tabs.map((t) => (
              <button key={t.tab} role="tab" type="button" aria-selected={t.tab === active.tab} onClick={() => setTab(t.tab)} className={`whitespace-nowrap rounded-[10px] px-3 py-2 text-body font-semibold ${t.tab === active.tab ? "bg-l-sub text-l-ink" : "text-l-ink2"}`}>
                {t.tab}
              </button>
            ))}
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-4" style={{ maxHeight: "60vh" }}>
            {!active.rows ? (
              <>
                <h5 className="mb-2.5 text-small font-semibold uppercase tracking-[.08em] text-l-ink3">Background</h5>
                <div className="flex flex-wrap gap-2.5">
                  {BGS.map((c) => (
                    <button key={c} type="button" aria-label={`background ${c}`} onClick={() => setDraft((d) => ({ ...d, bg: c }))} className={`h-10 w-10 rounded-full ${draft.bg === c ? "shadow-[0_0_0_3px_var(--l-card),0_0_0_5px_var(--l-ink)]" : "shadow-[inset_0_0_0_1px_rgba(0,0,0,.06)]"}`} style={{ background: `#${c}` }} />
                  ))}
                </div>
                {draft.style === "blobatar" && <p className="mt-4 text-small text-l-ink3">Blobatar is the animated blob. Shuffle for a new one, or pick another style for full control.</p>}
                <h5 className="mb-2.5 mt-6 text-small font-semibold uppercase tracking-[.08em] text-l-ink3">Preview in the app</h5>
                <div className="flex items-center gap-3.5">
                  {[64, 44, 30].map((sz) => (
                    <span key={sz} className="grid place-items-center overflow-hidden rounded-full" style={{ width: sz, height: sz, background: draft.bg ? `#${draft.bg}` : undefined }}>
                      <UserAvatar userId={draft.seed} name={name} avatar={draft} className="h-full w-full" />
                    </span>
                  ))}
                </div>
              </>
            ) : (
              active.rows.map((r) => (
                <div key={r.key} className="mb-4">
                  <h5 className="mb-2.5 text-small font-semibold uppercase tracking-[.08em] text-l-ink3">
                    {LABEL[r.key] ?? r.key}
                    {r.kind === "part" ? ` · ${r.values.length}` : ""}
                  </h5>
                  {r.kind === "color" ? (
                    <div className="flex flex-wrap gap-2">
                      {r.values.map((c) => (
                        <button key={c} type="button" aria-label={`${r.key} ${c}`} onClick={() => setPart(r.key, c)} className={`h-8 w-8 rounded-full ${sel[r.key] === c ? "shadow-[0_0_0_3px_var(--l-card),0_0_0_5px_var(--l-ink)]" : "shadow-[inset_0_0_0_1px_rgba(0,0,0,.08)]"}`} style={{ background: `#${c}` }} />
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-[repeat(auto-fill,minmax(68px,1fr))] gap-2">
                      {(r.optional ? [null, ...r.values] : r.values).map((v) => {
                        const need = v ? LOCK[v] : undefined;
                        const locked = need !== undefined && streak < need;
                        const on = sel[r.key] === v && !(v === null && !(r.key in sel));
                        return (
                          <button
                            key={v ?? "none"}
                            type="button"
                            aria-label={`${r.key} ${v ?? "none"}`}
                            aria-pressed={on}
                            onClick={() => !locked && setPart(r.key, v)}
                            className={`relative aspect-square overflow-hidden rounded-2xl bg-l-sub transition hover:-translate-y-0.5 ${on ? "bg-l-card shadow-[0_0_0_2px_var(--l-ink)]" : "shadow-[0_0_0_1px_var(--l-hair)]"} ${locked ? "opacity-60" : ""}`}
                          >
                            {v === null ? <span className="text-small font-semibold text-l-ink3">None</span> : <img alt="" loading="lazy" src={avatarDataUri(draft, { [r.key]: v })} className="h-full w-full" />}
                            {locked && (
                              <span className="absolute inset-x-1 bottom-1 flex items-center justify-center gap-0.5 rounded-full bg-l-ink px-1 text-[9.5px] font-bold text-l-card">
                                <Lock className="h-2.5 w-2.5" />
                                {need}-day streak
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
          <div className="flex shrink-0 items-center justify-end gap-2 border-t border-l-hair p-4">
            <span className="flex-1 text-xs text-l-ink3">{draft.style === "blobatar" ? "Animated blob avatar" : "Edits are kept per style"}</span>
            <button type="button" onClick={() => onOpenChange(false)} className="rounded-full px-4 py-2 text-body font-medium shadow-[0_0_0_1px_var(--l-hair)]">
              Cancel
            </button>
            <button type="button" onClick={save} disabled={saving} className="rounded-full bg-l-ink px-4 py-2 text-body font-medium text-l-card disabled:opacity-60">
              Save avatar
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
