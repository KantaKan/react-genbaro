const THAI = /[฀-๿]+/;
const LATIN = /[A-Za-z][A-Za-z.'-]*/;

/**
 * Nicknames from a Zoom name like "03_Aphiradee(Black/แบล็ค)".
 * Falls back to the first name when there's nothing in parentheses.
 */
export function nicknames(zoomName: string | undefined, firstName: string): { en: string; th: string } {
  const inner = zoomName?.match(/\(([^)]*)\)/)?.[1] ?? "";
  const en = inner.match(LATIN)?.[0] ?? "";
  const th = inner.match(THAI)?.[0] ?? "";
  return { en: en || firstName, th };
}
