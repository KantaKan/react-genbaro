import { describe, expect, it } from "vitest";
import { unansweredQuestions } from "./reflection-answers";

describe("unansweredQuestions", () => {
  it("lists the questions still empty, in order", () => {
    expect(unansweredQuestions({ "tech-happy": "a", "tech-improve": " ", "non-tech-happy": "" })).toEqual(["Tech · to improve", "Non-tech · went well", "Non-tech · to improve"]);
  });
  it("is empty when all four are written", () => {
    expect(unansweredQuestions({ "tech-happy": "a", "tech-improve": "b", "non-tech-happy": "c", "non-tech-improve": "d" })).toEqual([]);
  });
});
