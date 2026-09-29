import type { ReactNode } from "react";

export function ShowcaseLawnEnvironment({ children }: { children: ReactNode }) {
  return <div className="relative isolate overflow-hidden rounded-[36px] border-[3px] border-[#292542] bg-[#d4efe1] p-4 shadow-[9px_11px_0_#292542] sm:p-7">
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute -left-16 -top-20 h-52 w-52 rounded-full bg-[#fff7cc] blur-sm" />
      <div className="absolute right-8 top-8 h-4 w-4 rotate-45 rounded-sm bg-[#f4bd80]" />
      <div className="absolute right-20 top-20 h-2 w-2 rounded-full bg-white" />
      <div className="absolute -bottom-28 left-[-10%] h-64 w-[75%] rounded-[50%] bg-[#a7d5b8]" />
      <div className="absolute -bottom-36 right-[-18%] h-72 w-[85%] rounded-[50%] bg-[#8bc8a6]" />
      <div className="absolute bottom-8 left-[12%] h-3 w-3 rounded-full bg-[#f4bd80]" />
      <div className="absolute bottom-12 right-[16%] h-2 w-2 rounded-full bg-[#f4bd80]" />
    </div>
    <div className="relative z-10">{children}</div>
  </div>;
}
