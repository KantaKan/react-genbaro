export interface Badge {
  _id?: string;
  type: string;
  name: string;
  emoji: string;
  imageUrl?: string;
  color?: string;
  style?: "pixel" | "rounded" | "minimal" | "image";
  awardedAt: string;
}

export interface BadgeAwardPayload {
  type: string;
  name: string;
  emoji: string;
  imageUrl?: string;
  color?: string;
  style?: "pixel" | "rounded" | "minimal" | "image";
}

export interface AwardBadgeResponse {
  success: boolean;
  message: string;
  data: Badge;
}
