const DEFAULT_AVATAR_SEED = "unknown-user";

export const getUserAvatarSeed = (...seedParts: Array<string | number | null | undefined>): string =>
  seedParts
    .map((part) => (part === null || part === undefined ? "" : String(part).trim()))
    .find(Boolean) ?? DEFAULT_AVATAR_SEED;
