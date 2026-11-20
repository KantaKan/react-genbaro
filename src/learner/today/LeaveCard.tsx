import { Link } from "react-router-dom";

export function LeaveCard({ used, allowance, rate }: { used: number; allowance: number; rate: number }) {
  return (
    <section className="l-card p-[22px]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-[15px] font-semibold">Leave &amp; lates</h3>
          <p className="mt-0.5 text-[12.5px] text-l-ink3">You can miss up to {allowance} days in total</p>
        </div>
        <Link to="/learner/attendance?leave=1" className="rounded-full bg-l-card px-3 py-1.5 text-[12.5px] font-medium shadow-[0_0_0_1px_var(--l-hair)]">
          Request leave
        </Link>
      </div>
      <div className="mt-4 flex items-baseline gap-1.5">
        <b className="text-[40px] font-semibold tabular-nums tracking-tighter">{used}</b>
        <span className="text-[15px] text-l-ink3">of {allowance} days used</span>
      </div>
      <div className="mt-3 flex gap-1.5">
        {Array.from({ length: allowance }, (_, i) => (
          <i key={i} className="block h-2.5 flex-1 rounded" style={{ background: i < used ? (used >= 7 ? "var(--l-red)" : used >= 4 ? "var(--l-amber)" : "var(--l-indigo)") : "var(--l-sub)" }} />
        ))}
      </div>
      <div className="mt-1.5 flex justify-between text-[11px] text-l-ink3">
        <span>0</span>
        <span>Warning at 4</span>
        <span>{allowance}</span>
      </div>
      <div className="mt-3.5 flex justify-between border-t border-l-hair pt-2.5 text-[13px] text-l-ink2">
        <span>Attendance rate</span>
        <b className="font-semibold tabular-nums text-l-ink">{(rate * 100).toFixed(1)}%</b>
      </div>
    </section>
  );
}
