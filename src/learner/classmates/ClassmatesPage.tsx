import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "react-query";
import { LayoutGrid, List, Pencil, Search } from "lucide-react";
import { useUserData } from "@/UserDataContext";
import { usePeople } from "../lib/usePeople";
import { UserAvatar } from "@/components/user-avatar";
import { usePageHeader } from "../shell/LearnerShell";
import { nicknames } from "../lib/name";
import { filterPeople, type Person, type PeopleQuery } from "../lib/people";
import { ClassmatePanel } from "./ClassmatePanel";
import { AvatarEditor } from "../avatar/AvatarEditor";
import { learnerApi } from "../api";
import { useChampion } from "../cup/useChampion";
import { Bone, LoadingHint } from "@/components/LoadingSkeleton";

const GROUPS = ["All", "A", "B", "C", "D", "E", "F", "G", "H", "I", "J"];
const SORTS: { id: NonNullable<PeopleQuery["sort"]>; label: string }[] = [
  { id: "az", label: "A–Z" },
  { id: "no", label: "Number" },
  { id: "group", label: "Group" },
];

export function ClassmatesPage() {
  const qc = useQueryClient();
  const { userData, refetchUserData } = useUserData();
  const { list: data, isLoading } = usePeople();
  const { isChampion } = useChampion();
  const summary = useQuery(["my-summary"], learnerApi.getSummary, { staleTime: 60_000 });
  const people = data.filter((p) => p.role !== "admin");
  const [q, setQ] = useState("");
  const [group, setGroup] = useState("All");
  const [sort, setSort] = useState<NonNullable<PeopleQuery["sort"]>>("az");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [open, setOpen] = useState<Person | null>(null);
  const [editing, setEditing] = useState(false);
  const search = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (e.key === "/" && !/INPUT|TEXTAREA/.test(t.tagName)) {
        e.preventDefault();
        search.current?.focus();
      }
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, []);

  const actions = useMemo(
    () => (
      <label className="hidden items-center gap-2 rounded-xl bg-l-card px-3 py-2 text-l-ink3 shadow-[0_0_0_1px_var(--l-hair)] focus-within:shadow-[0_0_0_1.5px_var(--l-ink)] sm:flex">
        <Search className="h-4 w-4" strokeWidth={1.5} />
        <input ref={search} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name, nickname or skill…" aria-label="Search classmates" className="w-48 bg-transparent text-sm text-l-ink outline-none" />
        <kbd className="rounded px-1 text-micro shadow-[0_0_0_1px_var(--l-hair)]">/</kbd>
      </label>
    ),
    [q]
  );
  usePageHeader({ title: "Classmates", context: `${people.length} learners in JSD${userData?.cohort_number ?? ""}`, actions });

  const me = people.find((p) => p._id === userData?._id);
  const myGroup = people.filter((p) => p.genmate_group && p.genmate_group === userData?.genmate_group);
  const others = filterPeople(
    people.filter((p) => p._id !== userData?._id),
    { q, group, sort }
  );

  return (
    <div>
      {myGroup.length > 0 && (
        <section aria-label="Your GenMate group" className={`l-card p-[22px] ${isChampion(userData?.genmate_group) ? "bg-[radial-gradient(70%_140%_at_0%_0%,rgba(253,230,138,.55),transparent_60%),radial-gradient(60%_140%_at_100%_100%,rgba(245,158,11,.22),transparent_60%)]" : "bg-[radial-gradient(70%_140%_at_0%_0%,rgba(129,140,248,.18),transparent_60%),radial-gradient(60%_140%_at_100%_100%,rgba(244,114,182,.14),transparent_60%)]"}`}>
          <b className="text-heading font-semibold tracking-tight">Your GenMate group · {userData?.genmate_group}</b>
          {isChampion(userData?.genmate_group) && <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-micro font-semibold text-amber-800 dark:bg-amber-500/20 dark:text-amber-300">Cup champions this week</span>}
          <p className="mt-0.5 text-small text-l-ink2">The people you'll see most. Say hi, pair up, cheer each other on.</p>
          <div className="mt-4 flex gap-3 overflow-x-auto pb-1 [scrollbar-color:var(--l-hair)_transparent] [scrollbar-width:thin]">
            {myGroup.map((p) => {
              const n = nicknames(p.zoom_name, p.first_name);
              const self = p._id === userData?._id;
              return (
                <button
                  key={p._id}
                  type="button"
                  aria-label={self ? "Customize your avatar" : `Open ${n.th || n.en}`}
                  onClick={() => (self ? setEditing(true) : setOpen(p))}
                  className="relative w-[140px] shrink-0 rounded-[18px] bg-l-card/80 px-2.5 pb-3 pt-4 text-center shadow-[0_0_0_1px_var(--l-hair)] transition duration-500 hover:-translate-y-1"
                >
                  <UserAvatar userId={p._id} name={n.en} avatar={p.avatar} champion={isChampion(p.genmate_group)} className="mx-auto h-16 w-16" />
                  {self && (
                    <span className="absolute left-[calc(50%+14px)] top-14 grid h-6 w-6 place-items-center rounded-full bg-l-ink text-l-card shadow-[0_0_0_3px_var(--l-card)]">
                      <Pencil className="h-3 w-3" />
                    </span>
                  )}
                  <b className="mt-2.5 block font-semibold">{n.th || n.en}</b>
                  <small className="block text-xs text-l-ink3">
                    {n.en} · #{p.jsd_number ?? "–"}
                  </small>
                  {self ? <span className="mt-1.5 inline-block rounded-full bg-indigo-50 px-2 text-micro font-semibold text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300">You · edit</span> : <small className="mt-1.5 block text-xs text-l-ink2">{p.skills?.[0] ?? ""}</small>}
                </button>
              );
            })}
          </div>
        </section>
      )}

      <div className="mb-4 mt-7 flex flex-wrap items-center gap-2.5">
        <h2 className="mr-1.5 text-heading font-semibold tracking-tight">Everyone</h2>
        <label className="flex flex-1 items-center gap-2 rounded-xl bg-l-card px-3 py-2 text-l-ink3 shadow-[0_0_0_1px_var(--l-hair)] sm:hidden">
          <Search className="h-4 w-4" strokeWidth={1.5} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search" aria-label="Search classmates (mobile)" className="w-full bg-transparent text-sm text-l-ink outline-none" />
        </label>
        <div className="flex gap-1 overflow-x-auto rounded-xl bg-l-card p-[3px] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden shadow-[0_0_0_1px_var(--l-hair)]">
          {GROUPS.map((g) => (
            <button key={g} type="button" aria-pressed={group === g} onClick={() => setGroup(g)} className={`rounded-[9px] px-2.5 py-1 text-small font-semibold ${group === g ? "bg-l-ink text-l-card" : "text-l-ink2"}`}>
              {g}
            </button>
          ))}
        </div>
        <span className="flex-1" />
        <button type="button" onClick={() => setSort(SORTS[(SORTS.findIndex((s) => s.id === sort) + 1) % SORTS.length].id)} className="text-small text-l-ink2">
          Sort <b className="font-semibold text-l-ink">{SORTS.find((s) => s.id === sort)!.label}</b>
        </button>
        <div className="flex rounded-xl bg-l-card p-[3px] shadow-[0_0_0_1px_var(--l-hair)]">
          {(["grid", "list"] as const).map((v) => (
            <button key={v} type="button" aria-label={`${v} view`} aria-pressed={view === v} onClick={() => setView(v)} className={`grid h-7 w-8 place-items-center rounded-[9px] ${view === v ? "bg-l-sub text-l-ink" : "text-l-ink3"}`}>
              {v === "grid" ? <LayoutGrid className="h-4 w-4" strokeWidth={1.5} /> : <List className="h-4 w-4" strokeWidth={1.5} />}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div aria-hidden className="grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-3.5">
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} className="l-card flex flex-col gap-3 p-4">
              <span className="flex items-center gap-3">
                <Bone className="h-[52px] w-[52px] shrink-0 rounded-full" />
                <span className="grid flex-1 gap-1.5">
                  <Bone className="h-5 w-28" />
                  <Bone className="h-3.5 w-20" />
                </span>
                <Bone className="h-5 w-6 self-start rounded-lg" />
              </span>
              <Bone className="h-[39px] w-full" />
              <span className="flex gap-1.5">
                <Bone className="h-6 w-14 rounded-full" />
                <Bone className="h-6 w-16 rounded-full" />
              </span>
            </div>
          ))}
          <LoadingHint label="Loading classmates" />
        </div>
      ) : others.length === 0 ? (
        <div className="l-card p-12 text-center text-l-ink3">
          No one matches “{q}”. Try a skill like <b>React</b> or <b>Figma</b>.
        </div>
      ) : view === "grid" ? (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-3.5">
          {others.map((p) => {
            const n = nicknames(p.zoom_name, p.first_name);
            return (
              <button key={p._id} type="button" aria-label={`Open ${n.th || n.en}`} onClick={() => setOpen(p)} className="l-card flex flex-col gap-3 p-4 text-left transition duration-500 hover:-translate-y-[3px]">
                <span className="flex items-center gap-3">
                  <UserAvatar userId={p._id} name={n.en} avatar={p.avatar} champion={isChampion(p.genmate_group)} className="h-[52px] w-[52px]" />
                  <span className="min-w-0">
                    <b className="block text-title font-semibold">{n.th || n.en}</b>
                    <small className="text-small text-l-ink3">
                      {n.en} · #{p.jsd_number ?? "–"}
                    </small>
                  </span>
                  <span className="ml-auto self-start rounded-lg bg-l-sub px-1.5 text-small font-bold text-l-ink2">{p.genmate_group ?? "–"}</span>
                </span>
                <span className="line-clamp-2 min-h-[39px] text-body leading-normal text-l-ink2">{p.bio || "No bio yet."}</span>
                <span className="mt-auto flex flex-wrap items-center gap-1.5">
                  {(p.skills ?? []).slice(0, 3).map((s) => (
                    <span key={s} className="rounded-lg bg-l-sub px-2 py-0.5 text-small font-medium text-l-ink2 shadow-[0_0_0_1px_var(--l-hair)]">
                      {s}
                    </span>
                  ))}
                  {!!p.badges?.length && <span className="ml-auto text-small text-l-ink3">{p.badges.length} badges</span>}
                </span>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="l-card overflow-hidden">
          {others.map((p) => {
            const n = nicknames(p.zoom_name, p.first_name);
            return (
              <button key={p._id} type="button" aria-label={`Open ${n.th || n.en}`} onClick={() => setOpen(p)} className="grid w-full grid-cols-[40px_1fr_50px] items-center gap-3.5 border-t border-l-hair px-4 py-3 text-left first:border-t-0 hover:bg-l-sub sm:grid-cols-[40px_1.3fr_50px_2fr]">
                <UserAvatar userId={p._id} name={n.en} avatar={p.avatar} champion={isChampion(p.genmate_group)} className="h-10 w-10" />
                <span>
                  <b className="font-semibold">{n.th || n.en}</b> <span className="text-small text-l-ink3">{n.en} · #{p.jsd_number ?? "–"}</span>
                </span>
                <span className="justify-self-start rounded-lg bg-l-sub px-1.5 text-small font-bold text-l-ink2">{p.genmate_group ?? "–"}</span>
                <span className="hidden truncate text-body text-l-ink2 sm:block">{p.bio}</span>
              </button>
            );
          })}
        </div>
      )}

      {open && <ClassmatePanel person={open} isMe={open._id === userData?._id} onClose={() => setOpen(null)} onEditAvatar={() => (setOpen(null), setEditing(true))} />}
      {editing && me && (
        <AvatarEditor
          open
          onOpenChange={setEditing}
          current={me.avatar}
          seed={me._id}
          name={nicknames(me.zoom_name, me.first_name).en}
          streak={summary.data?.streak ?? 0}
          onSaved={() => {
            qc.invalidateQueries(["cohort-people"]);
            refetchUserData?.();
          }}
        />
      )}
    </div>
  );
}
