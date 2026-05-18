export type QuizDim = "EI" | "SN" | "TF" | "JP";
export type PoleLetter = "E" | "I" | "S" | "N" | "T" | "F" | "J" | "P";

export type QuizItem = {
  id: string;
  dim: QuizDim;
  prompt: string;
  aLetter: PoleLetter;
  bLetter: PoleLetter;
  aText: string;
  bText: string;
};

export type QuizChoice = "a" | "b";
export type AnswersMap = Partial<Record<string, QuizChoice>>;
