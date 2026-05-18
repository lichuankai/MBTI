import type { MbtiType } from "../constants";
import { MBTI_TYPES } from "../constants";
import type { AnswersMap, QuizChoice } from "./types";
import { QUIZ_ITEMS } from "./buildItems";

export type DimensionScores = {
  E: number;
  I: number;
  S: number;
  N: number;
  T: number;
  F: number;
  J: number;
  P: number;
};

export function countAnswered(answers: AnswersMap): number {
  return QUIZ_ITEMS.filter((q) => answers[q.id] === "a" || answers[q.id] === "b").length;
}

export function isQuizComplete(answers: AnswersMap): boolean {
  return countAnswered(answers) === QUIZ_ITEMS.length;
}

export function computeDimensionScores(answers: Record<string, QuizChoice>): DimensionScores {
  const tally: DimensionScores = { E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 };
  for (const q of QUIZ_ITEMS) {
    const pick = answers[q.id];
    if (pick !== "a" && pick !== "b") {
      throw new Error(`题目 ${q.id} 未作答`);
    }
    const L = pick === "a" ? q.aLetter : q.bLetter;
    tally[L] += 1;
  }
  return tally;
}

export function scoreMbtiFromAnswers(answers: Record<string, QuizChoice>): MbtiType {
  const tally = computeDimensionScores(answers);
  const ei = tally.E >= tally.I ? "E" : "I";
  const sn = tally.S >= tally.N ? "S" : "N";
  const tf = tally.T >= tally.F ? "T" : "F";
  const jp = tally.J >= tally.P ? "J" : "P";
  const code = `${ei}${sn}${tf}${jp}`;
  if (!MBTI_TYPES.includes(code as MbtiType)) {
    throw new Error("计分结果异常");
  }
  return code as MbtiType;
}

export function formatScoreSummary(tally: DimensionScores): string {
  return [
    `E ${tally.E} / I ${tally.I}（${tally.E === tally.I ? "持平" : tally.E > tally.I ? "偏 E" : "偏 I"}）`,
    `S ${tally.S} / N ${tally.N}（${tally.S === tally.N ? "持平" : tally.S > tally.N ? "偏 S" : "偏 N"}）`,
    `T ${tally.T} / F ${tally.F}（${tally.T === tally.F ? "持平" : tally.T > tally.F ? "偏 T" : "偏 F"}）`,
    `J ${tally.J} / P ${tally.P}（${tally.J === tally.P ? "持平" : tally.J > tally.P ? "偏 J" : "偏 P"}）`,
  ].join("\n");
}
