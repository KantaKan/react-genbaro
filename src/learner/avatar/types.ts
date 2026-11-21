export type DiceStyle = "notionists" | "lorelei" | "adventurer" | "fun-emoji" | "pixel-art" | "thumbs";
export type AvatarStyle = "blobatar" | DiceStyle;

export interface AvatarConfig {
  style: AvatarStyle;
  seed: string;
  /** 6-digit hex without '#', or "" */
  bg: string;
  /** options[style][part] = value, or null for "None" */
  options?: Record<string, Record<string, string | null>>;
}

export const DICE_STYLES: [DiceStyle, string][] = [
  ["notionists", "Sketch"],
  ["lorelei", "Lorelei"],
  ["adventurer", "Adventurer"],
  ["fun-emoji", "Emoji"],
  ["pixel-art", "Pixel"],
  ["thumbs", "Thumbs"],
];
