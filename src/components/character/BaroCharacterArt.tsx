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
};

function Ears({ dna, color }: { dna: CharacterDNA; color: typeof palettes.Mint }) {
  if (dna.ears === "none") return null;
  if (dna.ears === "round") return <g fill={color.body} stroke={ink} strokeWidth="5"><circle cx="66" cy="80" r="24" /><circle cx="154" cy="80" r="24" /></g>;
  if (dna.ears === "point" || dna.ears === "cat") return <g><path d="M55 107 Q48 80 58 41 Q75 48 93 87 Z M165 107 Q172 80 162 41 Q145 48 127 87 Z" fill={color.body} stroke={ink} strokeWidth="5" strokeLinejoin="round" />{dna.ears === "cat" && <path d="M65 81 Q64 65 66 58 Q78 64 83 81 Z M155 81 Q156 65 154 58 Q142 64 137 81 Z" fill={color.accent} />}</g>;
  if (dna.ears === "horn") return <path d="M65 94 L76 38 Q87 63 88 89 Z M155 94 L144 38 Q133 63 132 89 Z" fill={color.accent} stroke={ink} strokeWidth="5" />;
  if (dna.ears === "leaf") return <path d="M80 94 Q22 85 42 43 Q83 47 80 94 Z M140 94 Q198 85 178 43 Q137 47 140 94 Z" fill={color.shade} stroke={ink} strokeWidth="5" />;
  return <g><path d="M75 88 Q53 48 54 36 M145 88 Q167 48 166 36" fill="none" stroke={ink} strokeWidth="5" /><circle cx="54" cy="34" r="12" fill={color.accent} stroke={ink} strokeWidth="4" /><circle cx="166" cy="34" r="12" fill={color.accent} stroke={ink} strokeWidth="4" /></g>;
}

function Pattern({ dna, color }: { dna: CharacterDNA; color: typeof palettes.Mint }) {
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
    default: return null;
  }
}

function Eyes({ kind }: { kind: string }) {
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
  return null;
}

function CharacterProp({ prop }: { prop?: string }) {
  if (prop === "flower") return <g><path d="M128 90 Q136 65 157 55" fill="none" stroke="#57866c" strokeWidth="5" /><g fill="#fff1d5" stroke={ink} strokeWidth="2.5"><circle cx="155" cy="43" r="9" /><circle cx="170" cy="50" r="9" /><circle cx="166" cy="66" r="9" /><circle cx="150" cy="63" r="9" /></g><circle cx="160" cy="54" r="7" fill="#f2bb63" stroke={ink} strokeWidth="2" /></g>;
  if (prop === "cat-ears") return <g><path d="M53 99 L54 45 Q75 50 85 81 M135 81 Q145 50 166 45 L167 99" fill="#f4abc1" stroke={ink} strokeWidth="5" strokeLinejoin="round" /><path d="M55 92 Q108 60 165 92" fill="none" stroke="#f4abc1" strokeWidth="8" /></g>;
  if (prop === "egg") return <g><path d="M131 75 Q139 60 153 67 Q173 55 180 74 Q192 84 177 95 Q168 109 151 98 Q133 105 130 89 Q121 83 131 75 Z" fill="#fffaf0" stroke={ink} strokeWidth="3" /><circle cx="155" cy="83" r="12" fill="#f5bd4f" /></g>;
  if (prop === "halo") return <g><ellipse cx="110" cy="45" rx="43" ry="12" fill="none" stroke="#fff1a9" strokeWidth="9" /><ellipse cx="110" cy="45" rx="43" ry="12" fill="none" stroke={ink} strokeWidth="2" /></g>;
  if (prop === "headphones") return <g fill="none" stroke={ink} strokeLinecap="round"><path d="M51 139 Q49 57 110 57 Q171 57 169 139" strokeWidth="13" /><path d="M51 139 Q49 57 110 57 Q171 57 169 139" stroke="#5fa9c9" strokeWidth="7" /><rect x="39" y="126" width="25" height="45" rx="10" fill="#f4bd80" strokeWidth="4" /><rect x="156" y="126" width="25" height="45" rx="10" fill="#f4bd80" strokeWidth="4" /></g>;
  if (prop === "pixel-glasses") return <g stroke={ink} strokeWidth="5" strokeLinejoin="round"><path d="M62 125 H101 V151 H62 Z M119 125 H158 V151 H119 Z" fill="#9cd7e8" fillOpacity=".75" /><path d="M101 134 H119 M50 132 H62 M158 132 H170" fill="none" /></g>;
  if (prop === "tiny-crown") return <g stroke={ink} strokeWidth="4" strokeLinejoin="round"><path d="M75 83 L72 45 L91 60 L110 35 L129 60 L148 45 L145 83 Z" fill="#f5c451" /><path d="M77 72 H143" fill="none" /><circle cx="110" cy="59" r="5" fill="#f48670" strokeWidth="2" /></g>;
  return null;
}

export function BaroCharacterArt({ dna, id, growth, prop }: { dna: CharacterDNA; id: string; growth?: CharacterGrowthSnapshot; prop?: string }) {
  const color = characterPalette(dna);
  const shape = bodyPaths[dna.body] ?? bodyPaths.pebble;
  const clipId = `baro-body-${id.replace(/[^a-zA-Z0-9]/g, "")}`;
  const scale = [0.88, 0.94, 1, 1.05][growth?.form_index ?? 0] ?? 0.88;
  return <svg viewBox="0 0 220 280" role="img" aria-label={`Baro Character ${dna.palette} ${dna.pattern}`} data-character-prop={prop ?? ""} className="h-full w-full overflow-visible">
    <defs><clipPath id={clipId}><path d={shape} /></clipPath></defs>
    <ellipse cx="110" cy="256" rx="69" ry="10" fill={ink} opacity=".16" />
    <g className="baro-character-buddy" transform={`translate(110 155) scale(${scale}) translate(-110 -155)`}>
      <path data-part="leg-left" className="baro-part baro-leg-left" d="M72 213 Q58 245 68 247 Q86 253 91 222" fill={color.shade} stroke={ink} strokeWidth="5" />
      <path data-part="leg-right" className="baro-part baro-leg-right" d="M148 213 Q162 245 152 247 Q134 253 129 222" fill={color.shade} stroke={ink} strokeWidth="5" />
      <g data-part="torso" className="baro-part baro-torso">
      <Ears dna={dna} color={color} />
      <path data-part="arm-left" className="baro-part baro-arm-left" d="M55 155 Q23 173 35 199 Q46 206 59 181" fill={color.body} stroke={ink} strokeWidth="5" />
      <path data-part="arm-right" className="baro-part baro-arm-right" d="M165 155 Q197 173 185 199 Q174 206 161 181" fill={color.body} stroke={ink} strokeWidth="5" />
      <path d={shape} fill={color.body} stroke={ink} strokeWidth="5" strokeLinejoin="round" />
      <g clipPath={`url(#${clipId})`}><Pattern dna={dna} color={color} /></g>
      <path d="M57 184 Q70 216 107 219" fill="none" stroke={color.shade} strokeWidth="9" opacity=".35" strokeLinecap="round" />
      <path d="M61 113 Q74 83 104 82" fill="none" stroke="#fffaf0" strokeWidth="6" opacity=".38" strokeLinecap="round" />
      <Mark kind={dna.mark} fill={color.accent} />
      <circle cx="58" cy="162" r="8" fill={color.accent} opacity=".6" /><circle cx="162" cy="162" r="8" fill={color.accent} opacity=".6" />
      <Eyes kind={dna.eyes} />
      <path d="M101 161 Q110 170 119 161" fill="none" stroke={ink} strokeWidth="4" strokeLinecap="round" />
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
