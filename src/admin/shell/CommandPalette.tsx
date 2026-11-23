import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "react-query";
import { Search } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { nicknames } from "@/learner/lib/name";
import { ADMIN_NAV } from "./nav";
import type { TodayView } from "../types";

type Item = { id: string; label: string; sub: string; go: string };

export function CommandPalette({ open, onOpenChange, cohort }: { open: boolean; onOpenChange: (o: boolean) => void; cohort: number }) {
  const [q, setQ] = useState("");
  const [i, setI] = useState(0);
  const nav = useNavigate();
  const qc = useQueryClient();
  useEffect(() => {
    if (open) {
      setQ("");
      setI(0);
    }
  }, [open]);
  const items = useMemo<Item[]>(() => {
    const pages = ADMIN_NAV.map((n) => ({ id: n.to, label: n.label, sub: "Page", go: n.to }));
    const today = qc.getQueryData<TodayView>(["admin-today", cohort]);
    const people = (today?.learners ?? []).map((l) => {
      const n = nicknames(l.zoom_name, l.first_name);
      return { id: l.id, label: n.th ? `${n.th} · ${n.en}` : n.en, sub: `#${l.jsd_number} · Group ${l.genmate_group} · ${l.first_name}`, go: `/admin?learner=${l.id}` };
    });
    const needle = q.trim().toLowerCase();
    const all = [...pages, ...people];
    return needle ? all.filter((x) => `${x.label} ${x.sub}`.toLowerCase().includes(needle)).slice(0, 12) : pages;
  }, [q, qc, cohort]);
  const pick = (x?: Item) => {
    if (!x) return;
    onOpenChange(false);
    nav(x.go);
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="learner top-[18%] max-w-[560px] translate-y-0 gap-0 overflow-hidden rounded-[18px] border-0 bg-l-card p-0 text-l-ink [&>button]:hidden">
        <DialogTitle className="sr-only">Command palette</DialogTitle>
        <label className="flex items-center gap-2.5 border-b border-l-hair px-4 py-3">
          <Search className="h-4 w-4 text-l-ink3" strokeWidth={1.5} />
          <input
            autoFocus
            aria-label="Search"
            value={q}
            onChange={(e) => (setQ(e.target.value), setI(0))}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setI((v) => Math.min(items.length - 1, v + 1));
              }
              if (e.key === "ArrowUp") {
                e.preventDefault();
                setI((v) => Math.max(0, v - 1));
              }
              if (e.key === "Enter") pick(items[i]);
            }}
            placeholder="Find a learner or a page…"
            className="flex-1 bg-transparent text-[15px] outline-none placeholder:text-l-ink3"
          />
        </label>
        <ul role="listbox" aria-label="Results" className="max-h-[360px] overflow-y-auto p-1.5">
          {items.length === 0 && <li className="px-3 py-6 text-center text-[13px] text-l-ink3">Nothing found</li>}
          {items.map((x, k) => (
            <li
              key={x.id}
              role="option"
              aria-selected={k === i}
              onMouseEnter={() => setI(k)}
              onClick={() => pick(x)}
              className={`flex cursor-pointer items-center justify-between gap-3 rounded-[10px] px-3 py-2 text-[13.5px] ${k === i ? "bg-l-sub" : ""}`}
            >
              <span className="font-medium">{x.label}</span>
              <span className="truncate text-xs text-l-ink3">{x.sub}</span>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
