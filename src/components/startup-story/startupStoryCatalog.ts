import type { StartupDev, StartupRun } from "@/application/services/startupStoryService";

const sprites: Record<string, string> = {
  hustler: "🧑‍💻", designer: "🧑‍🎨", wizard: "🧙", grad: "🎓", faang: "🕶️", legend: "🦸", octo: "🐙",
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

const ossBosses: Record<string, { name: string; twist: string }> = {
  "demo-day": { name: "Front Page of Hacker News 🟧", twist: "The whole internet is reading your README. No pressure." },
  "changing-requirements": { name: "Big Tech Forks Your Repo 🍴", twist: "They forked it and changed the theme. Keep up!" },
  "outage-3am": { name: "Maintainer Burnout 🫠", twist: "400 open issues at 3AM. Debug skill matters most." },
  "ipo-pitch": { name: "v1.0 Launch 🚀", twist: "The final boss. Big Tech counts double." },
};

export const bossInfo = (id: string, oss?: boolean) => (oss ? ossBosses[id] : undefined) ?? bosses[id];

export const fansLabel = (oss?: boolean) => (oss ? "⭐ stars" : "❤️ fans");

export const reviewerIcons: Record<string, string> = { Maintainers: "🧙", Contributors: "🧑‍🤝‍🧑", "Hacker News": "🟧", "Big Tech": "🏢", "Tech Lead": "🧔", Users: "🙋", Investor: "💼", "Dev Community": "🌐" };

export const passMarkFor = (run: StartupRun) => run.next_pass_mark ?? (run.act >= 3 ? 38 : run.act === 2 ? 26 : 18);

const actNames = ["Garage", "Seed", "Series A", "Series B", "Series C", "Unicorn 🦄", "Decacorn", "Metaverse Pivot", "Galactic Conglomerate"];
const roman = ["", "", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];

export function actName(act: number) {
  if (act <= actNames.length) return actNames[Math.max(0, act - 1)];
  const n = act - actNames.length + 1;
  return `Galactic Conglomerate ${roman[n] ?? n}`;
}

export function upcomingBoss(run: StartupRun): string | null {
  if (run.project_index % 3 !== 2) return null;
  if (run.next_boss) return run.next_boss;
  if (run.act >= 3) return "ipo-pitch";
  return run.boss_order?.[run.act - 1] ?? "demo-day";
}

export const teamCap = (act: number) => (act > 3 ? Math.min(8, 6 + (act - 3)) : act === 3 ? 6 : act === 2 ? 4 : 2);

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

type RoleLook = { label: string; short: string; color: string; anim: string; lines: string[]; idle: string[] };

const idleLines = ["☕ coffee break", "ทานข้าวยัง?", "reading docs 📚", "lo-fi beats 🎧", "stretching 🙆", "I use Arch btw", "ricing my desktop ✨", "tabs > spaces. fight me", "it works on my machine 🤷", "rewriting it in Rust 🦀", "vim or emacs? 👀", "sudo make me a sandwich", "my dotfiles are art", "Linux on a toaster 🍞"];

const roleLooks: Record<string, RoleLook> = {
  fe_dev: { label: "Frontend Dev", short: "FE", color: "#4f8df7", anim: "ss-type", lines: ["styling buttons 💅", "fixing CSS 😩", "npm install...", "useEffect again?!", "new JS framework dropped", "centering a div 🥲"], idle: idleLines },
  be_dev: { label: "Backend Dev", short: "BE", color: "#6a4fb3", anim: "ss-type", lines: ["writing the API 🔌", "SELECT * FROM...", "migrating the DB", "fixing N+1 queries", "I use Arch btw", ":wq  :wq!!  :q!!!"], idle: idleLines },
  designer: { label: "Designer", short: "UX", color: "#f06fa7", anim: "ss-type", lines: ["moving pixels 🎨", "new mockup!", "more whitespace", "Figma time ✨"], idle: idleLines },
  qa: { label: "QA", short: "QA", color: "#e2a12b", anim: "ss-type", lines: ["found a bug! 🐛", "testing login...", "edge case 🤔", "regression pass ✅"], idle: idleLines },
  devops: { label: "DevOps", short: "Ops", color: "#3aa37a", anim: "ss-point", lines: ["deploying 🚀", "CI is green ✅", "scaling pods", "reading logs 🔍", "sudo rm -rf... jk 😈", "it's always DNS 🙃", "compiling my kernel"], idle: idleLines },
  po: { label: "Product Owner", short: "PO", color: "#e3683e", anim: "ss-note", lines: ["writing user story 📝", "grooming backlog", "talking to users", "MVP first!"], idle: idleLines },
  pm: { label: "Project Manager", short: "PM", color: "#2d9cdb", anim: "ss-point", lines: ["standup time ⏰", "moving tickets →", "timeline OK 👍", "any blockers?"], idle: idleLines },
  sa: { label: "System Analyst", short: "SA", color: "#8d6e63", anim: "ss-draw", lines: ["drawing the ERD", "API contract ✍️", "sequence diagram", "planning for scale"], idle: idleLines },
};

export const roleLook = (role?: string): RoleLook => roleLooks[role ?? ""] ?? { ...roleLooks.fe_dev, label: "Developer", short: "Dev" };

export type TeamHint = { tone: "good" | "warn"; text: string };

export function teamHints(team: StartupDev[], boss: string | null): TeamHint[] {
  const has = (role: string) => team.some((d) => d.role === role);
  const hints: TeamHint[] = [];
  for (const d of team.filter((p) => (p.burnout ?? 0) >= 70)) hints.push({ tone: "warn", text: `${d.name} is at ${d.burnout}% burnout 🔥 one more crunch and they might quit. Sit them out?` });
  if (!has("qa") && !has("sa")) hints.push({ tone: "warn", text: "No QA or SA: expect extra bugs 🐛" });
  if (team.length > 2 && !has("pm")) hints.push({ tone: "warn", text: `No PM: ${team.length} people means meeting chaos 🌀` });
  if (boss === "outage-3am" && !has("devops") && !has("qa")) hints.push({ tone: "warn", text: "3AM outage with no DevOps or QA? Risky 🚨" });
  if (has("po")) hints.push({ tone: "good", text: "PO on board: Users and Investors will notice ✨" });
  if (has("pm")) hints.push({ tone: "good", text: "PM on board: faster build, smooth standups ⏰" });
  if (has("qa")) hints.push({ tone: "good", text: "QA on board: bugs get caught before ship ✅" });
  if (has("sa")) hints.push({ tone: "good", text: "SA on board: clean design, Tech Lead happy 📐" });
  if (has("devops")) hints.push({ tone: "good", text: "DevOps on board: faster deploys 🚀" });
  return hints;
}

const shadeLines = [
  "{name} พูดในสแตนด์อัพนานไปป่ะ 🙄",
  "{name} push ขึ้น main อีกแล้ว ไม่ไหวจะเคลียร์ 💅",
  "code {name} no cap คือ bug ล้วน 🧢",
  "เท่าที่ดู {name} แค่ขยับเมาส์ทั้งวัน 👀",
  "{name} ok boomer 👴",
  "{name} commit ว่า 'fix' อีกแล้ว เกินต้าน 😮‍💨",
  "{name} ตึงเกิน ใจเย็นแม่ 🫷",
  "ใครเขียน CSS อันนี้... {name} ใช่มั้ย 🫠",
  "{name} ขิงว่าใช้ Arch อีกแล้ว 🙄",
  "{name} กินขนมไม่แบ่ง ไม่โอเค 😤",
  "slay มากนะ {name}... ถ้า test ผ่านอะนะ 💅",
  "{name} อย่ามาเทงานนะ 🫵",
  "{name} ตอบแชทช้ากว่า CI อีก 🐢",
  "{name} ใส่ console.log ไว้ 40 ที่ จึ้งมาก 🫡",
];

const sassSolo = ["mood วันนี้คือไม่อยากทำงาน 🫠", "งานจึ้งมาก ใครสั่งเนี่ย", "ตัวแม่มาแล้ว 💅", "เบื่อ deadline แล้วค่ะซิส", "เอาจริงเหรอ... 🙂", "real talk: prod พังแน่ 🔥"];

export const comebackLines = ["เอ๊ะ?? 😤", "ใครถาม 🙄", "ไม่ใช่เราน้า 😳", "พูดดีๆ ก็ได้ป่ะ 🥲", "ขอสู้ 1 ยก 🥊"];

export function isSassy(dev: StartupDev) {
  if (dev.genmate_id) return false;
  let h = 7;
  for (const ch of dev.id + dev.name) h = (h * 37 + ch.charCodeAt(0)) | 0;
  return Math.abs(h) % 3 === 0;
}

export function sassLine(speaker: StartupDev, team: StartupDev[], rand: () => number = Math.random): { text: string; targetId?: string } {
  const targets = team.filter((d) => d.id !== speaker.id && !d.genmate_id);
  if (targets.length === 0 || rand() < 0.3) return { text: sassSolo[Math.floor(rand() * sassSolo.length)] };
  const target = targets[Math.floor(rand() * targets.length)];
  return { text: shadeLines[Math.floor(rand() * shadeLines.length)].replace("{name}", target.name), targetId: target.id };
}
