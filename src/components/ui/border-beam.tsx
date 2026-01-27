import React from "react";

interface BorderBeamProps {
  className?: string;
  size?: number;
  duration?: number;
  borderWidth?: number;
  anchor?: number;
  colorFrom?: string;
  colorTo?: string;
  delay?: number;
}

export const BorderBeam = React.memo(
  ({
    className,
    size = 100,
    duration = 15,
    anchor = 90,
    borderWidth = 1.5,
    colorFrom = "#ffaa40",
    colorTo = "#9c40ff",
    delay = 0,
  }: BorderBeamProps) => {
    return (
      <div
        style={
          {
            "--size": size,
            "--duration": duration,
            "--anchor": anchor,
            "--border-width": borderWidth,
            "--color-from": colorFrom,
            "--color-to": colorTo,
            "--delay": `-${delay}s`,
          } as React.CSSProperties
        }
        className={`absolute inset-0 rounded-[inherit] [border:calc(var(--border-width)*1px)_solid_transparent] [background:linear-gradient(to_right,transparent_calc(var(--anchor)*1%),var(--color-from),var(--color-to))_padding-box_border-box] [mask:linear-gradient(#fff_0_0)_content-box,linear-gradient(#fff_0_0)] [mask-composite:exclude] [mask-clip:padding-box,border-box] [mask-size:100%_100%,100%_100%] [mask-position:0_0,0_0] [transition:opacity_1s_cubic-bezier(0.25,0.46,0.45,0.94)_0s] ${className}`
        }
      >
        <div
          className={"absolute inset-0 rounded-[inherit] [border:calc(var(--border-width)*1px)_solid_transparent]"}
          style={{
            mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
            maskComposite: "exclude",
            WebkitMaskComposite: "xor",
            maskClip: "padding-box, border-box",
            maskSize: "100% 100%",
            maskPosition: "0 0, 0 0",
            background: `linear-gradient(to_right, transparent 0%, var(--color-from) 50%, var(--color-to) 100%)`,
            backgroundOrigin: "border-box",
            width: "calc(100% - 2px)",
            height: "calc(100% - 2px)",
            transform: `translate(var(--border-width), var(--border-width)) rotate(0deg)`,
          }}
        >
          <div
            className="absolute inset-0 rounded-[inherit]"
            style={{
              background: `conic-gradient(from 0deg, transparent, transparent 55%, var(--color-from), var(--color-to), transparent 100%)`,
              mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
              maskComposite: "intersect",
              WebkitMaskComposite: "destination-out",
              maskClip: "padding-box, border-box",
              maskSize: "100% 100%",
              maskPosition: "0 0, 0 0",
              width: "100%",
              height: "100%",
              animation: `border-beam ${duration}s linear infinite`,
              animationDelay: `var(--delay)`,
            }}
          />
        </div>
        <style jsx global>{`
          @keyframes border-beam {
            0% {
              transform: translateX(-10%) translateY(-10%) rotate(0deg);
            }
            50% {
              transform: translateX(10%) translateY(10%) rotate(180deg);
            }
            100% {
              transform: translateX(-10%) translateY(-10%) rotate(360deg);
            }
          }
        `}</style>
      </div>
    );
  },
);

BorderBeam.displayName = "BorderBeam";