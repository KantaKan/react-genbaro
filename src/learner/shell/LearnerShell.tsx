import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, NavLink } from "react-router-dom";
import { LogOut, Shield } from "lucide-react";
import { useAuth } from "@/application/contexts/AuthContext";
import { useUserData } from "@/UserDataContext";
import { ModeToggle } from "@/components/mode-toggle";
import { cn } from "@/lib/utils";
import { NAV, TABS } from "./nav";
import { nicknames } from "../lib/name";
import { UserAvatar } from "@/components/user-avatar";
import { StreakPill } from "./StreakPill";

export interface PageHeader {
  title: string;
  context?: string;
  actions?: ReactNode;
}

const HeaderCtx = createContext<(h: PageHeader | null) => void>(() => {});

/** Pages call this to put their title, context line and actions in the sticky top bar. */
export function usePageHeader(h: PageHeader) {
  const set = useContext(HeaderCtx);
  const { title, context, actions } = h;
  useEffect(() => {
    set({ title, context, actions });
    return () => set(null);
  }, [set, title, context, actions]);
}

const linkCls = ({ isActive }: { isActive: boolean }) =>
  cn(
    "flex items-center gap-2.5 rounded-[10px] px-2.5 py-2 text-sm font-medium transition-colors duration-300",
    isActive ? "bg-l-sub text-l-ink" : "text-l-ink2 hover:bg-l-sub hover:text-l-ink"
  );

export function LearnerShell({ children }: { children: ReactNode }) {
  const [header, setHeader] = useState<PageHeader | null>(null);
  const { userData } = useUserData();
  const { logout, userRole } = useAuth();
  const nick = useMemo(() => nicknames(userData?.zoom_name, userData?.first_name ?? ""), [userData]);
  const sections = ["Learning", "Community", "Play"] as const;

  return (
    <HeaderCtx.Provider value={setHeader}>
      <div className="learner flex min-h-screen">
        <aside className="sticky top-0 hidden h-screen w-[248px] shrink-0 flex-col gap-0.5 border-r border-l-hair bg-l-card px-3 py-4 lg:flex">
          <div className="flex items-center gap-2.5 px-2 pb-3.5">
            <div className="grid h-[30px] w-[30px] place-items-center rounded-[9px] bg-gradient-to-br from-zinc-900 to-zinc-600 text-sm font-bold text-white">B</div>
            <div>
              <div className="text-sm font-semibold">Baro</div>
              <div className="text-xs text-l-ink3">JSD{userData?.cohort_number ?? ""} · Learner</div>
            </div>
          </div>
          <nav aria-label="Learner" className="flex flex-col gap-0.5">
            {sections.map((sec) => (
              <div key={sec}>
                <div className="px-2.5 pb-1.5 pt-3.5 text-small font-medium text-l-ink3">{sec}</div>
                {NAV.filter((n) => n.section === sec).map((n) => (
                  <NavLink key={n.to} to={n.to} end={n.end} className={linkCls}>
                    <n.icon className="h-[18px] w-[18px]" strokeWidth={1.5} />
                    {n.label}
                  </NavLink>
                ))}
              </div>
            ))}
          </nav>
          {userRole === "admin" && (
            <Link to="/admin" className="mt-auto flex items-center gap-2.5 rounded-[10px] px-2.5 py-2 text-sm font-medium text-l-ink2 hover:bg-l-sub hover:text-l-ink">
              <Shield className="h-[18px] w-[18px]" strokeWidth={1.5} />
              Admin panel
            </Link>
          )}
          <div className={`${userRole === "admin" ? "mt-2" : "mt-auto"} flex items-center gap-2.5 rounded-xl p-2.5 shadow-[0_0_0_1px_var(--l-hair)]`}>
            <UserAvatar userId={userData?._id} name={nick.en} avatar={userData?.avatar} className="h-[34px] w-[34px] shrink-0" />
            <div className="min-w-0">
              <div className="truncate text-body font-semibold">{nick.th ? `${nick.en} · ${nick.th}` : nick.en}</div>
              <div className="text-xs text-l-ink3">
                #{userData?.jsd_number ?? "–"}
                {userData?.genmate_group ? ` · Group ${userData.genmate_group}` : ""}
              </div>
            </div>
            <button
              type="button"
              onClick={logout}
              aria-label="Log out"
              title="Log out"
              className="ml-auto grid h-8 w-8 shrink-0 place-items-center rounded-lg text-l-ink3 hover:bg-l-sub hover:text-l-ink"
            >
              <LogOut className="h-4 w-4" strokeWidth={1.5} />
            </button>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <header
            role="banner"
            className="sticky top-0 z-10 flex h-16 items-center gap-3 border-b border-l-hair bg-[color-mix(in_srgb,var(--l-bg)_82%,transparent)] px-4 backdrop-blur-md md:px-7"
          >
            {header && (
              <div className="flex min-w-0 items-baseline gap-2.5">
                <span className="whitespace-nowrap text-heading font-semibold tracking-tight">{header.title}</span>
                {header.context && <span className="truncate text-body text-l-ink3">{header.context}</span>}
              </div>
            )}
            <div className="ml-auto flex items-center gap-2">
              {header?.actions}
              <StreakPill />
              <ModeToggle />
            </div>
          </header>
          <main className="mx-auto max-w-[1240px] px-4 pb-32 pt-6 md:px-7 lg:pb-10">{children}</main>
        </div>

        <nav
          aria-label="Mobile"
          className="fixed inset-x-3 bottom-3 z-20 flex justify-around rounded-[20px] bg-[color-mix(in_srgb,var(--l-card)_88%,transparent)] p-1.5 shadow-[var(--l-shadow)] backdrop-blur-md lg:hidden"
        >
          {TABS.map((t) => (
            <NavLink
              key={t.label}
              to={t.to}
              end={t.end}
              className={({ isActive }) =>
                cn("flex flex-col items-center gap-0.5 rounded-xl px-2.5 py-1.5 text-micro", isActive ? "bg-l-sub text-l-ink" : "text-l-ink3")
              }
            >
              <t.icon className="h-[18px] w-[18px]" strokeWidth={1.5} />
              {t.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </HeaderCtx.Provider>
  );
}
