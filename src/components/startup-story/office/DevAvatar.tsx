import { useMemo } from "react";
import type { StartupDev } from "@/application/services/startupStoryService";
import { looksFor } from "./looks";
import { hairStyles, person, wildLayers, wildSprites, type Grid } from "./sprites";
import { Sprite } from "./Sprite";

export function DevAvatar({ dev, size = 2 }: { dev: StartupDev; size?: number }) {
  const { style, pal, wild } = useMemo(() => looksFor(dev), [dev]);
  const hair: { back?: Grid; front: Grid } | undefined = style ? hairStyles[style] : undefined;
  const top = wild?.sprite === "duck" ? 6 : 0;
  return <svg viewBox={`0 ${top} 16 16`} width={16 * size} height={16 * size} shapeRendering="crispEdges" className="shrink-0" aria-hidden="true">
    {wild?.sprite
      ? <Sprite grid={wildSprites[wild.sprite]} scale={1} />
      : <>
        {hair?.back && <Sprite grid={hair.back} pal={pal} scale={1} />}
        <Sprite grid={person.body} pal={pal} scale={1} />
        {hair && <Sprite grid={hair.front} pal={pal} scale={1} />}
        {wild?.layers?.map((layer) => <Sprite key={layer} grid={wildLayers[layer]} pal={pal} scale={1} />)}
      </>}
  </svg>;
}
