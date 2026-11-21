import type { PlantPalette } from "@/lib/plant-variants";

function soften(color: string): string {
  const target = [183, 179, 164];
  const channels = [1, 3, 5].map((index) => Number.parseInt(color.slice(index, index + 2), 16));
  const softened = channels.map((channel, index) => Math.round(channel * 0.68 + target[index] * 0.32));
  return `#${softened.map((channel) => channel.toString(16).padStart(2, "0")).join("")}`;
}

export function restingPalette(palette: PlantPalette): PlantPalette {
  return {
    name: "Resting",
    stem: soften(palette.stem),
    leaf: soften(palette.leaf),
    flower: soften(palette.flower),
    fruit: soften(palette.fruit),
    glow: soften(palette.glow),
    soil: soften(palette.soil),
    pot: soften(palette.pot),
  };
}
