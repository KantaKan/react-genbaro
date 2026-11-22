import { CalendarRange, FileBarChart, Slack, KeyRound, HeartHandshake, CalendarOff, Download, SlidersHorizontal, UsersRound, BookOpen, CalendarCheck, CalendarDays, ClipboardCheck, Gamepad2, History, Megaphone, MessageCircle, Smile, Sprout, Sun, Trophy, Users, Wrench, type LucideIcon } from "lucide-react";
import type { Capability } from "../team/perm";

export type AdminSection = "Daily" | "Learners" | "Engage" | "Play" | "Cohort";
export interface AdminNavItem {
  label: string;
  to: string;
  icon: LucideIcon;
  section: AdminSection;
  end?: boolean;
  badge?: "leave" | "support";
  /** Hidden unless the role has this (see team/perm.ts). Default: view. */
  cap?: Capability;
}

export const SECTIONS: AdminSection[] = ["Daily", "Learners", "Engage", "Play", "Cohort"];

export const ADMIN_NAV: AdminNavItem[] = [
  { label: "Today", to: "/admin", icon: Sun, section: "Daily", end: true },
  { label: "Attendance", to: "/admin/attendance", icon: CalendarCheck, section: "Daily" },
  { label: "Leave requests", to: "/admin/leave", icon: ClipboardCheck, section: "Daily", badge: "leave" },
  { label: "Reflections", to: "/admin/reflections", icon: BookOpen, section: "Daily" },
  { label: "Weekly report", to: "/admin/report", icon: FileBarChart, section: "Daily" },
  { label: "All learners", to: "/admin/learners", icon: Users, section: "Learners" },
  { label: "Needs support", to: "/admin/support", icon: HeartHandshake, section: "Learners", badge: "support" },
  { label: "GenMate groups", to: "/admin/groups", icon: UsersRound, section: "Learners", cap: "cohort_admin" },
  { label: "GenMate Cup", to: "/admin/cup", icon: Trophy, section: "Engage" },
  { label: "Announcements", to: "/admin/announce", icon: Megaphone, section: "Engage", cap: "announce" },
  { label: "Talk Board", to: "/talk-board", icon: MessageCircle, section: "Engage" },
  { label: "Garden & Cohort field", to: "/admin/garden", icon: Sprout, section: "Play" },
  { label: "Baro Characters", to: "/character", icon: Smile, section: "Play" },
  { label: "Showcase & Startup Story", to: "/showcase-lawn", icon: Gamepad2, section: "Play" },
  { label: "Tools · spin wheel", to: "/tools", icon: Wrench, section: "Play" },
  { label: "Check-in rules", to: "/admin/rules", icon: SlidersHorizontal, section: "Cohort", cap: "cohort_admin" },
  { label: "Calendar", to: "/admin/calendar", icon: CalendarRange, section: "Cohort" },
  { label: "Holidays", to: "/admin/holidays", icon: CalendarOff, section: "Cohort", cap: "cohort_admin" },
  { label: "Exports", to: "/admin/exports", icon: Download, section: "Cohort", cap: "cohort_admin" },
  { label: "Weekly summary", to: "/admin/weekly-summary", icon: CalendarDays, section: "Cohort" },
  { label: "Activity log", to: "/admin/activity", icon: History, section: "Cohort" },
  { label: "Team & roles", to: "/admin/team", icon: KeyRound, section: "Cohort", cap: "team" },
  { label: "Slack", to: "/admin/settings/slack", icon: Slack, section: "Cohort", cap: "team" },
];
