import { cn } from "@/lib/utils"

// ponytail: warm shimmer atom — barometer "calibrating" feel, replaces generic animate-pulse
export function SkeletonWarm({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("rounded-md animate-shimmer", className)}
      {...props}
    />
  )
}

// ponytail: card skeleton — most common page loading pattern
export function SkeletonCard({ count = 1 }: { count?: number }) {
  return Array.from({ length: count }, (_, i) => (
    <div key={i} className="rounded-xl border bg-card p-6 space-y-3 paper-texture">
      <SkeletonWarm className="h-5 w-2/5" />
      <SkeletonWarm className="h-4 w-full" />
      <SkeletonWarm className="h-4 w-3/4" />
    </div>
  ))
}

// ponytail: table skeleton — admin/data page pattern
export function SkeletonTable({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-2">
      <div className="flex gap-4 px-4 py-3">
        {Array.from({ length: cols }, (_, j) => (
          <SkeletonWarm key={`h-${j}`} className="h-4 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex gap-4 px-4 py-3 border-t">
          {Array.from({ length: cols }, (_, j) => (
            <SkeletonWarm key={`c-${j}`} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  )
}
