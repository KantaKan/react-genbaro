export interface BoardReaction {
  id: string;
  userId: string;
  type: "emoji" | "image";
  value: string;
}

export interface BoardComment {
  id: string;
  userId: string;
  zoomName: string;
  cohort: number;
  content: string;
  reactions: BoardReaction[];
  createdAt: string;
}

export interface BoardPost {
  id: string;
  userId: string;
  zoomName: string;
  cohort: number;
  content: string;
  reactions: BoardReaction[];
  comments: BoardComment[];
  createdAt: string;
}

export const BOARD_REACTIONS = [
  { name: "peepolike", url: "/reaction/peepoLIKE-2x.webp" },
  { name: "pepelaugh", url: "/reaction/PepeLaugh-2x.webp" },
  { name: "sadge", url: "/reaction/Sadge-2x.png" },
  { name: "peepoheart", url: "/reaction/peepoHeart-2x.webp" },
] as const;

export const BOARD_REACTION_URLS = BOARD_REACTIONS.reduce<Record<string, string>>((acc, reaction) => {
  acc[reaction.name] = reaction.url;
  return acc;
}, {});

export const getBoardReactionCounts = (reactions: BoardReaction[] = []): Record<string, number> => {
  return reactions.reduce((acc, reaction) => {
    acc[reaction.value] = (acc[reaction.value] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
};

interface BoardUserSource {
  _id?: string;
  userId?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  zoom_name?: string;
  zoomName?: string;
  cohort_number?: number | string;
  cohort?: number | string;
}

const toNumber = (value: number | string | undefined): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const getBoardUserPayload = (userData: BoardUserSource | null | undefined) => {
  const zoomName = userData?.zoom_name || userData?.zoomName || userData?.first_name || "Unknown";
  const cohort = toNumber(userData?.cohort_number ?? userData?.cohort);

  return {
    userId: userData?._id || userData?.userId,
    zoomName,
    cohort,
    firstName: userData?.first_name,
    lastName: userData?.last_name,
    email: userData?.email,
  };
};
