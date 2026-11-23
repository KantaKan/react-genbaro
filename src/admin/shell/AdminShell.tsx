import { Fragment, createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { useQuery } from "react-query";
import { LogOut, Menu, Search, X } from "lucide-react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { useAuth } from "@/application/contexts/AuthContext";
import { useUserData } from "@/UserDataContext";
import { ModeToggle } from "@/components/mode-toggle";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { ADMIN_NAV, SECTIONS } from "./nav";
import { useStaff } from "../team/useStaff";
import { ROLE_LABEL } from "../team/perm";
import type { CohortInfo } from "../types";
import { CommandPalette } from "./CommandPalette";
import { NewCohortWizard } from "../cohort/NewCohortWizard";
import { useCohort } from "./useCohort";
import { PageErrorBoundary } from "@/components/PageErrorBoundary";
import { adminApi } from "../api";
import { wellbeingApi } from "../wellbeing";

const cohortLine = (c: CohortInfo) =>
  [c.learners > 0 ? `${c.learners} learners` : "", c.start_date ? `starts ${new Date(`${c.start_date}T12:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" })}` : ""].filter(Boolean).join(" · ");

export interface AdminHeader {
  title: string;
  context?: string;
  actions?: ReactNode;
}
type Panel = { key: string; content: ReactNode } | null;
interface ShellCtx {
  setHeader: (h: AdminHeader | null) => void;
  panel: Panel;
  setPanel: (p: Panel | ((p: Panel) => Panel)) => void;
}
const Ctx = createContext<ShellCtx>({ setHeader: () => {}, panel: null, setPanel: () => {} });

/** Pages put their title, context and actions in the sticky top bar. */
export function useAdminHeader(h: AdminHeader) {
  const { setHeader } = useContext(Ctx);
  const { title, context, actions } = h;
  useEffect(() => {
    setHeader({ title, context, actions });
    return () => setHeader(null);
  }, [setHeader, title, context, actions]);
}

/** Slide-in panel on the right that pushes the page over. Opening the same key again closes it. */
export function useSidePanel() {
  const { panel, setPanel } = useContext(Ctx);
  const open = useCallback((content: ReactNode, key: string) => setPanel((p) => (p?.key === key ? null : { key, content })), [setPanel]);
  const close = useCallback(() => setPanel(null), [setPanel]);
  return { open, close, openKey: panel?.key ?? null };
}

const linkCls = ({ isActive }: { isActive: boolean }) =>
  cn(
    "flex items-center gap-2.5 rounded-[9px] px-2.5 py-[7px] text-[13.5px] font-medium transition-colors duration-300",
    isActive ? "bg-l-card text-l-ink shadow-[0_0_0_1px_var(--l-hair),0_6px_16px_-12px_rgba(0,0,0,.3)]" : "text-l-ink2 hover:bg-[color-mix(in_srgb,var(--l-ink)_5%,transparent)] hover:text-l-ink"
  );

export function AdminShell({ children }: { children: ReactNode }) {
  const [header, setHeader] = useState<AdminHeader | null>(null);
  const [panel, setPanel] = useState<Panel>(null);
  const [palette, setPalette] = useState(false);
  const [menu, setMenu] = useState(false);
  const [wizard, setWizard] = useState(false);
  const [picking, setPicking] = useState(false);
  const [cohort, setCohort] = useCohort();
  const me = useStaff();
  const cohortList = useQuery(["admin-cohorts"], () => adminApi.cohorts(), { staleTime: 5 * 60_000, retry: false });
  const cohortChoices: CohortInfo[] = (() => {
    const fromServer = cohortList.data ?? (me.role === "owner" ? [] : me.cohorts.map((c) => ({ cohort: c, learners: 0, start_date: "" })));
    return fromServer.some((c) => c.cohort === cohort) || me.role !== "owner" ? fromServer : [{ cohort, learners: 0, start_date: "" }, ...fromServer];
  })();
  useEffect(() => {
    // Non-owners stay inside their cohorts.
    if (me.known && me.role !== "owner" && me.cohorts.length && !me.cohorts.includes(cohort)) setCohort(me.cohorts[0]);
  }, [me.known, me.role, me.cohorts, cohort, setCohort]);
  const { userData } = useUserData();
  const { logout } = useAuth();
  const pending = useQuery(["admin-leaves", cohort, "pending"], () => adminApi.leaves({ cohort, status: "pending" }), { staleTime: 60_000, enabled: cohort > 0 });
  const support = useQuery(["admin-support", cohort], () => wellbeingApi.support(cohort), { staleTime: 60_000, enabled: cohort > 0 });

  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPalette((p) => !p);
      } else if (e.key === "Escape" && !palette) setPanel(null);
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [palette]);

  const [goTo, setGoTo] = useState("");
  const picker = (done: () => void) => (
    <>
              <div className="max-h-[320px] overflow-y-auto">
                {cohortChoices.map((ci) => (
                  <button
                    key={ci.cohort}
                    type="button"
                    aria-label={`JSD${ci.cohort}`}
                    aria-pressed={ci.cohort === cohort}
                    onClick={() => {
                      setCohort(ci.cohort);
                      done();
                    }}
                    className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left ${ci.cohort === cohort ? "bg-l-sub" : "hover:bg-l-sub"}`}
                  >
                    <span className={`h-2 w-2 shrink-0 rounded-full ${ci.cohort === cohort ? "bg-emerald-500" : "bg-transparent"}`} />
                    <span className="min-w-0 flex-1">
                      <b className="block text-[13px] font-semibold">JSD{ci.cohort}</b>
                      {(ci.learners > 0 || ci.start_date) && <small className="block truncate text-[11.5px] text-l-ink3">{cohortLine(ci)}</small>}
                    </span>
                  </button>
                ))}
              </div>
              {me.can("create_cohort") && (
                <button
                  type="button"
                  onClick={() => {
                    done();
                    setWizard(true);
                  }}
                  className="mt-1 w-full rounded-lg border-t border-l-hair px-2.5 py-2 text-left text-[12.5px] font-semibold text-l-ink2 hover:bg-l-sub"
                >
                  + New cohort…
                </button>
              )}
      {me.role === "owner" && (
        <form
          className="mt-1 flex items-center gap-1.5 border-t border-l-hair px-1.5 pt-2"
          onSubmit={(e) => {
            e.preventDefault();
            const n = Number(goTo);
            if (n > 0) {
              setCohort(n);
              setGoTo("");
              done();
            }
          }}
        >
          <label className="flex-1 text-[11.5px] text-l-ink3">
            <span className="sr-only">Go to cohort number</span>
            <input aria-label="Go to cohort number" type="number" min={1} value={goTo} onChange={(e) => setGoTo(e.target.value)} placeholder="Go to JSD…" className="w-full rounded-lg bg-l-sub px-2 py-1 text-[12.5px] text-l-ink shadow-[0_0_0_1px_var(--l-hair)] outline-none" />
          </label>
          <button type="submit" disabled={!(Number(goTo) > 0)} className="rounded-lg bg-l-ink px-2.5 py-1 text-[12px] font-semibold text-l-card disabled:opacity-40">
            Go
          </button>
        </form>
      )}
    </>
  );

  const ctx = useMemo(() => ({ setHeader, panel, setPanel }), [panel]);
  const pendingN = pending.data?.length ?? 0;
  const navList = (
    <nav aria-label="Admin" className="flex flex-col gap-px">
      {SECTIONS.map((sec) => (
        <div key={sec}>
          <div className="px-2.5 pb-1 pt-3 text-[11px] font-medium text-l-ink3">{sec}</div>
          {ADMIN_NAV.filter((n) => n.section === sec && me.can(n.cap ?? "view")).map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end} className={linkCls} onClick={() => setMenu(false)}>
              <n.icon className="h-4 w-4" strokeWidth={1.5} />
              {n.label}
              {n.badge === "leave" && pendingN > 0 && <span className="ml-auto min-w-[18px] rounded-full bg-red-600 px-1.5 text-center text-[11px] font-bold text-white">{pendingN}</span>}
              {n.badge === "support" && (support.data?.length ?? 0) > 0 && <span className="ml-auto min-w-[18px] rounded-full bg-[color-mix(in_srgb,var(--l-ink)_8%,transparent)] px-1.5 text-center text-[11px] font-bold text-l-ink2">{support.data!.length}</span>}
            </NavLink>
          ))}
        </div>
      ))}
    </nav>
  );

  return (
    <Ctx.Provider value={ctx}>
      <div className="learner flex min-h-screen bg-l-bg text-l-ink">
        <aside className="sticky top-0 hidden h-screen w-[236px] shrink-0 flex-col gap-px overflow-y-auto px-2.5 py-3.5 lg:flex print:!hidden">
          <div className="flex items-center gap-2.5 px-2 pb-3">
            <div className="grid h-[30px] w-[30px] place-items-center rounded-[9px] bg-l-ink text-[13px] font-bold text-l-card">B</div>
            <div>
              <div className="text-[13.5px] font-semibold">Baro Admin</div>
              <div className="text-[11.5px] text-l-ink3">
                {userData?.first_name ?? "Admin"} · <span>{ROLE_LABEL[me.role]}</span>
              </div>
            </div>
          </div>
          <Popover open={picking} onOpenChange={setPicking}>
            <PopoverTrigger asChild>
              <button type="button" className="mx-0.5 mb-2 flex items-center gap-2 rounded-[11px] bg-l-card px-2.5 py-2 text-[13px] font-semibold shadow-[0_0_0_1px_var(--l-hair)]">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                JSD{cohort}
                <span className="ml-auto text-[11.5px] font-medium text-l-ink3">Switch</span>
              </button>
            </PopoverTrigger>
            <PopoverContent align="start" className="learner w-64 rounded-xl border-0 bg-l-card p-1.5 text-l-ink shadow-[0_0_0_1px_var(--l-hair),0_12px_30px_-16px_rgba(0,0,0,.35)]">
              {picker(() => setPicking(false))}
            </PopoverContent>
          </Popover>
          {navList}
          <button type="button" onClick={logout} className="mt-auto flex items-center gap-2.5 rounded-[9px] px-2.5 py-2 text-[13px] font-medium text-l-ink2 hover:text-l-ink">
            <LogOut className="h-4 w-4" strokeWidth={1.5} />
            Log out
          </button>
        </aside>

        <div className="min-w-0 flex-1 py-2.5 pr-2.5 max-lg:p-0">
          <div className="relative min-h-[calc(100vh-20px)] overflow-clip rounded-[20px] bg-l-card shadow-[0_0_0_1px_var(--l-hair),0_10px_28px_-18px_rgba(24,24,27,.14)] max-lg:rounded-none">
            <header role="banner" className="sticky top-0 z-10 flex h-[60px] items-center gap-3 border-b border-l-hair bg-[color-mix(in_srgb,var(--l-card)_88%,transparent)] px-4 backdrop-blur-md md:px-6">
              <button type="button" aria-label="Open menu" onClick={() => setMenu(true)} className="-ml-1 grid h-9 w-9 place-items-center rounded-[10px] text-l-ink2 hover:bg-l-sub lg:hidden">
                <Menu className="h-5 w-5" strokeWidth={1.5} />
              </button>
              {header && (
                <div className="flex min-w-0 items-baseline gap-2.5">
                  <span className="whitespace-nowrap text-base font-semibold tracking-tight">{header.title}</span>
                  {header.context && <span className="truncate text-[13px] text-l-ink3">{header.context}</span>}
                </div>
              )}
              {me.role === "viewer" && <span className="rounded-full bg-l-sub px-2 py-0.5 text-[11px] font-semibold text-l-ink2 shadow-[0_0_0_1px_var(--l-hair)]">Read only</span>}
              <div className="ml-auto flex items-center gap-2">
                {header?.actions}
                <button
                  type="button"
                  onClick={() => setPalette(true)}
                  className="hidden min-w-[260px] items-center gap-2 rounded-[10px] bg-l-sub px-3 py-[7px] text-[13px] text-l-ink3 shadow-[0_0_0_1px_var(--l-hair)] md:flex print:!hidden"
                >
                  <Search className="h-4 w-4" strokeWidth={1.5} />
                  Find a learner or run an action
                  <kbd className="ml-auto rounded-md bg-l-card px-1.5 text-[11px] text-l-ink2 shadow-[0_0_0_1px_var(--l-hair)]">⌘K</kbd>
                </button>
                <button type="button" aria-label="Find a learner or page" onClick={() => setPalette(true)} className="grid h-9 w-9 place-items-center rounded-[10px] text-l-ink2 hover:bg-l-sub md:hidden print:!hidden">
                  <Search className="h-[18px] w-[18px]" strokeWidth={1.5} />
                </button>
                <span className="print:hidden">
                  <ModeToggle />
                </span>
              </div>
            </header>
            <div className="relative">
              <main className="min-w-0 px-6 pb-12 pt-5 transition-[margin] print:!mr-0 print:px-0 duration-[550ms] ease-[cubic-bezier(.32,.72,0,1)]" style={{ marginRight: panel ? 392 : 0 }}>
                {cohort > 0 ? (
                  <PageErrorBoundary>{children}</PageErrorBoundary>
                ) : cohortList.isLoading || !userData ? (
                  <div className="h-40 animate-pulse rounded-2xl bg-l-sub" />
                ) : (
                  <div className="py-16 text-center">
                    <p className="text-[15px] font-semibold">No cohort to show yet</p>
                    <p className="mt-1 text-[13px] text-l-ink3">Create one, or pick a cohort from the switcher.</p>
                    <button type="button" onClick={() => setWizard(true)} className="mt-4 rounded-full bg-l-ink px-4 py-2 text-[13px] font-semibold text-l-card">
                      New cohort
                    </button>
                  </div>
                )}
              </main>
              <aside
                aria-label="Details"
                aria-hidden={!panel}
                className={cn(
                  "fixed bottom-2.5 right-2.5 top-[70px] z-20 w-[392px] overflow-y-auto rounded-br-[20px] border-l border-l-hair bg-l-card px-[22px] py-5 transition-transform duration-[550ms] ease-[cubic-bezier(.32,.72,0,1)] print:!hidden",
                  panel ? "translate-x-0 shadow-[-24px_0_48px_-32px_rgba(0,0,0,.35)]" : "pointer-events-none translate-x-[calc(100%+20px)]"
                )}
              >
                {panel && (
                  <>
                    <button type="button" aria-label="Close panel" onClick={() => setPanel(null)} className="absolute right-3 top-3 z-10 grid h-8 w-8 place-items-center rounded-lg text-l-ink3 hover:bg-l-sub hover:text-l-ink">
                      <X className="h-4 w-4" />
                    </button>
                    {/* keyed so drafts (replies, notes) never carry over to the next learner */}
                    <Fragment key={panel.key}>{panel.content}</Fragment>
                  </>
                )}
              </aside>
            </div>
          </div>
        </div>
      </div>
      <Sheet open={menu} onOpenChange={setMenu}>
        <SheetContent side="left" className="learner w-[280px] overflow-y-auto border-0 bg-l-bg p-3 text-l-ink">
          <SheetTitle className="px-2 pb-2 pt-1 text-[13.5px] font-semibold">Baro Admin · JSD{cohort}</SheetTitle>
          <div className="mb-2 rounded-xl bg-l-card p-1.5 shadow-[0_0_0_1px_var(--l-hair)]">
            <div className="px-2.5 pb-1 pt-1.5 text-[11px] font-medium text-l-ink3">Cohort</div>
            {picker(() => setMenu(false))}
          </div>
          {navList}
        </SheetContent>
      </Sheet>
      <NewCohortWizard open={wizard} onOpenChange={setWizard} onDone={setCohort} />
      <CommandPalette open={palette} onOpenChange={setPalette} cohort={cohort} />
    </Ctx.Provider>
  );
}
