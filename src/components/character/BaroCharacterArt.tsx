import type { CharacterDNA, CharacterGrowthSnapshot } from "@/application/services/baroCharacterService";
import { characterInk as ink, characterPalette, characterPalettes as palettes, characterPatternPoints as points } from "./characterAppearance";

const bodyPaths: Record<string, string> = {
  pebble: "M110 72 C150 72 182 104 183 151 C184 198 158 230 110 230 C62 230 36 198 37 151 C38 104 70 72 110 72 Z",
  bean: "M89 72 C125 57 169 82 177 122 C185 163 179 215 134 228 C91 239 43 217 39 174 C34 132 48 88 89 72 Z",
  drop: "M110 53 C129 83 177 102 180 150 C183 198 157 231 110 231 C63 231 37 198 40 150 C43 102 91 83 110 53 Z",
  tall: "M105 59 C149 57 172 91 174 145 L177 193 C177 218 153 231 110 231 C67 231 43 218 43 193 L46 145 C48 91 71 61 105 59 Z",
  pillow: "M73 80 C91 65 128 65 148 78 C174 65 191 99 179 127 C193 154 184 194 164 213 C142 232 79 234 56 214 C36 196 31 156 42 127 C29 99 49 66 73 80 Z",
  pear: "M110 65 C134 67 145 83 148 107 C168 116 184 144 183 174 C181 211 153 230 110 231 C67 230 39 211 37 174 C36 144 52 116 72 107 C75 83 86 67 110 65 Z",
  squish: "M91 93 C115 73 151 77 168 100 C193 110 195 155 179 174 C187 204 160 232 124 224 C96 238 65 226 58 211 C25 207 26 169 41 152 C29 124 55 92 91 93 Z",
  cloud: "M77 91 C89 69 117 66 132 84 C154 68 183 88 177 112 C201 122 202 154 181 168 C196 194 170 227 145 219 C119 239 91 228 82 220 C51 227 29 200 43 176 C20 161 28 127 54 117 C50 105 60 92 77 91 Z",
  boxy: "M61 76 Q110 68 161 76 Q178 85 177 109 L181 194 Q182 224 154 228 L65 228 Q38 224 39 194 L43 109 Q42 85 61 76 Z",
  wobble: "M95 68 C119 83 142 58 159 87 C181 97 167 123 181 145 C200 174 171 187 170 207 C160 240 133 220 111 230 C85 241 65 222 57 207 C35 195 45 170 38 151 C32 122 52 112 56 88 C67 69 77 81 95 68 Z",
  mushroom: "M110 66 C150 67 181 88 184 126 Q185 146 160 150 L165 194 Q164 228 110 230 Q56 228 55 194 L60 150 Q35 146 36 126 C39 88 70 67 110 66 Z",
  dumpling: "M110 72 Q151 69 178 112 Q186 143 173 175 Q190 194 172 215 Q147 235 110 225 Q73 235 48 215 Q30 194 47 175 Q34 143 42 112 Q69 69 110 72 Z",
  bun: "M110 58 C126 58 130 72 123 80 C161 85 186 114 186 160 C186 205 158 230 110 230 C62 230 34 205 34 160 C34 114 59 85 97 80 C90 72 94 58 110 58 Z",
  "blob-cat": "M48 112 L52 62 L86 88 Q110 80 134 88 L168 62 L172 112 C190 142 186 200 162 220 C140 234 80 234 58 220 C34 200 30 142 48 112 Z",
  teardrop: "M152 60 C142 100 184 120 182 166 C180 206 152 231 110 231 C68 231 38 206 38 164 C38 112 90 80 152 60 Z",
  onigiri: "M110 62 C124 62 132 72 142 90 L180 170 C194 204 172 230 140 230 L80 230 C48 230 26 204 40 170 L78 90 C88 72 96 62 110 62 Z",
  bell: "M110 64 C150 64 168 96 170 140 C172 180 178 200 192 214 Q196 229 180 230 L40 230 Q24 229 28 214 C42 200 48 180 50 140 C52 96 70 64 110 64 Z",
  "star-cookie": "M110 56 Q128 100 188 116 Q150 152 162 230 Q110 206 58 230 Q70 152 32 116 Q92 100 110 56 Z",
};

function Ears({ dna, color }: { dna: CharacterDNA; color: typeof palettes.Mint }) {
  if (dna.ears === "none") return null;
  if (dna.ears === "round") return <g fill={color.body} stroke={ink} strokeWidth="5"><circle cx="66" cy="80" r="24" /><circle cx="154" cy="80" r="24" /></g>;
  if (dna.ears === "point" || dna.ears === "cat") return <g><path d="M55 107 Q48 80 58 41 Q75 48 93 87 Z M165 107 Q172 80 162 41 Q145 48 127 87 Z" fill={color.body} stroke={ink} strokeWidth="5" strokeLinejoin="round" />{dna.ears === "cat" && <path d="M65 81 Q64 65 66 58 Q78 64 83 81 Z M155 81 Q156 65 154 58 Q142 64 137 81 Z" fill={color.accent} />}</g>;
  if (dna.ears === "horn") return <path d="M65 94 L76 38 Q87 63 88 89 Z M155 94 L144 38 Q133 63 132 89 Z" fill={color.accent} stroke={ink} strokeWidth="5" />;
  if (dna.ears === "bunny") return <g stroke={ink} strokeWidth="5"><ellipse cx="82" cy="52" rx="15" ry="38" fill={color.body} /><ellipse cx="138" cy="52" rx="15" ry="38" fill={color.body} /><ellipse cx="82" cy="54" rx="6" ry="25" fill={color.accent} stroke="none" /><ellipse cx="138" cy="54" rx="6" ry="25" fill={color.accent} stroke="none" /></g>;
  if (dna.ears === "bear") return <g stroke={ink} strokeWidth="5"><circle cx="66" cy="86" r="18" fill={color.body} /><circle cx="154" cy="86" r="18" fill={color.body} /><circle cx="66" cy="86" r="8" fill={color.accent} stroke="none" /><circle cx="154" cy="86" r="8" fill={color.accent} stroke="none" /></g>;
  if (dna.ears === "sprout") return <g stroke={ink} strokeWidth="4" strokeLinejoin="round"><path d="M110 80 V44" fill="none" stroke="#57866c" strokeWidth="5" /><path d="M110 50 Q88 28 74 42 Q90 58 110 50 Z M110 46 Q132 24 146 38 Q130 54 110 46 Z" fill="#8cc97e" /></g>;
  if (dna.ears === "fox") return <g stroke={ink} strokeWidth="5" strokeLinejoin="round"><path d="M48 112 L58 34 L102 84 Z M172 112 L162 34 L118 84 Z" fill={color.body} /><path d="M62 94 L65 54 L88 82 Z M158 94 L155 54 L132 82 Z" fill="#fffaf0" stroke="none" /></g>;
  if (dna.ears === "droopy") return <path d="M60 92 Q22 98 24 160 Q28 186 48 178 Q56 140 74 104 Z M160 92 Q198 98 196 160 Q192 186 172 178 Q164 140 146 104 Z" fill={color.shade} stroke={ink} strokeWidth="5" strokeLinejoin="round" />;
  if (dna.ears === "feather") return <g stroke={ink} strokeWidth="4"><path d="M114 80 Q94 42 126 14 Q144 46 114 80 Z" fill={color.accent} /><path d="M114 78 Q118 46 126 22" fill="none" strokeWidth="2.5" /></g>;
  if (dna.ears === "leaf") return <path d="M80 94 Q22 85 42 43 Q83 47 80 94 Z M140 94 Q198 85 178 43 Q137 47 140 94 Z" fill={color.shade} stroke={ink} strokeWidth="5" />;
  return <g><path d="M75 88 Q53 48 54 36 M145 88 Q167 48 166 36" fill="none" stroke={ink} strokeWidth="5" /><circle cx="54" cy="34" r="12" fill={color.accent} stroke={ink} strokeWidth="4" /><circle cx="166" cy="34" r="12" fill={color.accent} stroke={ink} strokeWidth="4" /></g>;
}

function starPath(cx: number, cy: number, r: number) {
  return Array.from({ length: 10 }, (_, i) => {
    const angle = -Math.PI / 2 + i * Math.PI / 5;
    const radius = i % 2 === 0 ? r : r * 0.45;
    return `${i === 0 ? "M" : "L"}${(cx + Math.cos(angle) * radius).toFixed(1)} ${(cy + Math.sin(angle) * radius).toFixed(1)}`;
  }).join(" ") + " Z";
}

function Pattern({ dna, color, uid }: { dna: CharacterDNA; color: typeof palettes.Mint; uid: string }) {
  const dots = points(dna.pattern_seed, 28);
  switch (dna.pattern) {
    case "freckles": return <g fill={color.shade} opacity=".7">{dots.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={p.size * .35} />)}</g>;
    case "polka": return <g fill={color.accent} opacity=".8">{dots.slice(0, 13).map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={p.size} />)}</g>;
    case "stripes": return <g fill="none" stroke={color.shade} strokeWidth="7" opacity=".55">{Array.from({ length: 6 }, (_, i) => <path key={i} d={`M${35 + i * 27} 90 Q${62 + i * 19 + dots[i].turn} ${145 + dots[i].size} ${34 + i * 29} 235`} />)}</g>;
    case "marble": return <g fill="none" stroke={color.shade} strokeWidth="5" opacity=".6">{Array.from({ length: 6 }, (_, i) => <path key={i} d={`M${44 + i * 27} 94 C${77 + i * 20 + dots[i].turn} 135 ${27 + i * 32 - dots[i].turn} 168 ${69 + i * 20} 236`} />)}</g>;
    case "waves": return <g fill="none" stroke={color.accent} strokeWidth="6" opacity=".7">{Array.from({ length: 5 }, (_, i) => <path key={i} d={`M35 ${110 + i * 26} Q75 ${95 + i * 26 + dots[i].turn} 110 ${110 + i * 26} T185 ${110 + i * 26}`} />)}</g>;
    case "zigzag": return <g fill="none" stroke={color.accent} strokeWidth="6" opacity=".7">{Array.from({ length: 5 }, (_, i) => <path key={i} d={`M38 ${111 + i * 24} l25 -${8 + dots[i].size} 24 ${12 + dots[i].size} 25 -11 24 10 26 -11 23 10`} />)}</g>;
    case "checker": case "mosaic": case "error404": return <g fill={color.shade} opacity=".65">{dots.map((p, i) => <rect key={i} x={p.x} y={p.y} width={p.size * 1.7} height={p.size * 1.5} rx="2" transform={`rotate(${p.turn} ${p.x} ${p.y})`} />)}{dna.pattern === "error404" && <g><rect x="75" y="183" width="70" height="34" rx="5" fill="#fffaf0" stroke={ink} strokeWidth="3" /><text x="110" y="207" textAnchor="middle" fontSize="20" fontWeight="900" fill={ink}>404</text></g>}</g>;
    case "sprouts": return <g stroke={color.shade} strokeWidth="3" fill="none">{dots.slice(0, 12).map((p, i) => <path key={i} d={`M${p.x} ${p.y + 8} v-17 m0 10 q-10 -11 -12 -7 m12 7 q10 -11 12 -7`} />)}</g>;
    case "hearts": return <g fill={color.accent} opacity=".8">{dots.slice(0, 12).map((p, i) => <path key={i} d={`M${p.x} ${p.y + p.size} c-${p.size * 2} -${p.size} -${p.size} -${p.size * 2} 0 -${p.size} c${p.size} -${p.size} ${p.size * 2} 0 0 ${p.size * 2}Z`} />)}</g>;
    case "bubbles": return <g stroke="#fffaf0" strokeWidth="3" fill="none" opacity=".8">{dots.slice(0, 16).map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={p.size} />)}</g>;
    case "constellation": return <g stroke="#fffaf0" fill="#fffaf0">{dots.slice(0, 11).map((p, i) => <g key={i}>{i > 0 && <path d={`M${dots[i - 1].x} ${dots[i - 1].y} L${p.x} ${p.y}`} opacity=".55" />}<circle cx={p.x} cy={p.y} r={p.size * .4} /></g>)}</g>;
    case "paint": case "petals": return <g fill={color.accent} opacity=".7">{dots.slice(0, 14).map((p, i) => <ellipse key={i} cx={p.x} cy={p.y} rx={p.size * .6} ry={p.size * 1.3} transform={`rotate(${p.turn} ${p.x} ${p.y})`} />)}</g>;
    case "egg": return <g>{dots.slice(0, 5).map((p, i) => <g key={i}><ellipse cx={p.x} cy={p.y} rx={p.size * 1.6} ry={p.size * 1.2} fill="#fffaf0" stroke="#c49baf" strokeWidth="2" /><circle cx={p.x} cy={p.y} r={p.size * .6} fill="#f3ba48" /></g>)}</g>;
    case "potato": return <g fill="#987352" opacity=".72">{dots.slice(0, 20).map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={p.size * .3} />)}</g>;
    case "ramen": return <g><g fill="none" stroke="#f7e4a8" strokeWidth="6">{Array.from({ length: 5 }, (_, i) => <path key={i} d={`M${70 + i * 18} 105 q${-11 + dots[i].turn / 4} 19 0 34 t0 37`} />)}</g><path d="M76 182 Q110 193 144 182 L134 217 Q109 227 86 217 Z" fill="#fff5da" stroke="#8c5d72" strokeWidth="4" /></g>;
    case "coffee-beans": return <g>{dots.slice(0, 12).map((p, i) => <g key={i} transform={`rotate(${p.turn} ${p.x} ${p.y})`}><ellipse cx={p.x} cy={p.y} rx={p.size * .8} ry={p.size * 1.1} fill="#7a5240" opacity=".8" /><path d={`M${p.x} ${p.y - p.size} Q${p.x - p.size * .4} ${p.y} ${p.x} ${p.y + p.size}`} fill="none" stroke="#d6b38c" strokeWidth="1.8" /></g>)}</g>;
    case "clover": return <g fill="#6fae6a" opacity=".7">{dots.slice(0, 10).map((p, i) => <g key={i} transform={`rotate(${p.turn} ${p.x} ${p.y})`}><circle cx={p.x} cy={p.y - p.size * .5} r={p.size * .5} /><circle cx={p.x - p.size * .5} cy={p.y + p.size * .2} r={p.size * .5} /><circle cx={p.x + p.size * .5} cy={p.y + p.size * .2} r={p.size * .5} /></g>)}</g>;
    case "raindrops": return <g fill="#fffaf0" opacity=".7">{dots.slice(0, 16).map((p, i) => { const r = p.size * 1.2; return <path key={i} d={`M${p.x} ${p.y - r} Q${p.x - r * .8} ${p.y + r * .4} ${p.x} ${p.y + r * .7} Q${p.x + r * .8} ${p.y + r * .4} ${p.x} ${p.y - r} Z`} />; })}</g>;
    case "leopard": return <g>{dots.slice(0, 14).map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={p.size} fill={color.accent} fillOpacity=".4" stroke={color.shade} strokeWidth="3.5" strokeDasharray="6 4" />)}</g>;
    case "plaid": return <g opacity=".45">{[0, 1, 2, 3].map((i) => <g key={i}><rect x={42 + i * 38 + dots[i].turn / 5} y="60" width="14" height="180" fill={color.shade} /><rect x="30" y={96 + i * 38 + dots[i + 4].turn / 5} width="160" height="14" fill={color.shade} /><path d={`M${60 + i * 38} 60 V240 M30 ${114 + i * 38} H190`} stroke={color.accent} strokeWidth="2" /></g>)}</g>;
    case "confetti": return <g>{dots.map((p, i) => <rect key={i} x={p.x} y={p.y} width={p.size * .9} height={p.size * .45} rx="1" fill={[color.accent, color.shade, "#fffaf0"][i % 3]} transform={`rotate(${p.turn * 3} ${p.x} ${p.y})`} />)}</g>;
    case "leaves": return <g fill={color.shade} opacity=".6">{dots.slice(0, 14).map((p, i) => { const r = p.size * 1.4; return <path key={i} d={`M${p.x - r} ${p.y} Q${p.x} ${p.y - r} ${p.x + r} ${p.y} Q${p.x} ${p.y + r} ${p.x - r} ${p.y} Z`} transform={`rotate(${p.turn * 2} ${p.x} ${p.y})`} />; })}</g>;
    case "cookie": return <g fill="#5b3a2e" opacity=".82">{dots.slice(0, 16).map((p, i) => <path key={i} d={`M${p.x - p.size * .6} ${p.y} l${p.size * .5} -${p.size * .55} ${p.size * .65} ${p.size * .15} -${p.size * .1} ${p.size * .6} Z`} />)}</g>;
    case "coffee-stain": return <g>{dots.slice(0, 3).map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={18 + p.size * 1.5} fill="#8a5a3c" fillOpacity=".12" stroke="#8a5a3c" strokeOpacity=".45" strokeWidth={4 + i} strokeDasharray={i === 1 ? "40 8" : undefined} />)}<path d={`M${dots[0].x + 8} ${dots[0].y + 20} q-2 18 3 26 q5 -8 1 -26`} fill="#8a5a3c" opacity=".35" /></g>;
    case "this-is-fine": return <g>{Array.from({ length: 7 }, (_, i) => { const x = 40 + i * 24; const h = 40 + dots[i].size * 5; return <g key={i}><path d={`M${x} 234 Q${x - 18} ${234 - h * .5} ${x - 3} ${234 - h} Q${x + 2} ${234 - h * .6} ${x + 9} ${234 - h * .78} Q${x + 20} ${234 - h * .4} ${x} 234 Z`} fill="#f4743b" /><path d={`M${x} 234 Q${x - 9} ${234 - h * .3} ${x} ${234 - h * .55} Q${x + 10} ${234 - h * .3} ${x} 234 Z`} fill="#ffd166" /></g>; })}</g>;
    case "merge-conflict": return <g fontFamily="ui-monospace, monospace" fontSize="13" fontWeight="800" fill={ink}><rect x="0" y="86" width="220" height="56" fill="#9fd8a0" opacity=".5" /><rect x="0" y="186" width="220" height="50" fill="#f4a3a3" opacity=".5" /><text x={44 + dots[0].turn / 2} y="104" opacity=".6">{"<<<<<<< HEAD"}</text><text x={56 + dots[1].turn / 2} y="182" opacity=".6">=======</text><text x={44 + dots[2].turn / 2} y="226" opacity=".6">{">>>>>>> main"}</text></g>;
    case "semicolon": return <g fill={color.shade} fontSize="22" fontWeight="900" fontFamily="ui-monospace, monospace" opacity=".7">{dots.slice(0, 14).map((p, i) => <text key={i} x={p.x} y={p.y} transform={`rotate(${p.turn} ${p.x} ${p.y})`}>;</text>)}</g>;
    case "mango-sticky-rice": return <g><g fill="#fffaf0" opacity=".85">{dots.slice(0, 22).map((p, i) => <ellipse key={i} cx={p.x} cy={p.y} rx="2.4" ry="4" transform={`rotate(${p.turn * 3} ${p.x} ${p.y})`} />)}</g>{[0, 1, 2].map((i) => <path key={i} d={`M${62 + i * 32} ${186 + i * 6} q16 -${30 + dots[i].size} 34 0 q-17 10 -34 0 Z`} fill="#ffc93c" stroke="#e89b1a" strokeWidth="3" />)}</g>;
    case "loading-spinner": return <g>{dots.slice(0, 4).map((p, j) => <g key={j}>{Array.from({ length: 8 }, (_, i) => <circle key={i} cx={p.x + Math.cos(i * Math.PI / 4) * 11} cy={p.y + Math.sin(i * Math.PI / 4) * 11} r="2.8" fill="#fffaf0" opacity={(i + 1) / 8} />)}</g>)}</g>;
    case "galaxy": return <g><defs><radialGradient id={`${uid}-galaxy`}><stop offset="0" stopColor="#ff9ad5" stopOpacity=".85" /><stop offset=".55" stopColor="#6d5bd0" stopOpacity=".6" /><stop offset="1" stopColor="#1f1a45" stopOpacity=".75" /></radialGradient></defs><rect x="0" y="40" width="220" height="210" fill={`url(#${uid}-galaxy)`} />{dots.map((p, i) => i % 6 === 0 ? <path key={i} d={starPath(p.x, p.y, p.size * .9)} fill="#fff6c8" /> : <circle key={i} cx={p.x} cy={p.y} r={p.size * .22} fill="#fffaf0" />)}</g>;
    case "aurora": return <g><defs><linearGradient id={`${uid}-aurora`} x1="0" x2="1"><stop offset="0" stopColor="#7df0c0" /><stop offset=".5" stopColor="#7cc7ff" /><stop offset="1" stopColor="#c59bff" /></linearGradient></defs><g fill="none" stroke={`url(#${uid}-aurora)`} strokeLinecap="round" opacity=".6">{[0, 1, 2].map((i) => <path key={i} strokeWidth={22 - i * 5} d={`M20 ${110 + i * 42} C70 ${80 + i * 42 + dots[i].turn} 130 ${150 + i * 42 - dots[i].turn} 200 ${110 + i * 42}`} />)}</g>{dots.slice(0, 8).map((p, i) => <path key={i} d={starPath(p.x, p.y, p.size * .6)} fill="#fffaf0" opacity=".85" />)}</g>;
    case "golden-code": return <g><rect x="0" y="40" width="220" height="210" fill="#ffe08a" opacity=".3" /><g fontFamily="ui-monospace, monospace" fontWeight="900" fill="#f5c451" stroke="#9a6b12" strokeWidth=".8">{dots.slice(0, 12).map((p, i) => <text key={i} x={p.x - 8} y={p.y} fontSize={10 + p.size} transform={`rotate(${p.turn / 2} ${p.x} ${p.y})`}>{["</>", "{ }", "01", "=>", "()", "#"][i % 6]}</text>)}</g>{dots.slice(12, 17).map((p, i) => <path key={i} d={starPath(p.x, p.y, p.size)} fill="#fff6c8" />)}</g>;
    case "rainbow-shimmer": return <g opacity=".45" transform={`rotate(${-30 + dots[0].turn / 3} 110 155)`}>{["#f8a0a0", "#f8cf7a", "#b5e3a1", "#8fd3f0", "#b9a4f0", "#f5a8d8"].map((c, i) => <rect key={c} x="-40" y={60 + i * 34} width="300" height="22" fill={c} />)}</g>;
    default: return null;
  }
}

function Eyes({ kind }: { kind: string }) {
  if (kind === "happy-arc") return <path d="M74 145 Q87 128 100 145 M120 145 Q133 128 146 145" fill="none" stroke={ink} strokeWidth="6" strokeLinecap="round" />;
  if (kind === "glasses-dots") return <g><g fill={ink}><circle cx="87" cy="140" r="6" /><circle cx="133" cy="140" r="6" /></g><g fill="none" stroke={ink} strokeWidth="4"><circle cx="87" cy="140" r="17" /><circle cx="133" cy="140" r="17" /><path d="M104 138 Q110 133 116 138" /></g></g>;
  if (kind === "star") return <g fill={ink}><path d={starPath(87, 141, 14)} /><path d={starPath(133, 141, 14)} /></g>;
  if (kind === "heart") return <g fill="#e2557a">{[87, 133].map((x) => <path key={x} d={`M${x} 151 C${x - 18} 141 ${x - 10} 124 ${x} 133 C${x + 10} 124 ${x + 18} 141 ${x} 151 Z`} />)}</g>;
  if (kind === "wink") return <g><circle cx="87" cy="140" r="8" fill={ink} /><path d="M120 142 Q133 131 146 142" fill="none" stroke={ink} strokeWidth="6" strokeLinecap="round" /></g>;
  if (kind === "sparkle-big") return <g><ellipse cx="87" cy="140" rx="15" ry="18" fill={ink} /><ellipse cx="133" cy="140" rx="15" ry="18" fill={ink} /><g fill="white"><circle cx="81" cy="133" r="6" /><circle cx="127" cy="133" r="6" /><circle cx="93" cy="148" r="2.5" /><circle cx="139" cy="148" r="2.5" /></g></g>;
  if (kind === "sleepy") return <path d="M74 139 Q87 150 100 139 M120 139 Q133 150 146 139" fill="none" stroke={ink} strokeWidth="6" strokeLinecap="round" />;
  if (kind === "spark") return <path d="M87 126 L91 136 L101 140 L91 144 L87 154 L83 144 L73 140 L83 136 Z M133 126 L137 136 L147 140 L137 144 L133 154 L129 144 L119 140 L129 136 Z" fill={ink} />;
  if (kind === "wide") return <g><ellipse cx="87" cy="140" rx="14" ry="17" fill={ink} /><ellipse cx="133" cy="140" rx="14" ry="17" fill={ink} /><circle cx="82" cy="134" r="5" fill="white" /><circle cx="128" cy="134" r="5" fill="white" /></g>;
  if (kind === "oval") return <g fill={ink}><ellipse cx="87" cy="140" rx="8" ry="13" /><ellipse cx="133" cy="140" rx="8" ry="13" /></g>;
  return <g fill={ink}><circle cx="87" cy="140" r="8" /><circle cx="133" cy="140" r="8" /></g>;
}

function Mark({ kind, fill }: { kind: string; fill: string }) {
  if (kind === "star") return <path d="M110 176 L115 188 L128 189 L118 198 L121 211 L110 204 L99 211 L102 198 L92 189 L105 188 Z" fill={fill} />;
  if (kind === "spots") return <g fill={fill}><circle cx="88" cy="185" r="9" /><circle cx="129" cy="197" r="7" /><circle cx="114" cy="177" r="4" /></g>;
  if (kind === "stripe") return <path d="M74 189 Q110 210 147 185" fill="none" stroke={fill} strokeWidth="11" strokeLinecap="round" />;
  if (kind === "heart") return <path d="M110 207 C77 190 92 168 110 182 C128 168 143 190 110 207 Z" fill={fill} />;
  if (kind === "moon") return <path d="M119 176 A17 17 0 1 0 127 203 A14 14 0 1 1 119 176 Z" fill={fill} />;
  if (kind === "bolt") return <path d="M116 174 L96 197 H110 L104 216 L127 189 H113 Z" fill={fill} stroke={ink} strokeWidth="2.5" strokeLinejoin="round" />;
  if (kind === "flower") return <g><g fill={fill}>{Array.from({ length: 5 }, (_, i) => <circle key={i} cx={110 + Math.cos(i * Math.PI * 2 / 5 - Math.PI / 2) * 9} cy={193 + Math.sin(i * Math.PI * 2 / 5 - Math.PI / 2) * 9} r="7" />)}</g><circle cx="110" cy="193" r="5" fill="#fffaf0" /></g>;
  if (kind === "coffee-bean") return <g transform="rotate(-20 110 193)"><ellipse cx="110" cy="193" rx="11" ry="15" fill="#6b4a3a" /><path d="M110 179 Q104 193 110 207" fill="none" stroke="#d6b38c" strokeWidth="2.5" /></g>;
  if (kind === "blush") return <g fill="#f48fa0" opacity=".6"><ellipse cx="72" cy="163" rx="15" ry="8" /><ellipse cx="148" cy="163" rx="15" ry="8" /></g>;
  if (kind === "bandaid") return <g transform="translate(140 112) rotate(-25)"><rect x="-19" y="-7" width="38" height="14" rx="7" fill="#f4d3a8" stroke={ink} strokeWidth="2.5" /><rect x="-6" y="-7" width="12" height="14" fill="#e8b98a" /><g fill={ink} opacity=".45"><circle cx="-12" cy="0" r="1.2" /><circle cx="12" cy="0" r="1.2" /></g></g>;
  if (kind === "tear") return <path d="M80 152 Q72 166 80 171 Q88 166 80 152 Z" fill="#8fd3f0" stroke={ink} strokeWidth="2" />;
  return null;
}

function CharacterProp({ prop }: { prop?: string }) {
  if (prop === "flower") return <g><path d="M128 90 Q136 65 157 55" fill="none" stroke="#57866c" strokeWidth="5" /><g fill="#fff1d5" stroke={ink} strokeWidth="2.5"><circle cx="155" cy="43" r="9" /><circle cx="170" cy="50" r="9" /><circle cx="166" cy="66" r="9" /><circle cx="150" cy="63" r="9" /></g><circle cx="160" cy="54" r="7" fill="#f2bb63" stroke={ink} strokeWidth="2" /></g>;
  if (prop === "cat-ears") return <g><path d="M53 99 L54 45 Q75 50 85 81 M135 81 Q145 50 166 45 L167 99" fill="#f4abc1" stroke={ink} strokeWidth="5" strokeLinejoin="round" /><path d="M55 92 Q108 60 165 92" fill="none" stroke="#f4abc1" strokeWidth="8" /></g>;
  if (prop === "egg") return <g><path d="M131 75 Q139 60 153 67 Q173 55 180 74 Q192 84 177 95 Q168 109 151 98 Q133 105 130 89 Q121 83 131 75 Z" fill="#fffaf0" stroke={ink} strokeWidth="3" /><circle cx="155" cy="83" r="12" fill="#f5bd4f" /></g>;
  if (prop === "halo") return <g><ellipse cx="110" cy="45" rx="43" ry="12" fill="none" stroke="#fff1a9" strokeWidth="9" /><ellipse cx="110" cy="45" rx="43" ry="12" fill="none" stroke={ink} strokeWidth="2" /></g>;
  if (prop === "headphones") return <g fill="none" stroke={ink} strokeLinecap="round"><path d="M51 139 Q49 57 110 57 Q171 57 169 139" strokeWidth="13" /><path d="M51 139 Q49 57 110 57 Q171 57 169 139" stroke="#5fa9c9" strokeWidth="7" /><rect x="39" y="126" width="25" height="45" rx="10" fill="#f4bd80" strokeWidth="4" /><rect x="156" y="126" width="25" height="45" rx="10" fill="#f4bd80" strokeWidth="4" /></g>;
  if (prop === "pixel-glasses") return <g stroke={ink} strokeWidth="5" strokeLinejoin="round"><path d="M62 125 H101 V151 H62 Z M119 125 H158 V151 H119 Z" fill="#9cd7e8" fillOpacity=".75" /><path d="M101 134 H119 M50 132 H62 M158 132 H170" fill="none" /></g>;
  if (prop === "coffee-cup") return <g stroke={ink} strokeWidth="3" strokeLinejoin="round"><path d="M178 160 q-4 -8 0 -14 M188 160 q-4 -9 0 -16" fill="none" stroke="#b9aab5" strokeWidth="2.5" /><path d="M168 176 H200 L196 210 Q195 216 189 216 H179 Q173 216 172 210 Z" fill="#fffaf0" /><path d="M170 188 H198 L197 200 H171 Z" fill="#b98460" strokeWidth="2" /><path d="M165 168 H203 V177 H165 Z" fill="#8a5a3c" /></g>;
  if (prop === "sticky-note") return <g transform="translate(132 92) rotate(12)" stroke={ink} strokeWidth="2.5"><rect x="-17" y="-17" width="34" height="34" fill="#fff07a" /><path d="M-10 -6 H10 M-10 2 H8 M-10 10 H4" strokeWidth="2" /></g>;
  if (prop === "bow") return <g stroke={ink} strokeWidth="3.5" strokeLinejoin="round"><path d="M150 76 L124 60 Q118 76 124 94 Z M150 76 L176 60 Q182 76 176 94 Z" fill="#f48fb1" /><circle cx="150" cy="77" r="7" fill="#e2557a" /></g>;
  if (prop === "beanie") return <g stroke={ink} strokeWidth="4" strokeLinejoin="round"><path d="M58 104 Q60 52 110 50 Q160 52 162 104 Z" fill="#e8726a" /><path d="M80 60 V100 M96 54 V100 M110 52 V100 M124 54 V100 M140 60 V100" fill="none" stroke="#c95a54" strokeWidth="3" /><path d="M52 98 H168 Q172 108 168 116 H52 Q48 108 52 98 Z" fill="#f3a59a" /><circle cx="110" cy="44" r="11" fill="#fffaf0" /></g>;
  if (prop === "leaf-sprout") return <g stroke={ink} strokeWidth="3.5" strokeLinejoin="round"><path d="M110 76 Q108 58 118 46" fill="none" stroke="#57866c" strokeWidth="5" /><path d="M116 48 Q128 20 160 26 Q152 56 116 48 Z" fill="#7cc47a" /><path d="M120 46 Q136 36 152 30" fill="none" strokeWidth="2" /><circle cx="148" cy="44" r="4" fill="#bfe8ff" strokeWidth="1.5" /></g>;
  if (prop === "scarf") return <g stroke={ink} strokeWidth="4" strokeLinejoin="round"><path d="M46 170 Q110 196 174 170 L176 188 Q110 214 44 188 Z" fill="#e8726a" /><path d="M138 192 L148 232 L166 228 L156 188 Z" fill="#e8726a" /><path d="M62 180 Q110 200 158 180 M143 208 L160 205" fill="none" stroke="#fff1d6" strokeWidth="4" /></g>;
  if (prop === "iced-thai-tea") return <g stroke={ink} strokeWidth="3" strokeLinejoin="round"><path d="M190 148 L182 180" fill="none" stroke="#e2557a" strokeWidth="5" /><path d="M168 166 H202 L197 220 H173 Z" fill="#f29a4a" /><path d="M169 172 H201 L200 186 H170 Z" fill="#fff1d6" stroke="none" /><path d="M165 162 H205 V168 H165 Z" fill="#fffaf0" /></g>;
  if (prop === "boba") return <g stroke={ink} strokeWidth="3" strokeLinejoin="round"><path d="M188 140 L184 178" fill="none" stroke="#8fd3f0" strokeWidth="7" /><path d="M168 170 H202 L197 222 H173 Z" fill="#e9cfae" /><g fill="#3b2a26" stroke="none">{[[178, 214], [186, 210], [194, 214], [182, 206], [191, 203]].map(([x, y]) => <circle key={`${x}-${y}`} cx={x} cy={y} r="3.6" />)}</g><path d="M165 170 Q185 150 205 170 Z" fill="#fffaf0" fillOpacity=".8" /></g>;
  if (prop === "rubber-duck") return <g stroke={ink} strokeWidth="3" strokeLinejoin="round"><path d="M86 66 Q86 46 110 48 Q128 50 134 60 Q132 72 110 72 Q90 72 86 66 Z" fill="#ffd54a" /><circle cx="122" cy="38" r="12" fill="#ffd54a" /><path d="M132 37 L146 39 L133 44 Z" fill="#f4973b" /><circle cx="125" cy="35" r="2" fill={ink} stroke="none" /></g>;
  if (prop === "party-hat") return <g stroke={ink} strokeWidth="4" strokeLinejoin="round"><path d="M88 80 L116 18 L138 84 Z" fill="#8fd3f0" /><g fill="#f48fb1" stroke="none"><circle cx="106" cy="62" r="5" /><circle cx="122" cy="48" r="4" /><circle cx="124" cy="72" r="5" /></g><circle cx="116" cy="18" r="8" fill="#ffd166" /></g>;
  if (prop === "leaf-umbrella") return <g stroke={ink} strokeWidth="3.5" strokeLinejoin="round"><path d="M36 196 Q28 120 44 66" fill="none" stroke="#7a5a3c" strokeWidth="5" /><path d="M4 80 Q44 18 96 70 Q48 58 4 80 Z" fill="#6fbf73" /><path d="M10 76 Q46 50 90 68" fill="none" strokeWidth="2" /></g>;
  if (prop === "pencil-ear") return <g transform="rotate(-32 160 84)" stroke={ink} strokeWidth="3" strokeLinejoin="round"><rect x="132" y="78" width="54" height="12" fill="#f7c948" /><path d="M186 78 L202 84 L186 90 Z" fill="#f3d9b1" /><path d="M197 82 L202 84 L197 86 Z" fill={ink} /><rect x="122" y="78" width="10" height="12" rx="2" fill="#f48fb1" /></g>;
  if (prop === "laptop") return <g stroke={ink} strokeWidth="4" strokeLinejoin="round"><rect x="70" y="178" width="80" height="50" rx="5" fill="#c9ced6" /><text x="110" y="209" textAnchor="middle" fontSize="15" fontWeight="900" fill="#5fa9c9" stroke="none" fontFamily="ui-monospace, monospace">{"</>"}</text><path d="M58 228 H162 L168 238 H52 Z" fill="#a9b0bb" /></g>;
  if (prop === "tiny-cat") return <g stroke={ink} strokeWidth="3" strokeLinejoin="round"><path d="M128 64 Q146 58 142 44" fill="none" stroke="#f2a65a" strokeWidth="5" strokeLinecap="round" /><ellipse cx="110" cy="64" rx="22" ry="13" fill="#f2b98a" /><path d="M98 34 L100 18 L108 28 Z M122 34 L120 18 L112 28 Z" fill="#f2b98a" /><circle cx="110" cy="38" r="14" fill="#f2b98a" /><g fill={ink} stroke="none"><circle cx="105" cy="37" r="2" /><circle cx="115" cy="37" r="2" /></g><path d="M107 43 Q110 46 113 43" fill="none" strokeWidth="2" /></g>;
  if (prop === "wizard-hat") return <g stroke={ink} strokeWidth="4" strokeLinejoin="round"><path d="M76 86 Q100 50 108 8 Q122 30 146 86 Z" fill="#6a5acd" /><ellipse cx="110" cy="86" rx="60" ry="11" fill="#5b4b9a" /><path d={starPath(104, 50, 8)} fill="#ffe066" strokeWidth="2" /><path d={starPath(124, 70, 6)} fill="#ffe066" strokeWidth="2" /></g>;
  if (prop === "bubble-tea-hat") return <g stroke={ink} strokeWidth="3.5" strokeLinejoin="round"><path d="M104 36 L112 4" fill="none" stroke="#f48fb1" strokeWidth="7" /><path d="M84 84 H136 L130 34 H90 Z" fill="#e9cfae" /><g fill="#3b2a26" stroke="none">{[[96, 76], [106, 72], [116, 77], [126, 73], [101, 66], [121, 65]].map(([x, y]) => <circle key={`${x}-${y}`} cx={x} cy={y} r="4" />)}</g><path d="M86 36 Q110 18 134 36 Z" fill="#fffaf0" fillOpacity=".85" /></g>;
  if (prop === "coffee-drip-hat") return <g stroke={ink} strokeWidth="3.5" strokeLinejoin="round"><path d="M136 58 Q156 58 154 72 Q152 84 138 80" fill="none" strokeWidth="5" /><path d="M80 88 L84 38 H136 L140 88 Z" fill="#fffaf0" /><path d="M84 88 Q84 104 90 108 Q96 104 94 88 Z M120 88 Q120 114 127 118 Q134 112 130 88 Z M102 88 Q103 98 107 100 Q111 96 110 88 Z" fill="#7a4a2e" strokeWidth="2" /><path d="M78 86 H142 V92 H78 Z" fill="#7a4a2e" /></g>;
  if (prop === "star-wand") return <g stroke={ink} strokeWidth="3.5" strokeLinejoin="round"><path d="M182 202 L200 142" fill="none" stroke="#f5c451" strokeWidth="6" strokeLinecap="round" /><path d={starPath(202, 130, 18)} fill="#ffe066" /><g fill="#fff6c8" stroke="none"><path d={starPath(180, 108, 6)} /><path d={starPath(214, 104, 4)} /></g></g>;
  if (prop === "angel-wings") return <g stroke={ink} strokeWidth="3.5" strokeLinejoin="round" fill="#fffaf0"><path d="M42 128 Q8 100 2 128 Q12 136 6 148 Q18 154 14 166 Q32 168 44 152 Z" /><path d="M178 128 Q212 100 218 128 Q208 136 214 148 Q202 154 206 166 Q188 168 176 152 Z" /></g>;
  if (prop === "golden-keyboard") return <g stroke={ink} strokeWidth="4" strokeLinejoin="round"><rect x="48" y="202" width="124" height="32" rx="6" fill="#f5c451" /><g fill="#fff1b8" stroke="none">{Array.from({ length: 16 }, (_, i) => <rect key={i} x={56 + (i % 8) * 14.2} y={208 + Math.floor(i / 8) * 11} width="11" height="8" rx="2" />)}</g><path d="M60 206 L76 206" stroke="#fffaf0" strokeWidth="3" /></g>;
  if (prop === "tiny-crown") return <g stroke={ink} strokeWidth="4" strokeLinejoin="round"><path d="M75 83 L72 45 L91 60 L110 35 L129 60 L148 45 L145 83 Z" fill="#f5c451" /><path d="M77 72 H143" fill="none" /><circle cx="110" cy="59" r="5" fill="#f48670" strokeWidth="2" /></g>;
  return null;
}

export function BaroCharacterArt({ dna, id, growth, prop, armsFront = false }: { dna: CharacterDNA; id: string; growth?: CharacterGrowthSnapshot; prop?: string; armsFront?: boolean }) {
  const color = characterPalette(dna);
  const shape = bodyPaths[dna.body] ?? bodyPaths.pebble;
  const clipId = `baro-body-${id.replace(/[^a-zA-Z0-9]/g, "")}`;
  const arms = <>
    <path data-part="arm-left" className="baro-part baro-arm-left" d="M55 155 Q23 173 35 199 Q46 206 59 181" fill={color.body} stroke={ink} strokeWidth="5" />
    <path data-part="arm-right" className="baro-part baro-arm-right" d="M165 155 Q197 173 185 199 Q174 206 161 181" fill={color.body} stroke={ink} strokeWidth="5" />
  </>;
  const scale = [0.88, 0.94, 1, 1.05][growth?.form_index ?? 0] ?? 0.88;
  return <svg viewBox="0 0 220 280" role="img" aria-label={`Baro Character ${dna.palette} ${dna.pattern}`} data-character-prop={prop ?? ""} className="h-full w-full overflow-visible">
    <defs><clipPath id={clipId}><path d={shape} /></clipPath></defs>
    <ellipse cx="110" cy="256" rx="69" ry="10" fill={ink} opacity=".16" />
    <g className="baro-character-buddy" transform={`translate(110 155) scale(${scale}) translate(-110 -155)`}>
      <path data-part="leg-left" className="baro-part baro-leg-left" d="M72 213 Q58 245 68 247 Q86 253 91 222" fill={color.shade} stroke={ink} strokeWidth="5" />
      <path data-part="leg-right" className="baro-part baro-leg-right" d="M148 213 Q162 245 152 247 Q134 253 129 222" fill={color.shade} stroke={ink} strokeWidth="5" />
      <g data-part="torso" className="baro-part baro-torso">
      <Ears dna={dna} color={color} />
      {!armsFront && arms}
      <path d={shape} fill={color.body} stroke={ink} strokeWidth="5" strokeLinejoin="round" />
      <g clipPath={`url(#${clipId})`}><Pattern dna={dna} color={color} uid={clipId} /></g>
      <path d="M57 184 Q70 216 107 219" fill="none" stroke={color.shade} strokeWidth="9" opacity=".35" strokeLinecap="round" />
      <path d="M61 113 Q74 83 104 82" fill="none" stroke="#fffaf0" strokeWidth="6" opacity=".38" strokeLinecap="round" />
      <Mark kind={dna.mark} fill={color.accent} />
      <circle cx="58" cy="162" r="8" fill={color.accent} opacity=".6" /><circle cx="162" cy="162" r="8" fill={color.accent} opacity=".6" />
      <Eyes kind={dna.eyes} />
      {armsFront && arms}
      <path data-part="mouth" className="baro-part baro-mouth" d="M101 161 Q110 170 119 161" fill="none" stroke={ink} strokeWidth="4" strokeLinecap="round" />
      {dna.pattern === "egg" && <g><path d="M148 96 Q153 72 165 58" fill="none" stroke="#7e6c79" strokeWidth="4" /><path d="M150 49 Q157 39 167 44 Q180 37 186 48 Q192 58 181 64 Q176 75 165 69 Q151 72 149 62 Q142 57 150 49 Z" fill="#fffaf0" stroke={ink} strokeWidth="3" /><circle cx="167" cy="56" r="9" fill="#f5bd4f" /></g>}
      <g data-part="prop"><CharacterProp prop={prop} /></g>
      </g>
    </g>
    {growth && <g fill="#fffaf0" opacity=".95">{Array.from({ length: Math.min(growth.detail_index, 10) }, (_, i) => {
      const x = i % 2 === 0 ? 24 + Math.floor(i / 2) * 7 : 193 - Math.floor(i / 2) * 7;
      const y = 70 + Math.floor(i / 2) * 35;
      return <path key={i} d={`M${x} ${y - 5} l2 4 4 1 -4 2 -2 4 -2 -4 -4 -2 4 -1Z`} />;
    })}</g>}
    {growth?.mood === "resting" && <text x="175" y="48" fill={ink} fontSize="18" fontWeight="900">zZ</text>}
  </svg>;
}
