import { HeartHandshake, CalendarOff, Download, SlidersHorizontal, UsersRound, BookOpen, CalendarCheck, CalendarDays, ClipboardCheck, Gamepad2, History, Megaphone, MessageCircle, Smile, Sprout, Sun, Trophy, Users, Wrench, type LucideIcon } from "lucide-react";

export type AdminSection = "Daily" | "Learners" | "Engage" | "Play" | "Cohort";
export interface AdminNavItem {
  label: string;
  to: string;
  icon: LucideIcon;
  section: AdminSection;
  end?: boolean;
  badge?: "leave" | "support";
}

export const SECTIONS: AdminSection[] = ["Daily", "Learners", "Engage", "Play", "Cohort"];

export const ADMIN_NAV: AdminNavItem[] = [
  { label: "Today", to: "/admin", icon: Sun, section: "Daily", end: true },
  { label: "Attendance", to: "/admin/attendance", icon: CalendarCheck, section: "Daily" },
  { label: "Leave requests", to: "/admin/leave", icon: ClipboardCheck, section: "Daily", badge: "leave" },
  { label: "Reflections", to: "/admin/reflections", icon: BookOpen, section: "Daily" },
  { label: "All learners", to: "/admin/learners", icon: Users, section: "Learners" },
  { label: "Needs support", to: "/admin/support", icon: HeartHandshake, section: "Learners", badge: "support" },
  { label: "GenMate groups", to: "/admin/groups", icon: UsersRound, section: "Learners" },
  { label: "GenMate Cup", to: "/admin/cup", icon: Trophy, section: "Engage" },
  { label: "Announcements", to: "/admin/announce", icon: Megaphone, section: "Engage" },
  { label: "Talk Board", to: "/talk-board", icon: MessageCircle, section: "Engage" },
  { label: "Garden & Cohort field", to: "/admin/garden", icon: Sprout, section: "Play" },
  { label: "Baro Characters", to: "/character", icon: Smile, section: "Play" },
  { label: "Showcase & Startup Story", to: "/showcase-lawn", icon: Gamepad2, section: "Play" },
  { label: "Tools · spin wheel", to: "/tools", icon: Wrench, section: "Play" },
  { label: "Check-in rules", to: "/admin/rules", icon: SlidersHorizontal, section: "Cohort" },
  { label: "Holidays", to: "/admin/holidays", icon: CalendarOff, section: "Cohort" },
  { label: "Exports", to: "/admin/exports", icon: Download, section: "Cohort" },
  { label: "Weekly summary", to: "/admin/weekly-summary", icon: CalendarDays, section: "Cohort" },
  { label: "Activity log", to: "/admin/activity", icon: History, section: "Cohort" },
];
