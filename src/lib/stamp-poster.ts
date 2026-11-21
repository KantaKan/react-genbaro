import type { Stamp } from "@/lib/stamp";
import {
  STAMP_W,
  STAMP_H,
  buildPerforationCircles,
  stampMaskFractions,
} from "@/lib/stamp-mask";
import { deterministicRotation } from "@/lib/stamp-rotation";

export interface PosterSvgOptions {
  columns?: number;
  stampSize?: number;
  padding?: number;
}

const SVG_NS = "http://www.w3.org/2000/svg";
const XLINK_NS = "http://www.w3.org/1999/xlink";

export function buildPosterSvg(stamps: Stamp[], options: PosterSvgOptions = {}): string {
  const { columns = 5, stampSize = 260, padding = 40 } = options;

  if (stamps.length === 0) {
    return `<svg xmlns="${SVG_NS}" width="0" height="0"></svg>`;
  }

  const rows = Math.ceil(stamps.length / columns);
  const width = columns * stampSize + padding * 2;
  const height = rows * stampSize + padding * 2;

  const fractionCircles = stampMaskFractions(
    buildPerforationCircles(STAMP_W, STAMP_H),
    STAMP_W,
    STAMP_H
  );
  const circlesSvg = fractionCircles
    .map((circle) => `<circle cx="${circle.cx}" cy="${circle.cy}" r="${circle.r}"/>`)
    .join("");

  const images = stamps
    .map((stamp, index) => {
      const column = index % columns;
      const row = Math.floor(index / columns);
      const x = padding + column * stampSize;
      const y = padding + row * stampSize;
      const centerX = x + stampSize / 2;
      const centerY = y + stampSize / 2;
      const rotation = deterministicRotation(stamp.id);
      const href = escapeXml(stamp.imageUrl);
      return (
        `<image href="${href}" xlink:href="${href}" crossorigin="anonymous" x="${x}" y="${y}" ` +
        `width="${stampSize}" height="${stampSize}" preserveAspectRatio="xMidYMid slice" ` +
        `mask="url(#stamp-perf)" transform="translate(${centerX} ${centerY}) rotate(${rotation}) translate(${-centerX} ${-centerY})"/>`
      );
    })
    .join("");

  return [
    `<svg xmlns="${SVG_NS}" xmlns:xlink="${XLINK_NS}" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`,
    `<defs>`,
    `<mask id="stamp-perf" maskUnits="objectBoundingBox" maskContentUnits="objectBoundingBox" x="0" y="0" width="1" height="1">`,
    `<rect width="1" height="1" fill="#fff"/>`,
    circlesSvg,
    `</mask>`,
    `</defs>`,
    `<rect width="${width}" height="${height}" fill="#fdf6ec"/>`,
    images,
    `</svg>`,
  ].join("");
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
