import type { MbtiType } from "./constants";
import { MBTI_TYPES } from "./constants";

/** 每维 3 题，共 12 题；选 A 计 aLetter，选 B 计 bLetter（简化自陈量表，非官方 MBTI 产品） */
export const QUIZ_ITEMS = [
  {
    id: "ei1",
    dim: "EI" as const,
    prompt: "周末空闲时，你通常更想：",
    aLetter: "E" as const,
    bLetter: "I" as const,
    aText: "约朋友外出或参加聚会，从互动里充电",
    bText: "独处或小范围深聊，安静恢复精力",
  },
  {
    id: "ei2",
    dim: "EI" as const,
    prompt: "面对一群陌生人，你更常：",
    aLetter: "E" as const,
    bLetter: "I" as const,
    aText: "主动寒暄，很快能聊开",
    bText: "先观察环境，再选择性开口",
  },
  {
    id: "ei3",
    dim: "EI" as const,
    prompt: "连续几小时密集讨论后，你更可能：",
    aLetter: "E" as const,
    bLetter: "I" as const,
    aText: "仍觉得有劲头，还想继续交流",
    bText: "需要一个人待着缓一缓",
  },
  {
    id: "sn1",
    dim: "SN" as const,
    prompt: "学一项新技能时，你更在意：",
    aLetter: "S" as const,
    bLetter: "N" as const,
    aText: "可立刻照做的步骤、范例和细节",
    bText: "整体框架、原理和还能怎么扩展",
  },
  {
    id: "sn2",
    dim: "SN" as const,
    prompt: "回忆一件事时，你更容易先想到：",
    aLetter: "S" as const,
    bLetter: "N" as const,
    aText: "具体时间、场景和说过的话",
    bText: "当时的意味、联想和「大概感觉」",
  },
  {
    id: "sn3",
    dim: "SN" as const,
    prompt: "看一份说明文档时，你更偏好：",
    aLetter: "S" as const,
    bLetter: "N" as const,
    aText: "越细越好，按条目执行",
    bText: "先抓重点，细节需要再查",
  },
  {
    id: "tf1",
    dim: "TF" as const,
    prompt: "做一个影响他人的决定时，你更先考虑：",
    aLetter: "T" as const,
    bLetter: "F" as const,
    aText: "公平、逻辑与可预期后果",
    bText: "关系、感受与氛围是否可接受",
  },
  {
    id: "tf2",
    dim: "TF" as const,
    prompt: "朋友向你倾诉烦恼时，你更自然的反应是：",
    aLetter: "T" as const,
    bLetter: "F" as const,
    aText: "一起分析问题、给可行办法",
    bText: "先接住情绪，再一起看怎么办",
  },
  {
    id: "tf3",
    dim: "TF" as const,
    prompt: "被指出错误时，你更先在意：",
    aLetter: "T" as const,
    bLetter: "F" as const,
    aText: "对方说得是否在理、依据是什么",
    bText: "对方语气是否尊重、自己是否被理解",
  },
  {
    id: "jp1",
    dim: "JP" as const,
    prompt: "出门旅行前，你更倾向：",
    aLetter: "J" as const,
    bLetter: "P" as const,
    aText: "大致行程和时间点先排好",
    bText: "定大方向，细节到当地再定",
  },
  {
    id: "jp2",
    dim: "JP" as const,
    prompt: "面对有截止日的任务，你更常：",
    aLetter: "J" as const,
    bLetter: "P" as const,
    aText: "能早就早，留缓冲收尾",
    bText: "常在截止前集中爆发完成",
  },
  {
    id: "jp3",
    dim: "JP" as const,
    prompt: "对工作/生活空间的整洁度，你更接受：",
    aLetter: "J" as const,
    bLetter: "P" as const,
    aText: "物品各归其位，清单感更舒适",
    bText: "够用即可，接受「乱中有序」",
  },
] as const;

export type QuizChoice = "a" | "b";
export type AnswersMap = Partial<Record<(typeof QUIZ_ITEMS)[number]["id"], QuizChoice>>;

export function scoreMbtiFromAnswers(answers: Record<string, QuizChoice>): MbtiType {
  const tally: Record<"E" | "I" | "S" | "N" | "T" | "F" | "J" | "P", number> = {
    E: 0,
    I: 0,
    S: 0,
    N: 0,
    T: 0,
    F: 0,
    J: 0,
    P: 0,
  };
  for (const q of QUIZ_ITEMS) {
    const pick = answers[q.id];
    if (pick !== "a" && pick !== "b") {
      throw new Error(`题目 ${q.id} 未作答`);
    }
    const L = pick === "a" ? q.aLetter : q.bLetter;
    tally[L] += 1;
  }
  const ei = tally.E > tally.I ? "E" : "I";
  const sn = tally.S > tally.N ? "S" : "N";
  const tf = tally.T > tally.F ? "T" : "F";
  const jp = tally.J > tally.P ? "J" : "P";
  const code = `${ei}${sn}${tf}${jp}`;
  if (!MBTI_TYPES.includes(code as MbtiType)) {
    throw new Error("计分结果异常");
  }
  return code as MbtiType;
}

export function isQuizComplete(answers: AnswersMap): boolean {
  return QUIZ_ITEMS.every((q) => answers[q.id] === "a" || answers[q.id] === "b");
}
