export function RateRing({ rate, need = 0.9 }: { rate: number; need?: number }) {
  const C = 2 * Math.PI * 46;
  const ok = rate >= need;
  return (
    <div className="relative h-[110px] w-[110px] shrink-0">
      <svg width="110" height="110" viewBox="0 0 110 110" className="-rotate-90">
        <circle cx="55" cy="55" r="46" fill="none" stroke="var(--l-hair)" strokeWidth="10" />
        <circle
          cx="55"
          cy="55"
          r="46"
          fill="none"
          stroke={ok ? "var(--l-green)" : "var(--l-amber)"}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${C * rate} ${C}`}
          style={{ transition: "stroke-dasharray 1.2s cubic-bezier(.32,.72,0,1)" }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <b className="block text-2xl font-semibold tracking-tight">{(rate * 100).toFixed(1)}%</b>
          <span className="text-[11px] text-l-ink3">need {Math.round(need * 100)}%</span>
        </div>
      </div>
    </div>
  );
}
