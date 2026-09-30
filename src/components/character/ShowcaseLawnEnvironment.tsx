import type { ReactNode } from "react";

export function ShowcaseLawnEnvironment({ children, lighting = "morning" }: { children: ReactNode; lighting?: "morning" | "evening" }) {
  return <div data-lighting={lighting} className="relative isolate overflow-hidden rounded-2xl border border-border bg-[hsl(var(--character-lawn))] p-4 shadow-sm sm:p-7">
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className={`absolute inset-0 ${lighting === "evening" ? "bg-gradient-to-b from-[#7a6ab8]/25 via-[#f4a37c]/15 to-transparent" : "bg-gradient-to-b from-[#fff4c9]/40 to-transparent"}`} />
      <div className="absolute -left-16 -top-20 h-52 w-52 rounded-full bg-primary/15 blur-sm" />
      <div className="absolute right-8 top-8 h-4 w-4 rotate-45 rounded-sm bg-primary/50" />
      <div className="absolute right-20 top-20 h-2 w-2 rounded-full bg-foreground/25" />
      <div className="absolute -bottom-28 left-[-10%] h-64 w-[75%] rounded-[50%] bg-[hsl(var(--character-lawn-deep))]" />
      <div className="absolute -bottom-36 right-[-18%] h-72 w-[85%] rounded-[50%] bg-[hsl(var(--character-lawn-deep))]/70" />
      <div className="absolute bottom-8 left-[12%] h-3 w-3 rounded-full bg-primary/60" />
      <div className="absolute bottom-12 right-[16%] h-2 w-2 rounded-full bg-primary/60" />
    </div>
    <div className="relative z-10">{children}</div>
  </div>;
}
