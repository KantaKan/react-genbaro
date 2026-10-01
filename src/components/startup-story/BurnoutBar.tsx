export function BurnoutBar({ value }: { value: number }) {
  const tone = value >= 80 ? "bg-[#e3683e]" : value >= 50 ? "bg-[#f4ba87]" : "bg-[#7bc4a8]";
  return <div className="flex items-center gap-2 text-xs font-bold">
    <span className="w-14 uppercase tracking-wide">Burnout</span>
    <span className="h-2 flex-1 overflow-hidden rounded-full border border-[#292542] bg-white" role="progressbar" aria-label="Burnout" aria-valuemin={0} aria-valuemax={100} aria-valuenow={value}>
      <span className={`block h-full ${tone}`} style={{ width: `${Math.min(100, value)}%` }} />
    </span>
    <span className="w-8 text-right">{value >= 80 ? "🔥" : value >= 50 ? "😮‍💨" : "🙂"}</span>
  </div>;
}
