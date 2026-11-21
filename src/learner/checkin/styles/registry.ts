import type { ComponentType } from "react";
import type { CheckInControlProps } from "../types";

export type StyleId =
  | "slide" | "hold" | "ring" | "run" | "coffee" | "red" | "cat" | "bubble"
  | "scratch" | "alarm" | "slot" | "gacha" | "rocket" | "gold" | "arcade" | "dj";

type Loader = () => Promise<{ default: ComponentType<CheckInControlProps> }>;

export interface StyleMeta {
  id: StyleId;
  name: string;
  sub: string;
  group: "clean" | "fun" | "unlock";
  /** streak days needed, or "perfect_week"; undefined = free */
  need?: number | "perfect_week";
  load: Loader;
}

const slide: Loader = () => import("../SlideControl").then((m) => ({ default: m.SlideControl }));

export const STYLES: StyleMeta[] = [
  { id: "slide", name: "Slide", sub: "Slide to unlock", group: "clean", load: slide },
  { id: "hold", name: "Hold", sub: "Press and hold", group: "clean", load: () => import("./HoldControl") },
  { id: "ring", name: "Ring", sub: "Countdown timer", group: "clean", load: () => import("./RingControl") },
  { id: "run", name: "Runaway", sub: "Catch it if you can", group: "fun", load: () => import("./RunawayControl") },
  { id: "coffee", name: "Coffee", sub: "Hold to brew", group: "fun", load: () => import("./CoffeeControl") },
  { id: "red", name: "Big red button", sub: "Open the cover first", group: "fun", load: () => import("./RedButtonControl") },
  { id: "cat", name: "Sleepy cat", sub: "Wake up, high five", group: "fun", load: () => import("./SleepyCatControl") },
  { id: "bubble", name: "Bubble wrap", sub: "Pop them all", group: "fun", load: () => import("./BubbleWrapControl") },
  { id: "scratch", name: "Scratch card", sub: "Scratch to reveal", group: "fun", load: () => import("./ScratchCardControl") },
  { id: "alarm", name: "Alarm clock", sub: "Smash snooze", group: "fun", load: () => import("./AlarmClockControl") },
  { id: "slot", name: "Lucky slot", sub: "Pull the lever", group: "fun", load: () => import("./LuckySlotControl") },
  { id: "gacha", name: "Gacha", sub: "Turn the knob", group: "fun", load: () => import("./GachaControl") },
  { id: "rocket", name: "Rocket launch", sub: "15-day streak", group: "unlock", need: 15, load: () => import("./RocketControl") },
  { id: "gold", name: "Gold slide", sub: "Perfect week", group: "unlock", need: "perfect_week", load: () => import("./GoldSlideControl") },
  { id: "arcade", name: "Arcade", sub: "20-day streak", group: "unlock", need: 20, load: () => import("./ArcadeControl") },
  { id: "dj", name: "DJ deck", sub: "30-day streak", group: "unlock", need: 30, load: () => import("./DjDeckControl") },
];

export const styleById = (id: string): StyleMeta | undefined => STYLES.find((s) => s.id === id);
