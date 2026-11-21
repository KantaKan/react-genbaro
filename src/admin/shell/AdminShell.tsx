import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { useQuery } from "react-query";
import { Toaster } from "sonner";
import { LogOut, Search, X } from "lucide-react";
import { useAuth } from "@/application/contexts/AuthContext";
import { useUserData } from "@/UserDataContext";
import { ModeToggle } from "@/components/mode-toggle";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { ADMIN_NAV, SECTIONS } from "./nav";
import { CommandPalette } from "./CommandPalette";
import { useCohort } from "./useCohort";
import { adminApi } from "../api";

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
  const [cohort, setCohort] = useCohort();
  const { userData } = useUserData();
  const { logout } = useAuth();
  const pending = useQuery(["admin-leaves", cohort, "pending"], () => adminApi.leaves({ cohort, status: "pending" }), { staleTime: 60_000 });

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

  const ctx = useMemo(() => ({ setHeader, panel, setPanel }), [panel]);
  const pendingN = pending.data?.length ?? 0;

  return (
    <Ctx.Provider value={ctx}>
      <div className="learner flex min-h-screen bg-l-bg text-l-ink">
        <aside className="sticky top-0 hidden h-screen w-[236px] shrink-0 flex-col gap-px overflow-y-auto px-2.5 py-3.5 lg:flex">
          <div className="flex items-center gap-2.5 px-2 pb-3">
            <div className="grid h-[30px] w-[30px] place-items-center rounded-[9px] bg-l-ink text-[13px] font-bold text-l-card">B</div>
            <div>
              <div className="text-[13.5px] font-semibold">Baro Admin</div>
              <div className="text-[11.5px] text-l-ink3">{userData?.first_name ?? "Admin"}</div>
            </div>
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <button type="button" className="mx-0.5 mb-2 flex items-center gap-2 rounded-[11px] bg-l-card px-2.5 py-2 text-[13px] font-semibold shadow-[0_0_0_1px_var(--l-hair)]">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                JSD{cohort}
                <span className="ml-auto text-[11.5px] font-medium text-l-ink3">Switch</span>
              </button>
            </PopoverTrigger>
            <PopoverContent className="learner w-56 rounded-xl border-0 bg-l-card p-3 text-l-ink shadow-[0_0_0_1px_var(--l-hair),0_12px_30px_-16px_rgba(0,0,0,.35)]">
              <label className="text-xs font-semibold text-l-ink2">
                Cohort number
                <input
                  type="number"
                  min={1}
                  defaultValue={cohort}
                  onKeyDown={(e) => e.key === "Enter" && Number(e.currentTarget.value) > 0 && setCohort(Number(e.currentTarget.value))}
                  onBlur={(e) => Number(e.currentTarget.value) > 0 && setCohort(Number(e.currentTarget.value))}
                  className="mt-1.5 w-full rounded-lg bg-l-sub px-2.5 py-1.5 text-sm text-l-ink shadow-[0_0_0_1px_var(--l-hair)] outline-none"
                />
              </label>
            </PopoverContent>
          </Popover>
          <nav aria-label="Admin" className="flex flex-col gap-px">
            {SECTIONS.map((sec) => (
              <div key={sec}>
                <div className="px-2.5 pb-1 pt-3 text-[11px] font-medium text-l-ink3">{sec}</div>
                {ADMIN_NAV.filter((n) => n.section === sec).map((n) => (
                  <NavLink key={n.to} to={n.to} end={n.end} className={linkCls}>
                    <n.icon className="h-4 w-4" strokeWidth={1.5} />
                    {n.label}
                    {n.badge === "leave" && pendingN > 0 && <span className="ml-auto min-w-[18px] rounded-full bg-red-600 px-1.5 text-center text-[11px] font-bold text-white">{pendingN}</span>}
                  </NavLink>
                ))}
              </div>
            ))}
          </nav>
          <button type="button" onClick={logout} className="mt-auto flex items-center gap-2.5 rounded-[9px] px-2.5 py-2 text-[13px] font-medium text-l-ink2 hover:text-l-ink">
            <LogOut className="h-4 w-4" strokeWidth={1.5} />
            Log out
          </button>
        </aside>

        <div className="min-w-0 flex-1 py-2.5 pr-2.5 max-lg:p-0">
          <div className="relative min-h-[calc(100vh-20px)] overflow-clip rounded-[20px] bg-l-card shadow-[0_0_0_1px_var(--l-hair),0_10px_28px_-18px_rgba(24,24,27,.14)] max-lg:rounded-none">
            <header role="banner" className="sticky top-0 z-10 flex h-[60px] items-center gap-3 border-b border-l-hair bg-[color-mix(in_srgb,var(--l-card)_88%,transparent)] px-6 backdrop-blur-md">
              {header && (
                <div className="flex min-w-0 items-baseline gap-2.5">
                  <span className="whitespace-nowrap text-base font-semibold tracking-tight">{header.title}</span>
                  {header.context && <span className="truncate text-[13px] text-l-ink3">{header.context}</span>}
                </div>
              )}
              <div className="ml-auto flex items-center gap-2">
                {header?.actions}
                <button
                  type="button"
                  onClick={() => setPalette(true)}
                  className="hidden min-w-[260px] items-center gap-2 rounded-[10px] bg-l-sub px-3 py-[7px] text-[13px] text-l-ink3 shadow-[0_0_0_1px_var(--l-hair)] md:flex"
                >
                  <Search className="h-4 w-4" strokeWidth={1.5} />
                  Find a learner or run an action
                  <kbd className="ml-auto rounded-md bg-l-card px-1.5 text-[11px] text-l-ink2 shadow-[0_0_0_1px_var(--l-hair)]">⌘K</kbd>
                </button>
                <ModeToggle />
              </div>
            </header>
            <div className="relative">
              <main className="min-w-0 px-6 pb-12 pt-5 transition-[margin] duration-[550ms] ease-[cubic-bezier(.32,.72,0,1)]" style={{ marginRight: panel ? 392 : 0 }}>
                {children}
              </main>
              <aside
                aria-label="Details"
                aria-hidden={!panel}
                className={cn(
                  "fixed bottom-2.5 right-2.5 top-[70px] z-20 w-[392px] overflow-y-auto rounded-br-[20px] border-l border-l-hair bg-l-card px-[22px] py-5 transition-transform duration-[550ms] ease-[cubic-bezier(.32,.72,0,1)]",
                  panel ? "translate-x-0 shadow-[-24px_0_48px_-32px_rgba(0,0,0,.35)]" : "pointer-events-none translate-x-[calc(100%+20px)]"
                )}
              >
                {panel && (
                  <>
                    <button type="button" aria-label="Close panel" onClick={() => setPanel(null)} className="absolute right-3 top-3 z-10 grid h-8 w-8 place-items-center rounded-lg text-l-ink3 hover:bg-l-sub hover:text-l-ink">
                      <X className="h-4 w-4" />
                    </button>
                    {panel.content}
                  </>
                )}
              </aside>
            </div>
          </div>
        </div>
      </div>
      <CommandPalette open={palette} onOpenChange={setPalette} cohort={cohort} />
      <Toaster position="bottom-center" />
    </Ctx.Provider>
  );
}
