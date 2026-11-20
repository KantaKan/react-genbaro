import { BookOpen, CalendarCheck, MessageCircle, Sun, User, Users, type LucideIcon } from "lucide-react";

export interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
  section: "Learning" | "Community";
  end?: boolean;
}

export const NAV: NavItem[] = [
  { label: "Today", to: "/learner", icon: Sun, section: "Learning", end: true },
  { label: "Attendance", to: "/learner/attendance", icon: CalendarCheck, section: "Learning" },
  { label: "My profile", to: "/learner/my-profile", icon: User, section: "Learning" },
  { label: "Classmates", to: "/learner/directory", icon: Users, section: "Community" },
  { label: "Talk Board", to: "/talk-board", icon: MessageCircle, section: "Community" },
];

export const TABS: NavItem[] = [
  { label: "Today", to: "/learner", icon: Sun, section: "Learning", end: true },
  { label: "Reflect", to: "/learner/reflections", icon: BookOpen, section: "Learning" },
  { label: "Attendance", to: "/learner/attendance", icon: CalendarCheck, section: "Learning" },
  { label: "Board", to: "/talk-board", icon: MessageCircle, section: "Community" },
  { label: "Me", to: "/learner/my-profile", icon: User, section: "Learning" },
];
