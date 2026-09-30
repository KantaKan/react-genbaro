import type { StartupDev, StartupRun } from "@/application/services/startupStoryService";

const sprites: Record<string, string> = {
  hustler: "🧑‍💻", designer: "🧑‍🎨", wizard: "🧙", grad: "🎓", faang: "🕶️", legend: "🦸",
  "Frontend Dev": "👩‍💻", "Backend Dev": "👨‍💻", Designer: "🧑‍🎨", Debugger: "🕵️", "Fullstack Dev": "🧑‍🔧", Intern: "🧒",
};

export const spriteFor = (dev: StartupDev) => sprites[dev.sprite] ?? sprites[dev.title] ?? "🧑‍💻";

export const traits: Record<string, { label: string; desc: string }> = {
  night_owl: { label: "Night Owl 🦉", desc: "Builds faster, ships more bugs" },
  tabs_zealot: { label: "Tabs Zealot ⇥", desc: "Great at debugging, worse at design" },
  tenx_dev: { label: "10x Dev ⚡", desc: "Better at everything, double salary" },
  meeting_lover: { label: "Meeting Lover 📅", desc: "Slower, but investors love it" },
  so_surfer: { label: "Stack Overflow Surfer 🏄", desc: "Strong backend, copies a few bugs" },
  pixel_perfectionist: { label: "Pixel Perfectionist 🎯", desc: "Beautiful design, takes longer" },
};

export const bosses: Record<string, { name: string; twist: string }> = {
  "demo-day": { name: "Demo Day 🎤", twist: "The whole room is watching. Just impress the reviewers." },
  "changing-requirements": { name: "The Client Who Changes Requirements 🌀", twist: "The theme might swap right before you ship!" },
  "outage-3am": { name: "3AM Production Outage 🚨", twist: "Debug skill matters most tonight. เอากาแฟมา!" },
  "ipo-pitch": { name: "IPO Pitch 🔔", twist: "The final boss. Investors count double." },
};

export const reviewerIcons: Record<string, string> = { "Tech Lead": "🧔", Users: "🙋", Investor: "💼", "Dev Community": "🌐" };

export const bossThreshold = (act: number) => (act >= 3 ? 32 : act === 2 ? 26 : 20);

export function upcomingBoss(run: StartupRun): string | null {
  if (run.project_index % 3 !== 2) return null;
  if (run.act >= 3) return "ipo-pitch";
  return run.boss_order?.[run.act - 1] ?? "demo-day";
}

export const teamCap = (act: number) => (act >= 3 ? 6 : act === 2 ? 4 : 2);

export const baht = (n: number) => `฿${n.toLocaleString()}`;

export const comboKey = (type: string, theme: string) => `${type}|${theme}`;

export const ui = {
  cardBase: "rounded-[22px] border-[4px] border-[#292542] text-[#292542] shadow-[6px_7px_0_#292542]",
  card: "rounded-[22px] border-[4px] border-[#292542] bg-[#fffaf0] text-[#292542] shadow-[6px_7px_0_#292542]",
  button: "rounded-full border-[3px] border-[#292542] px-5 py-3 text-sm font-black text-[#292542] shadow-[3px_4px_0_#292542] transition active:translate-y-[2px] active:shadow-[1px_2px_0_#292542] disabled:opacity-50",
  chipBase: "rounded-full border-2 border-[#292542] px-3 py-2 text-xs font-black",
  chip: "rounded-full border-2 border-[#292542] px-3 py-2 text-xs font-black text-[#292542]",
};

export const rarityStyle: Record<string, string> = {
  common: "bg-white",
  rare: "bg-[#bfe3f7]",
  legendary: "bg-[#fbe39a]",
  cursed: "bg-[#cab2f1]",
};
