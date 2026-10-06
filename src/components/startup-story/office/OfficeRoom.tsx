import { ROOM_H, ROOM_W, TABLE } from "./officeLayout";

const INK = "#292542";

export function RoomBackdrop({ busyKinds, skin }: { busyKinds: Set<string>; skin?: string }) {
  const rooftop = skin === "rooftop-bangkok";
  const wall = rooftop ? "#f7c6a3" : "#f4e3c3";
  const busy = (kind: string) => busyKinds.has(kind);
  return <g>
    <defs>
      <pattern id="ss-floor" width="24" height="24" patternUnits="userSpaceOnUse">
        <rect width="24" height="24" fill="#e6c595" />
        <rect width="12" height="12" fill="#dcb683" />
        <rect x="12" y="12" width="12" height="12" fill="#dcb683" />
      </pattern>
    </defs>
    <rect width={ROOM_W} height="76" fill={wall} />
    <rect y="54" width={ROOM_W} height="16" fill={rooftop ? "#eab38f" : "#ead3ac"} />
    <rect y="70" width={ROOM_W} height="6" fill="#b98b5e" />
    <rect y="76" width={ROOM_W} height={ROOM_H - 76} fill="url(#ss-floor)" />
    <rect y="76" width={ROOM_W} height="5" fill={INK} opacity="0.08" />

    <rect x="16" y="14" width="38" height="42" fill="#e9d6b3" stroke={INK} />
    {([["#fbe39a", 0, 0], ["#f7c6d9", 12, 3], ["#bfe3f7", 24, 0], ["#7bc4a8", 5, 15], ["#fbe39a", 18, 16], ["#cab2f1", 9, 28]] as const).map(([c, dx, dy], i) =>
      <rect key={i} x={19 + dx} y={17 + dy} width="9" height="9" fill={c} className={busy("sticky") && i === 5 ? "ss-pop" : ""} style={{ transformBox: "fill-box", transformOrigin: "center" }} />)}

    <rect x="70" y="12" width="56" height="44" fill="#fffaf0" stroke={INK} />
    {[0, 18, 36].map((dx) => <rect key={dx} x={72 + dx} y="14" width="16" height="4" fill={INK} opacity="0.18" />)}
    <rect x="74" y="22" width="12" height="7" fill="#f7c6d9" />
    <rect x="74" y="32" width="12" height="7" fill="#fbe39a" />
    <rect x="92" y="22" width="12" height="7" fill="#bfe3f7" className={busy("kanban") ? "ss-slide" : ""} />
    <rect x="110" y="22" width="12" height="7" fill="#7bc4a8" />
    <rect x="110" y="32" width="12" height="7" fill="#7bc4a8" />

    <rect x="136" y="10" width="34" height="34" fill={rooftop ? "#f08a5d" : "#9fd3f0"} stroke={INK} />
    {([[138, 26, 6, 18], [145, 20, 5, 24], [151, 29, 7, 15], [159, 17, 4, 27], [164, 24, 5, 20]] as const).map(([x, y, w, h]) => <rect key={x} x={x} y={y} width={w} height={h} fill="#6b6f8e" />)}
    <rect x="152" y="10" width="2" height="34" fill={INK} opacity="0.4" />

    <rect x="182" y="12" width="52" height="38" fill="#ffffff" stroke={INK} />
    <rect x="188" y="17" width="11" height="8" fill="none" stroke="#2d9cdb" />
    <rect x="215" y="17" width="11" height="8" fill="none" stroke="#2d9cdb" />
    <rect x="201" y="34" width="11" height="8" fill="none" stroke="#e3683e" />
    <path d="M199 21 H215 M206 25 V34" stroke={INK} strokeWidth="1" fill="none" className={busy("whiteboard") ? "ss-draw-line" : ""} />
    <rect x="186" y="50" width="44" height="3" fill="#8a8aa0" />

    <rect x="258" y="22" width="24" height="68" fill="#3b3a55" stroke={INK} />
    {[0, 12, 24, 36, 48].map((dy, i) => <g key={dy}>
      <rect x="261" y={27 + dy} width="18" height="8" fill={INK} />
      <rect x="274" y={30 + dy} width="3" height="3" fill={i % 2 ? "#7bc4a8" : "#fbe39a"} className={busy("rack") ? `ss-led ss-led-${i % 4}` : ""} />
    </g>)}

    <rect x="318" y="58" width="40" height="34" fill="#b98b5e" stroke={INK} />
    <rect x="324" y="38" width="16" height="22" fill="#3b3a55" />
    <rect x="327" y="42" width="10" height="7" fill="#e3683e" />
    <rect x="344" y="50" width="7" height="8" fill="#fffaf0" stroke={INK} strokeWidth="0.6" />
    <text x="332" y="57" fontSize="7" textAnchor="middle">☕</text>

    <rect x="6" y="80" width="14" height="14" fill="#b98b5e" stroke={INK} strokeWidth="0.8" />
    <text x="13" y="82" fontSize="16" textAnchor="middle">🪴</text>
    <rect x="240" y="18" width="12" height="16" fill="#fffaf0" stroke={INK} strokeWidth="0.8" />
    <text x="246" y="30" fontSize="8" textAnchor="middle">🚀</text>
  </g>;
}

export function Desk({ x, y, busy }: { x: number; y: number; busy: boolean }) {
  return <g>
    <rect x={x - 27} y={y - 22} width="54" height="11" fill="#c8955f" stroke={INK} strokeWidth="0.8" />
    <rect x={x - 27} y={y - 11} width="54" height="11" fill="#a7743f" stroke={INK} strokeWidth="0.8" />
    <rect x={x - 9} y={y - 31} width="18" height="10" fill="#3b3a55" stroke={INK} strokeWidth="0.8" />
    <rect x={x - 9} y={y - 22} width="18" height="2" fill="#6b6f8e" />
    <rect x={x - 2} y={y - 28} width="4" height="4" fill={busy ? "#7bc4a8" : "#8a8aa0"} className={busy ? "ss-screen" : ""} />
    <rect x={x + 15} y={y - 21} width="5" height="6" fill="#fffaf0" stroke={INK} strokeWidth="0.6" />
  </g>;
}

export function MeetingTable() {
  return <g>
    <rect x={TABLE.x - 3} y={TABLE.y} width="6" height="12" fill="#8a6440" />
    <ellipse cx={TABLE.x} cy={TABLE.y} rx="28" ry="12" fill="#fffaf0" stroke={INK} />
    <ellipse cx={TABLE.x} cy={TABLE.y - 1} rx="20" ry="7" fill="#f4e3c3" />
    <text x={TABLE.x} y={TABLE.y + 3} fontSize="8" textAnchor="middle">📋</text>
  </g>;
}

export function Sofa() {
  return <g>
    <rect x="300" y="200" width="56" height="18" rx="4" fill="#7b5ea7" stroke={INK} />
    <rect x="296" y="210" width="64" height="16" rx="4" fill="#9476c4" stroke={INK} />
  </g>;
}
