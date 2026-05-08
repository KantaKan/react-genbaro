const DICEBEAR_THUMBS_URL = "https://api.dicebear.com/9.x/thumbs/svg";
const DEFAULT_AVATAR_SEED = "unknown-user";

export const getUserAvatarUrl = (...seedParts: Array<string | number | null | undefined>): string => {
  const seed = seedParts
    .map((part) => (part === null || part === undefined ? "" : String(part).trim()))
    .find(Boolean) ?? DEFAULT_AVATAR_SEED;

  return `${DICEBEAR_THUMBS_URL}?seed=${encodeURIComponent(seed)}`;
};

export const getAvatarFallback = (...nameParts: Array<string | null | undefined>): string => {
  const initials = nameParts
    .map((part) => part?.trim().charAt(0).toUpperCase())
    .filter(Boolean)
    .slice(0, 2)
    .join("");

  return initials || "?";
};
