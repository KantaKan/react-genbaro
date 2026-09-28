export interface FarmQuality {
  lowPower: boolean;
  reducedMotion: boolean;
  pixelRatio: [number, number];
  grassBlades: number;
  butterflies: number;
}

export function farmQualityForDevice(input: { width: number; cores?: number; memoryGb?: number; reducedMotion: boolean }): FarmQuality {
  const lowPower = input.width < 700 || (input.cores !== undefined && input.cores <= 4) || (input.memoryGb !== undefined && input.memoryGb <= 4);
  return {
    lowPower,
    reducedMotion: input.reducedMotion,
    pixelRatio: lowPower ? [1, 1] : [1, 1.5],
    grassBlades: lowPower ? 280 : 700,
    butterflies: input.reducedMotion ? 0 : lowPower ? 2 : 5,
  };
}
