export function deterministicRotation(stampId: string, range: number = 8): number {
  let hash = 0;
  for (let i = 0; i < stampId.length; i += 1) {
    hash = (hash * 31 + stampId.charCodeAt(i)) >>> 0;
  }
  return (hash % (range * 2 + 1)) - range;
}

export function deterministicOffset(stampId: string, range: number = 6): number {
  let hash = 0;
  for (let i = 0; i < stampId.length; i += 1) {
    hash = (hash * 33 + stampId.charCodeAt(i)) >>> 0;
  }
  return (hash % (range * 2 + 1)) - range;
}
