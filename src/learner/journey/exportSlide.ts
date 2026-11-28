import { toPng } from "html-to-image";

const skip = (n: HTMLElement) => !(n instanceof HTMLElement && n.dataset?.noCapture !== undefined);
const OPTIONS = { pixelRatio: 3, filter: skip, cacheBust: true, skipFonts: true };
const isIOS = () => /iP(hone|ad|od)/.test(navigator.userAgent);

/** A PNG data URL of the slide. iOS Safari often drops images or fonts on the first pass, so it captures twice there. */
async function capture(node: HTMLElement) {
  if (isIOS()) await toPng(node, OPTIONS);
  return toPng(node, OPTIONS);
}

/** Start capturing as soon as a slide shows, so a later tap can share before Safari's user-gesture window closes. */
export function preparePng(node: HTMLElement): Promise<string> {
  const p = capture(node);
  p.catch(() => undefined);
  return p;
}

export async function savePng(node: HTMLElement, name: string, ready?: Promise<string> | null) {
  const a = document.createElement("a");
  a.href = await (ready ?? capture(node));
  a.download = name;
  a.click();
}

export async function sharePng(node: HTMLElement, name: string, ready?: Promise<string> | null) {
  const blob = await (await fetch(await (ready ?? capture(node)))).blob();
  await navigator.share({ files: [new File([blob], name, { type: "image/png" })] });
}

export function canShareFiles() {
  try {
    return typeof navigator.canShare === "function" && navigator.canShare({ files: [new File([""], "x.png", { type: "image/png" })] });
  } catch {
    return false;
  }
}
