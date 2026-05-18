/** 统一导出：120 题完整版题库与计分 */
export {
  QUIZ_ITEMS,
  QUIZ_TOTAL,
  QUESTIONS_PER_PAGE,
  QUIZ_PAGE_COUNT,
  DIM_SECTIONS,
} from "./quiz/buildItems";
export {
  countAnswered,
  isQuizComplete,
  scoreMbtiFromAnswers,
  computeDimensionScores,
  formatScoreSummary,
  type DimensionScores,
} from "./quiz/scoring";
export type { QuizChoice, AnswersMap, QuizItem } from "./quiz/types";
