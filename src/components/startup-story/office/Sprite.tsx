import { useMemo } from "react";
import { toPaths, type Grid, type Palette } from "./sprites";

type Props = { grid: Grid; pal?: Palette; x?: number; y?: number; scale?: number; blink?: boolean; className?: string };

export function Sprite({ grid, pal, x = 0, y = 0, scale = 2, blink, className }: Props) {
  const paths = useMemo(() => toPaths(grid, pal), [grid, pal]);
  const art = <g transform={`translate(${x} ${y}) scale(${scale})`}>
    {paths.map((p) => <path key={p.led ? "led" : p.fill} d={p.d} fill={p.fill} className={p.led && blink ? "ss-led" : undefined} />)}
  </g>;
  return className ? <g className={className}>{art}</g> : art;
}
