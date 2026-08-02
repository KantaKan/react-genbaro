export interface PerforationCircle {
  cx: number;
  cy: number;
  r: number;
}

export const STAMP_W = 170;
export const STAMP_H = 210;

export function buildPerforationCircles(
  stampW: number = STAMP_W,
  stampH: number = STAMP_H,
  offset: number = 9,
  spacing: number = 18,
  r: number = 5.5
): PerforationCircle[] {
  const circles: PerforationCircle[] = [];
  for (let x = offset; x < stampW - offset; x += spacing) {
    circles.push({ cx: x, cy: offset / 2, r });
    circles.push({ cx: x, cy: stampH - offset / 2, r });
  }
  for (let y = offset; y < stampH - offset; y += spacing) {
    circles.push({ cx: offset / 2, cy: y, r });
    circles.push({ cx: stampW - offset / 2, cy: y, r });
  }
  return circles;
}

export function stampMaskFractions(
  circles: PerforationCircle[],
  stampW: number = STAMP_W,
  stampH: number = STAMP_H
): PerforationCircle[] {
  const diagonal = Math.sqrt((stampW * stampW + stampH * stampH) / 2);
  return circles.map((circle) => ({
    cx: circle.cx / stampW,
    cy: circle.cy / stampH,
    r: circle.r / diagonal,
  }));
}
