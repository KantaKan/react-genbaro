import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

/** Loading state for admin pages. After a few seconds it says the request is still running. */
export function Loading({ label, className = "" }: { label: string; className?: string }) {
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setSlow(true), 4000);
    return () => clearTimeout(t);
  }, []);
  return (
    <div role="status" aria-live="polite" className={`flex flex-col items-center justify-center gap-2 rounded-[18px] bg-l-sub px-4 py-10 text-center ${className}`}>
      <Loader2 className="h-6 w-6 animate-spin text-l-ink2" aria-hidden />
      <p className="text-body font-semibold text-l-ink2">{label}</p>
      {slow && <p className="text-small text-l-ink3">Still loading. Big cohorts take a little longer.</p>}
    </div>
  );
}
