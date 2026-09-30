export type YardSceneId = "backyard" | "engawa" | "island";
export type SpotKind = "table" | "bench" | "tree" | "blanket" | "play" | "path";
export type YardPose = "sit" | "eat" | "read" | "doze" | "walk" | "wave" | "smile" | "handhold" | "rps" | "pillow" | "chase" | "kick";
export type CatSpotKind = "beg" | "loaf" | "chase";

export interface YardSpot {
  id: string;
  kind: SpotKind;
  x: number;
  y: number;
  facing: "left" | "right";
  neighbours: string[];
}

export interface CatSpot {
  id: string;
  kind: CatSpotKind;
  x: number;
  y: number;
}

export interface YardScene {
  id: YardSceneId;
  name: string;
  width: number;
  height: number;
  depthScale: [number, number];
  placeLabels: Record<SpotKind, string>;
  spots: YardSpot[];
  catSpots: CatSpot[];
}

export const SPOT_KINDS: ReadonlyArray<SpotKind> = ["table", "bench", "tree", "blanket", "play", "path"];

export const SPOT_POSES: Record<SpotKind, { solo: YardPose[]; pair: YardPose[]; night: YardPose[] }> = {
  table: { solo: ["eat", "sit"], pair: ["eat", "rps", "smile"], night: [] },
  bench: { solo: ["sit", "read"], pair: ["smile", "handhold", "wave"], night: ["doze"] },
  tree: { solo: ["doze", "read"], pair: [], night: ["doze"] },
  blanket: { solo: ["sit", "eat", "doze"], pair: ["smile", "wave", "eat"], night: ["doze"] },
  play: { solo: ["kick"], pair: ["pillow", "chase", "kick"], night: [] },
  path: { solo: ["walk"], pair: [], night: [] },
};

export const POSE_VERBS: Record<YardPose, string> = {
  sit: "นั่งพัก", eat: "กินข้าว", read: "อ่านหนังสือ", doze: "งีบหลับ", walk: "เดินเล่น", wave: "โบกมือทักกัน",
  smile: "นั่งคุยกัน", handhold: "จับมือกัน", rps: "เป่ายิ้งฉุบกัน", pillow: "ตีหมอนกันขำ ๆ", chase: "วิ่งไล่กัน", kick: "เตะบอล",
};

const places: Record<SpotKind, string> = { table: "โต๊ะปิกนิก", bench: "ม้านั่ง", tree: "ใต้ต้นไม้", blanket: "ผ้าปูปิกนิก", play: "ลานเล่น", path: "ทางเดินหิน" };

function spot(id: string, kind: SpotKind, x: number, y: number, facing: "left" | "right", neighbours: string[] = []): YardSpot {
  return { id, kind, x, y, facing, neighbours };
}

export const YARD_SCENES: Record<YardSceneId, YardScene> = {
  backyard: {
    id: "backyard", name: "สวนหลังบ้าน", width: 1000, height: 520, depthScale: [0.72, 0.62], placeLabels: places,
    spots: [
      spot("t1", "table", 262, 262, "right", ["t2"]), spot("t2", "table", 322, 258, "left", ["t1", "t3"]), spot("t3", "table", 382, 262, "left", ["t2"]),
      spot("b1", "bench", 668, 336, "right", ["b2"]), spot("b2", "bench", 734, 336, "left", ["b1"]),
      spot("tr1", "tree", 900, 318, "left"),
      spot("bl1", "blanket", 468, 432, "right", ["bl2"]), spot("bl2", "blanket", 548, 440, "left", ["bl1"]),
      spot("p1", "play", 790, 474, "right", ["p2"]), spot("p2", "play", 880, 470, "left", ["p1"]),
      spot("w1", "path", 190, 452, "right"), spot("w2", "path", 628, 236, "left"),
    ],
    catSpots: [{ id: "beg", kind: "beg", x: 200, y: 312 }, { id: "loaf1", kind: "loaf", x: 612, y: 472 }, { id: "loaf2", kind: "loaf", x: 968, y: 346 }, { id: "chase", kind: "chase", x: 836, y: 492 }],
  },
  engawa: {
    id: "engawa", name: "ระเบียงบ้าน", width: 1000, height: 560, depthScale: [0.62, 0.7], placeLabels: { ...places, blanket: "ระเบียงบ้าน" },
    spots: [
      spot("pr1", "blanket", 250, 478, "right", ["pr2"]), spot("pr2", "blanket", 330, 478, "left", ["pr1"]),
      spot("pr3", "blanket", 560, 478, "right", ["pr4"]), spot("pr4", "blanket", 650, 478, "left", ["pr3"]),
      spot("t1", "table", 290, 286, "right", ["t2"]), spot("t2", "table", 360, 286, "left", ["t1"]),
      spot("b1", "bench", 790, 308, "right", ["b2"]), spot("b2", "bench", 852, 308, "left", ["b1"]),
      spot("tr1", "tree", 190, 312, "right"),
      spot("p1", "play", 590, 262, "right", ["p2"]), spot("p2", "play", 660, 258, "left", ["p1"]),
      spot("w1", "path", 470, 344, "right"),
    ],
    catSpots: [{ id: "beg", kind: "beg", x: 236, y: 312 }, { id: "loaf1", kind: "loaf", x: 860, y: 436 }, { id: "loaf2", kind: "loaf", x: 430, y: 470 }, { id: "chase", kind: "chase", x: 624, y: 276 }],
  },
  island: {
    id: "island", name: "เกาะลอยฟ้า", width: 1000, height: 720, depthScale: [0.66, 0.6], placeLabels: places,
    spots: [
      spot("t1", "table", 250, 398, "right", ["t2"]), spot("t2", "table", 320, 396, "left", ["t1"]),
      spot("b1", "bench", 690, 428, "right", ["b2"]), spot("b2", "bench", 752, 428, "left", ["b1"]),
      spot("tr1", "tree", 440, 356, "right"), spot("tr2", "tree", 560, 352, "left"),
      spot("bl1", "blanket", 470, 530, "right", ["bl2"]), spot("bl2", "blanket", 540, 534, "left", ["bl1"]),
      spot("p1", "play", 750, 540, "right", ["p2"]), spot("p2", "play", 820, 532, "left", ["p1"]),
      spot("w1", "path", 360, 590, "right"), spot("w2", "path", 640, 590, "left"),
    ],
    catSpots: [{ id: "beg", kind: "beg", x: 206, y: 440 }, { id: "loaf1", kind: "loaf", x: 626, y: 470 }, { id: "loaf2", kind: "loaf", x: 868, y: 470 }, { id: "chase", kind: "chase", x: 786, y: 560 }],
  },
};

export const YARD_SCENE_IDS = Object.keys(YARD_SCENES) as YardSceneId[];
export const DEFAULT_YARD_SCENE: YardSceneId = "backyard";

export function isYardSceneId(value: unknown): value is YardSceneId {
  return typeof value === "string" && value in YARD_SCENES;
}

export function sceneScale(scene: YardScene, y: number) {
  return scene.depthScale[0] + scene.depthScale[1] * (y / scene.height);
}
