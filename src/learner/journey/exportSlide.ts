import { toPng } from "html-to-image";

const skip = (n: HTMLElement) => !(n instanceof HTMLElement && n.dataset?.noCapture !== undefined);

async function png(node: HTMLElement) {
  // Thai glyphs come from web fonts; capture before they load and the image falls back to a system font.
  await document.fonts?.ready;
  return toPng(node, { pixelRatio: 3, filter: skip, cacheBust: true });
}

export async function savePng(node: HTMLElement, name: string) {
  const a = document.createElement("a");
  a.href = await png(node);
  a.download = name;
  a.click();
}

export async function sharePng(node: HTMLElement, name: string) {
  const blob = await (await fetch(await png(node))).blob();
  await navigator.share({ files: [new File([blob], name, { type: "image/png" })] });
}

export function canShareFiles() {
  try {
    return typeof navigator.canShare === "function" && navigator.canShare({ files: [new File([""], "x.png", { type: "image/png" })] });
  } catch {
    return false;
  }
}
