const QUESTIONS: [string, string][] = [
  ["tech-happy", "Tech · went well"],
  ["tech-improve", "Tech · to improve"],
  ["non-tech-happy", "Non-tech · went well"],
  ["non-tech-improve", "Non-tech · to improve"],
];

/** The reflection questions still blank. A reflection needs all four. */
export function unansweredQuestions(inputs: Record<string, string>): string[] {
  return QUESTIONS.filter(([id]) => !(inputs[id] ?? "").trim()).map(([, label]) => label);
}
