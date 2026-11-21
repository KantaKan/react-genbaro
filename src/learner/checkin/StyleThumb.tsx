import type { StyleId } from "./styles/registry";

/** Small static preview for the style picker. */
export function StyleThumb({ id }: { id: StyleId }) {
  const g = "#16a34a";
  switch (id) {
    case "slide":
      return <Pill><circle cx="15" cy="13" r="10" fill={g} /></Pill>;
    case "gold":
      return (
        <svg viewBox="0 0 90 26" width="86">
          <rect x="1" y="1" width="88" height="24" rx="12" fill="#1c1917" stroke="#a16207" />
          <circle cx="13" cy="13" r="9.5" fill="#facc15" stroke="#a16207" />
        </svg>
      );
    case "hold":
      return (
        <svg viewBox="0 0 90 26" width="86">
          <rect width="90" height="26" rx="8" fill="#18181b" />
          <rect width="50" height="26" rx="8" fill={g} />
        </svg>
      );
    case "ring":
      return (
        <svg viewBox="0 0 44 44" width="48">
          <circle cx="22" cy="22" r="18" fill="var(--l-card)" stroke="var(--l-hair)" strokeWidth="4" />
          <circle cx="22" cy="22" r="18" fill="none" stroke={g} strokeWidth="4" strokeDasharray="80 200" strokeLinecap="round" transform="rotate(-90 22 22)" />
        </svg>
      );
    case "run":
      return <span className="-rotate-6 rounded-full bg-zinc-900 px-3 py-1.5 text-[11px] font-semibold text-white shadow-[-12px_4px_0_-2px_rgba(24,24,27,.15)]">Check in ••</span>;
    case "coffee":
      return (
        <svg viewBox="0 0 60 50" width="52">
          <ellipse cx="28" cy="46" rx="24" ry="3.5" fill="#e4e4e7" />
          <path d="M10 12h36l-3 28a5 5 0 0 1-5 4H18a5 5 0 0 1-5-4z" fill="#fff" stroke="#d4d4d8" />
          <ellipse cx="28" cy="12" rx="18" ry="3.5" fill="#7c3f17" />
          <path d="M46 18q10 0 9 9t-11 9" fill="none" stroke="#d4d4d8" strokeWidth="4" />
        </svg>
      );
    case "red":
      return (
        <svg viewBox="0 0 60 44" width="54">
          <rect x="2" y="16" width="56" height="26" rx="7" fill="#3f3f46" />
          <path d="M12 26a18 14 0 0 1 36 0z" fill="#dc2626" />
          <ellipse cx="24" cy="18" rx="6" ry="3" fill="#fff" opacity=".5" />
        </svg>
      );
    case "cat":
      return (
        <svg viewBox="0 0 60 50" width="52">
          <path d="M12 22L15 6l12 10zM48 22L45 6 33 16z" fill="#fb923c" />
          <circle cx="30" cy="28" r="18" fill="#fb923c" />
          <path d="M20 27q4 3 8 0M32 27q4 3 8 0" stroke="#431407" strokeWidth="2" fill="none" strokeLinecap="round" />
        </svg>
      );
    case "bubble":
      return (
        <div className="grid grid-cols-4 gap-1">
          {Array.from({ length: 8 }, (_, i) => (
            <i key={i} className="block h-4 w-4 rounded-full" style={{ background: "radial-gradient(circle at 34% 30%,#fff 0 14%,rgba(186,230,253,.5) 60%,rgba(148,163,184,.6))", opacity: i === 2 || i === 5 ? 0.35 : 1 }} />
          ))}
        </div>
      );
    case "scratch":
      return (
        <div className="relative h-11 w-[86px] overflow-hidden rounded-md bg-gradient-to-br from-amber-100 to-pink-200">
          <b className="absolute left-2 top-3.5 text-[10px] text-green-700">PRES</b>
          <i className="absolute inset-0 bg-gradient-to-br from-zinc-300 via-zinc-400 to-zinc-200 [clip-path:polygon(40%_0,100%_0,100%_100%,20%_100%,55%_50%)]" />
        </div>
      );
    case "alarm":
      return (
        <svg viewBox="0 0 50 50" width="46">
          <circle cx="12" cy="12" r="7" fill="#facc15" />
          <circle cx="38" cy="12" r="7" fill="#facc15" />
          <circle cx="25" cy="28" r="17" fill="#e11d48" />
          <circle cx="25" cy="28" r="13" fill="#fff" />
          <path d="M25 28v-8M25 28l6 3" stroke="#18181b" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      );
    case "slot":
      return (
        <div className="flex gap-0.5 rounded-lg bg-gradient-to-b from-violet-600 to-violet-900 p-1.5">
          {[0, 1, 2].map((i) => (
            <i key={i} className="grid h-6 w-5 place-items-center rounded bg-white text-[12px] font-bold not-italic text-zinc-900">7</i>
          ))}
        </div>
      );
    case "gacha":
      return (
        <svg viewBox="0 0 50 54" width="44">
          <rect x="11" y="30" width="28" height="22" rx="5" fill="#e11d48" />
          <circle cx="25" cy="20" r="16" fill="#e0f2fe" stroke="#bae6fd" strokeWidth="2" />
          <circle cx="20" cy="18" r="5" fill="#f472b6" />
          <circle cx="30" cy="22" r="5" fill="#60a5fa" />
          <circle cx="25" cy="42" r="5" fill="#fde047" />
        </svg>
      );
    case "rocket":
      return (
        <svg viewBox="0 0 40 50" width="34">
          <path d="M20 3q9 11 7 34H13q-2-23 7-34z" fill="#e2e8f0" stroke="#64748b" />
          <path d="M20 3q5 6 6 14H14q1-8 6-14z" fill="#e11d48" />
          <circle cx="20" cy="24" r="4" fill="#38bdf8" />
          <path d="M13 32l-6 8v-9zM27 32l6 8v-9z" fill="#e11d48" />
        </svg>
      );
    case "arcade":
      return <div className="grid h-12 w-[84px] place-items-center rounded-lg bg-slate-950 font-mono text-[9px] font-bold text-yellow-300 shadow-[0_0_0_4px_#27272a]">START</div>;
    case "victory":
      return (
        <svg viewBox="0 0 60 44" width="56">
          <rect width="60" height="44" rx="8" fill="#1c1917" />
          <path d="M14 0l8 44H6zM46 0l8 44H38z" fill="#fde68a" opacity=".18" />
          <path d="M22 8h16v8a8 8 0 0 1-16 0z" fill="#f59e0b" />
          <rect x="28" y="24" width="4" height="7" fill="#d97706" />
          <rect x="23" y="31" width="14" height="5" rx="1.5" fill="#fbbf24" />
        </svg>
      );
    case "dj":
      return (
        <svg viewBox="0 0 60 44" width="56">
          <rect width="60" height="44" rx="7" fill="#27272a" />
          <circle cx="24" cy="22" r="17" fill="#09090b" stroke="#3f3f46" />
          <circle cx="24" cy="22" r="6" fill="#ec4899" />
          <path d="M52 6l-4 20-10 6" stroke="#d4d4d8" strokeWidth="2" fill="none" />
        </svg>
      );
  }
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 90 26" width="86">
      <rect x="0.5" y="0.5" width="89" height="25" rx="12.5" fill="var(--l-card)" stroke="var(--l-hair)" />
      {children}
    </svg>
  );
}
