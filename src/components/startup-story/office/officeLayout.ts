import type { StartupDev } from "@/application/services/startupStoryService";

export const ROOM_W = 360;
export const ROOM_H = 236;

export type StationKind = "desk" | "sticky" | "kanban" | "whiteboard" | "rack";
export type Spot = { x: number; y: number; seated: boolean };
export type Station = { id: string; kind: StationKind; spot: Spot };

const DESK_ROWS = [166, 220];
const DESK_COLS = [44, 116, 188];

export const deskFronts = DESK_ROWS.flatMap((y) => DESK_COLS.map((x) => ({ x, y })));

export const stations: Station[] = [
  { id: "sticky", kind: "sticky", spot: { x: 34, y: 92, seated: false } },
  { id: "kanban", kind: "kanban", spot: { x: 98, y: 92, seated: false } },
  { id: "whiteboard", kind: "whiteboard", spot: { x: 206, y: 92, seated: false } },
  { id: "rack", kind: "rack", spot: { x: 294, y: 94, seated: false } },
  ...deskFronts.map((d, i) => ({ id: `desk-${i + 1}`, kind: "desk" as const, spot: { x: d.x, y: d.y - 4, seated: true } })),
];

const preferred: Record<string, StationKind> = { po: "sticky", pm: "kanban", sa: "whiteboard", devops: "rack" };

export function assignStations(staff: StartupDev[]): Map<string, Station> {
  const free = [...stations];
  const take = (pred: (s: Station) => boolean) => {
    const i = free.findIndex(pred);
    return i < 0 ? undefined : free.splice(i, 1)[0];
  };
  const placed = new Map<string, Station>();
  for (const dev of staff) {
    const want = preferred[dev.role ?? ""];
    const station = (want && take((s) => s.kind === want)) || take((s) => s.kind === "desk") || take(() => true);
    if (station) placed.set(dev.id, station);
  }
  return placed;
}

export const TABLE = { x: 290, y: 164 };

export function standupSpots(count: number): Spot[] {
  return Array.from({ length: count }, (_, i) => {
    const angle = (Math.PI * 2 * i) / Math.max(count, 1) - Math.PI / 2;
    return { x: Math.round(TABLE.x + Math.cos(angle) * 46), y: Math.round(TABLE.y + 10 + Math.sin(angle) * 30), seated: false };
  });
}

export const hangoutSpots: Spot[] = [
  { x: 322, y: 104, seated: false },
  { x: 336, y: 216, seated: false },
  { x: 312, y: 222, seated: false },
  { x: 250, y: 116, seated: false },
];

export function levelUps(previous: Map<string, number>, staff: StartupDev[]): string[] {
  return staff.filter((d) => previous.has(d.id) && (d.level ?? 1) > (previous.get(d.id) ?? 1)).map((d) => d.id);
}

export const TIRED_AT = 80;
