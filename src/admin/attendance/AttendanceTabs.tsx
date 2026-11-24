import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";

const TABS: [string, string][] = [
  ["Week", "/admin/attendance/register"],
  ["Month", "/admin/attendance/month"],
  ["Log", "/admin/activity"],
];

/** Week register, month calendar and the change log, as one place. */
export function AttendanceTabs() {
  return (
    <nav aria-label="Attendance views" className="inline-flex rounded-[10px] bg-l-card p-[3px] shadow-[0_0_0_1px_var(--l-hair)]">
      {TABS.map(([label, to]) => (
        <NavLink key={to} to={to} className={({ isActive }) => cn("rounded-[7px] px-3 py-1 text-small font-semibold", isActive ? "bg-l-ink text-l-card" : "text-l-ink2 hover:text-l-ink")}>
          {label}
        </NavLink>
      ))}
    </nav>
  );
}
