type DeviceHints = Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };

export function isConstrainedDevice(nav: DeviceHints | undefined = typeof navigator === "undefined" ? undefined : navigator) {
  if (!nav) return false;
  return Boolean(nav.connection?.saveData) || (nav.deviceMemory ?? 8) <= 2 || (nav.hardwareConcurrency ?? 8) <= 2;
}

export function supportsCssAnimation() {
  const css = (globalThis as { CSS?: { supports?: (property: string, value: string) => boolean } }).CSS;
  return typeof css?.supports !== "function" || css.supports("animation-name", "baro-breathe");
}
