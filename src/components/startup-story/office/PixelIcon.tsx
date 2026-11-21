import { icons, type IconName } from "./sprites";
import { Sprite } from "./Sprite";

export function PixelIcon({ name, size = 2, label }: { name: string; size?: number; label?: string }) {
  const grid = icons[name as IconName] ?? icons.gift;
  return <svg viewBox="0 0 12 12" width={12 * size} height={12 * size} shapeRendering="crispEdges" className="inline-block shrink-0 align-middle"
    role={label ? "img" : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
    <Sprite grid={grid} scale={1} />
  </svg>;
}
