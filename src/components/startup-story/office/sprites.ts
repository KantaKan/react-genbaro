export type Grid = readonly string[];
export type Palette = Record<string, string>;
export type SpritePath = { fill: string; d: string; led: boolean };

export const PAL: Palette = {
  k: "#292542", K: "#1b1830", c: "#fffaf0", C: "#f4e3c3", w: "#ead3ac", f: "#e6c595", F: "#dcb683",
  b: "#b98b5e", B: "#8a5f3c", m: "#7bc4a8", M: "#3aa37a", p: "#f7c6d9", P: "#f06fa7", s: "#bfe3f7",
  S: "#4f8df7", y: "#fbe39a", Y: "#e2a12b", o: "#e3683e", v: "#cab2f1", V: "#6a4fb3", g: "#6b6f8e",
  G: "#a9abc4", W: "#ffffff", l: "#5ee08a", n: "#3b3f6b", r: "#e5484d",
};

export function toPaths(grid: Grid, pal: Palette = {}): SpritePath[] {
  const out = new Map<string, SpritePath>();
  grid.forEach((row, y) => {
    for (let x = 0; x < row.length;) {
      const ch = row[x];
      let n = 1;
      while (row[x + n] === ch) n++;
      const fill = ch === "." ? undefined : pal[ch] ?? PAL[ch];
      if (fill) {
        const led = ch === "l";
        const key = led ? "led" : fill;
        const path = out.get(key) ?? { fill, d: "", led };
        path.d += `M${x} ${y}h${n}v1h${-n}z`;
        out.set(key, path);
      }
      x += n;
    }
  });
  return [...out.values()];
}

export function tint(hex: string, f: number) {
  const n = parseInt(hex.slice(1), 16);
  return "#" + [16, 8, 0].map((s) => {
    const v = (n >> s) & 255;
    return Math.round(f < 1 ? v * f : v + (255 - v) * (f - 1)).toString(16).padStart(2, "0");
  }).join("");
}

const R = (ch: string, n: number) => ch.repeat(n);

export const block = (w: number, h: number, ch: string): Grid => Array.from({ length: h }, () => R(ch, w));

export const box = (w: number, h: number, fill: string, edge = "k"): Grid =>
  Array.from({ length: h }, (_, y) => (y === 0 || y === h - 1 ? R(edge, w) : edge + R(fill, w - 2) + edge));

export function oval(w: number, h: number, fill: string): Grid {
  const inside = (x: number, y: number) => x >= 0 && y >= 0 && x < w && y < h && ((x + 0.5 - w / 2) / (w / 2)) ** 2 + ((y + 0.5 - h / 2) / (h / 2)) ** 2 <= 1;
  return Array.from({ length: h }, (_, y) => Array.from({ length: w }, (_, x) => {
    if (!inside(x, y)) return ".";
    return [[1, 0], [-1, 0], [0, 1], [0, -1]].every(([dx, dy]) => inside(x + dx, y + dy)) ? fill : "k";
  }).join(""));
}

export function rack(servers: number): Grid {
  const rows = [R("k", 18), ...Array.from({ length: 4 * servers + 3 }, () => "kK" + R("K", 14) + "Kk"), R("k", 18), ".kk" + R(".", 12) + "kk.", ".kk" + R(".", 12) + "kk."];
  for (let i = 0; i < servers; i++) {
    server.forEach((line, dy) => {
      const y = 2 + 4 * i + dy;
      rows[y] = rows[y].slice(0, 2) + line + rows[y].slice(16);
    });
  }
  return rows;
}

const server: Grid = [R("k", 14), "k" + R("g", 12) + "k", "kglgygGGGGGGgk", "k" + R("g", 12) + "k", R("k", 14)];

export const person = {
  body: [
    "....kkkkkkkk....",
    "...k11111111k...",
    "..k1111111111k..",
    "..k1111111111k..",
    "..k1111111111k..",
    "..k1111111111k..",
    "..k1Wk1111Wk1k..",
    "..k1kk1111kk1k..",
    "..k1p111111p1k..",
    "...k111kk111k...",
    "....kk1111kk....",
    "...kk555555kk...",
    "..k5555cc5555k..",
    "..k5555555555k..",
    ".k56k555555k65k.",
    ".k56k555555k65k.",
    ".k56k555555k65k.",
    ".k11k666666k11k.",
    "..kkk777777kkk..",
    "....k777777k....",
  ],
  legs: ["....k77kk77k....", "....k77kk77k....", "....k77kk77k....", "...kkkk..kkkk..."],
  stepA: ["....k77kk77k....", "....k77kk77k....", "....kkkkk77k....", "........kkkk...."],
  stepB: ["....k77kk77k....", "....k77kk77k....", "....k77kkkkk....", "....kkkk........"],
} satisfies Record<string, Grid>;

export const hairStyles = {
  short: {
    front: ["....kkkkkkkk....", "...k33333333k...", "..k3343333333k..", "..k3333333333k..", "..k33......33k..", "..k3........3k.."],
  },
  long: {
    back: ["", "", "", "..kkkkkkkkkkkk..", ...Array.from({ length: 11 }, () => ".k333333333333k."), "..k33k....k33k..", "...kk......kk..."],
    front: ["....kkkkkkkk....", "...k33333333k...", "..k3343333333k..", "..k3333333333k..", "..k33333...33k..", "..k33......33k..", "..k3........3k..", "..k3........3k..", "..k3........3k.."],
  },
  bob: {
    front: ["....kkkkkkkk....", "...k33333333k...", "..k3343333333k..", "..k3333333333k..", ".k333333333333k.", ".k333......333k.", ".k33........33k.", ".k33........33k.", ".k33........33k.", "..kk........kk.."],
  },
  ponytail: {
    back: ["", "", "", "", ".............k3k", ".............k3k", ".............k4k", ".............k3k", ".............k3k", ".............k3k", ".............k3k", "..............kk"],
    front: ["....kkkkkkkk....", "...k33333333k...", "..k3343333333k..", "..k3333333333k..", "..k33......33k..", "..k3........3k.."],
  },
} satisfies Record<string, { back?: Grid; front: Grid }>;

export type HairStyle = keyof typeof hairStyles;
export const hairStyleNames = Object.keys(hairStyles) as HairStyle[];

export const roleGear: Record<string, Grid> = {
  designer: ["...kkkkkkk......", "..koooooook.....", "..kkkkkkkkkk...."],
  devops: ["...kkkkkkkkkk...", "..k..........k..", "..k..........k..", "..k..........k..", ".kk..........kk.", ".kg..........gk.", ".kg..........gk.", ".kk..........kk.", "..k.............", "...kkk.........."],
  pm: [...Array(14).fill(""), "............kbbk", "............kcck", "............kcck", "............kcck", "............kkkk"],
  qa: [...Array(13).fill(""), ".............kk.", "............ksSk", "............ksSk", ".............kk.", "............k..."],
  po: [...Array(15).fill(""), "............kyyk", "............kyyk", "............kkkk"],
  sa: [...Array(13).fill(""), "............kSk.", "............kSk.", "............kSk.", "............kSk.", "............kSk.", "............kkk."],
};

export const gradCap: Grid = ["...kk...", ".kkkkkk.", "kkkkkkkk", "..kkkk.y"];

export const desk = {
  base: [
    R("k", 32), "k" + R("b", 30) + "k", "k" + R("b", 30) + "k", "k" + R("B", 30) + "k", R("k", 32),
    ...Array.from({ length: 4 }, () => ".kBk" + R(".", 24) + "kBk."),
    ".kkk" + R(".", 24) + "kkk.",
  ],
  laptop: [".kkkkkkkkkk.", ".kGGGGGGGGk.", ".kGGGpGGGGk.", ".kGGGGGGGGk.", ".kGGGGGGGlk.", "kggggggggggk", "kkkkkkkkkkkk"],
} satisfies Record<string, Grid>;

export const decor = {
  plant: ["..m.m..", ".mMmMm.", "mMmmmMm", ".mMmMm.", "..mMm..", ".kkkkk.", ".koook.", ".koook.", ".koook.", "..kkk.."],
  poster: ["kkkkkkk", "kccWcck", "kckWkck", "kckskck", "kckWkck", "kkWWWkk", "kccocck", "kccycck", "kkkkkkk"],
  coffee: ["kkkkkkkk", "kggggggk", "kgoooogk", "kggggggk", "kgkkkkgk", "kgkKKkgk", "kgkKKkgk", "kgkkkkgk", "kggggggk", "kggggggk", "kkkkkkkk"],
  mug: ["kkkk.", "kcckk", "kcckk", "kkkk."],
  window: [
    R("k", 18),
    ...Array.from({ length: 14 }, (_, i) => {
      const y = i + 1;
      return Array.from({ length: 18 }, (_, x) => (x === 0 || x === 17 || x === 8 || x === 9 || y === 7 ? "k" : y >= 11 && [2, 3, 5, 11, 12, 14, 15].includes(x) ? "g" : (x + y === 5 || x + y === 6) && x < 8 ? "W" : "s")).join("");
    }),
    R("b", 18),
  ],
} satisfies Record<string, Grid>;

export const icons = {
  party: ["...y...p..s.", ".s....s.....", "....p....y..", "..y...kk....", ".....kook.p.", "....kooyok..", "...kooyook..", "..kooyook...", ".kooyook....", ".koyook.....", "kkook.......", "kkk........."],
  sweat: ["......k.....", ".....ksk....", ".....ksk....", "....kssSk...", "...ksWssSk..", "..ksWsssSSk.", "..ksssssSSk.", "..kssssSSSk.", "...kssSSSk..", "....kkkk....", "............", "............"],
  up: [".....kk.....", "....kmmk....", "...kmmmmk...", "..kmmmmmmk..", ".kmmmmmmmmk.", "kkkkmmmmkkkk", "...kmmmmk...", "...kmmmmk...", "...kMMMMk...", "...kMMMMk...", "...kkkkkk...", "............"],
  zzz: ["......VVVVV.", "........VV..", ".......VV...", "......VVVVV.", "............", ".VVVV.......", "...VV.......", "..VV........", ".VVVV.......", "......VVV...", ".......V....", "......VVV..."],
  clipboard: ["....kkkk....", "..kkkGGkkk..", "..kbkkkkbk..", "..kbccccbk..", "..kbkkccbk..", "..kbccccbk..", "..kbkkkcbk..", "..kbccccbk..", "..kbkkccbk..", "..kbccccbk..", "..kbbbbbbk..", "..kkkkkkkk.."],
} satisfies Record<string, Grid>;

export type ReactionIcon = "party" | "sweat" | "up";
