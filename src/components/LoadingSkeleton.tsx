import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/** One placeholder block. Size and shape come from className so it can match the real element. */
export function Bone({ className = "" }: { className?: string }) {
  return <i aria-hidden className={cn("block animate-pulse rounded-md bg-l-sub", className)} />;
}

/** Tells screen readers the page is loading, and everyone that it is still going after a few seconds. */
export function LoadingHint({ label }: { label: string }) {
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setSlow(true), 4000);
    return () => clearTimeout(t);
  }, []);
  return (
    <p role="status" aria-live="polite" className={slow ? "mt-3 text-center text-small text-l-ink3" : "sr-only"}>
      {slow ? `${label}… big cohorts take a little longer.` : `${label}…`}
    </p>
  );
}

type Cell = "check" | "person" | "text" | "chips" | "day" | "meter" | "bars" | "actions" | "empty";

const NAME_W = ["w-36", "w-28", "w-40", "w-32", "w-24"];

function cell(kind: Cell, row: number) {
  switch (kind) {
    case "check":
      return <Bone className="h-4 w-4 rounded" />;
    case "person":
      return (
        <div className="flex items-center gap-2.5">
          <Bone className="h-[30px] w-[30px] shrink-0 rounded-full" />
          <div className="grid gap-1.5">
            <Bone className={`h-3.5 ${NAME_W[row % NAME_W.length]}`} />
            <Bone className="h-2.5 w-16" />
          </div>
        </div>
      );
    case "text":
      return <Bone className="h-3.5 w-12" />;
    case "chips":
      return <Bone className="h-5 w-28" />;
    case "day":
      return (
        <span className="inline-flex gap-[3px]">
          <Bone className="h-6 w-[34px] rounded-[7px]" />
          <Bone className="h-6 w-[34px] rounded-[7px]" />
        </span>
      );
    case "meter":
      return <Bone className="h-3 w-16" />;
    case "bars":
      return <Bone className="h-4 w-[88px]" />;
    case "actions":
      return <Bone className="ml-auto h-6 w-24 rounded-[7px]" />;
    case "empty":
      return null;
  }
}

/** Placeholder table rows shaped like the admin roster tables. Render inside a <tbody>. */
export function SkeletonRows({ cols, rows = 8 }: { cols: Cell[]; rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }, (_, r) => (
        <tr key={r} aria-hidden>
          {cols.map((k, i) => (
            <td key={i} className={`border-b border-l-hair px-3 py-2 ${k === "check" ? "w-8" : ""}`}>
              {cell(k, r)}
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}
