import { BookOpen, CalendarCheck, Gamepad2, MessageCircle, Smile, Sprout, Stamp, Sun, Trees, User, Users, type LucideIcon } from "lucide-react";

export interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
  section: "Learning" | "Community" | "Play";
  end?: boolean;
}

export const NAV: NavItem[] = [
  { label: "Today", to: "/learner", icon: Sun, section: "Learning", end: true },
  { label: "Attendance", to: "/learner/attendance", icon: CalendarCheck, section: "Learning" },
  { label: "Reflections", to: "/learner/reflections", icon: BookOpen, section: "Learning" },
  { label: "My profile", to: "/learner/my-profile", icon: User, section: "Learning" },
  { label: "Classmates", to: "/learner/directory", icon: Users, section: "Community" },
  { label: "Talk Board", to: "/learner/board", icon: MessageCircle, section: "Community" },
  { label: "Stamp Board", to: "/stamp-board", icon: Stamp, section: "Community" },
  { label: "Genmate Garden", to: "/learner/garden", icon: Sprout, section: "Play" },
  { label: "My Baro Character", to: "/character", icon: Smile, section: "Play" },
  { label: "Showcase Lawn", to: "/showcase-lawn", icon: Trees, section: "Play" },
  { label: "Startup Story", to: "/startup-story", icon: Gamepad2, section: "Play" },
];

export const TABS: NavItem[] = [
  { label: "Today", to: "/learner", icon: Sun, section: "Learning", end: true },
  { label: "Reflect", to: "/learner/reflections", icon: BookOpen, section: "Learning" },
  { label: "Attendance", to: "/learner/attendance", icon: CalendarCheck, section: "Learning" },
  { label: "Board", to: "/learner/board", icon: MessageCircle, section: "Community" },
  { label: "Me", to: "/learner/my-profile", icon: User, section: "Learning" },
];
