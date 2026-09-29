import type { CSSProperties } from "react";

const backgrounds: Record<string, CSSProperties> = {
  meadow: { background: "radial-gradient(circle at 80% 18%, #fff7cf 0 14%, transparent 15%), linear-gradient(155deg, #a7dbc8 0%, #d5efcc 58%, #b8dfb3 100%)" },
  sunset: { background: "radial-gradient(circle at 72% 20%, #fff1be 0 16%, transparent 17%), linear-gradient(145deg, #ffb99b 0%, #f3a1b6 48%, #e0bbec 100%)" },
  night: { background: "radial-gradient(circle at 78% 20%, #fff2ad 0 11%, transparent 12%), radial-gradient(circle at 18% 22%, #fffaf0 0 2%, transparent 3%), radial-gradient(circle at 62% 55%, #fffaf0 0 2%, transparent 3%), linear-gradient(145deg, #d0c3ed 0%, #aaa2d4 100%)" },
  rainbow: { background: "radial-gradient(circle at 55% 75%, #fff9cf 0 20%, transparent 21%), conic-gradient(from 230deg at 50% 55%, #f8bbab, #f4d68f, #bce1bf, #a9d9ed, #d8b9ed, #f8bbab)" },
};

export function characterBackgroundStyle(value?: string, fallback = "#a7dbc8"): CSSProperties {
  return backgrounds[value ?? ""] ?? { background: fallback };
}
