const ON = [
  "Your Wi-Fi didn't let you down today.",
  "TA Ploy is proud of you.",
  "Your coffee worked.",
  "Bug count today: 0 so far.",
  "มาแล้วจ้า. On time, as usual.",
  "Your keyboard says good morning.",
];
const LATE = [
  "Late, but you made it. That counts for something.",
  "Traffic wins this round.",
  "Tomorrow you win.",
  "The alarm clock has been notified.",
  "มาสายนิดนึง. Still counts.",
];

export function pickLine(late: boolean, seed: number): string {
  const list = late ? LATE : ON;
  return list[Math.abs(seed) % list.length];
}
