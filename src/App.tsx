import { useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import type { MbtiType } from "./constants";
import { MBTI_REPORT_SYSTEM_PROMPT } from "./prompts";
import {
  countAnswered,
  DIM_SECTIONS,
  isQuizComplete,
  QUESTIONS_PER_PAGE,
  QUIZ_ITEMS,
  QUIZ_PAGE_COUNT,
  QUIZ_TOTAL,
  type AnswersMap,
  type QuizChoice,
  computeDimensionScores,
  formatScoreSummary,
  scoreMbtiFromAnswers,
} from "./quizData";
import { callDeepSeekChat } from "./lib/callDeepSeek";
import "./App.css";

function buildUserPrompt(type: MbtiType, answers: Record<string, QuizChoice>, notes: string): string {
  const tally = computeDimensionScores(answers);
  const n = notes.trim();
  return `【计分得到的四字母类型】${type}
（由前端根据 ${QUIZ_TOTAL} 题完整版自陈量表 A/B 计数得出；你须在全文认可以此为唯一类型代码。）

【四维度得分】（每维各 30 题，选 A 计左侧字母、选 B 计右侧字母）
${formatScoreSummary(tally)}

【作答概况】已完成 ${QUIZ_TOTAL}/${QUIZ_TOTAL} 题。为控制篇幅，未逐条列出 120 题选项，请主要依据上述维度得分与类型代码撰写报告；若某维接近持平，可在报告中提示「倾向不极端」。

【可选补充说明】
${n || "无"}`;
}

function sectionForQuestionIndex(index: number): (typeof DIM_SECTIONS)[number] | undefined {
  const n = index + 1;
  return DIM_SECTIONS.find((s) => n >= s.start && n <= s.end);
}

export default function App() {
  const [answers, setAnswers] = useState<AnswersMap>({});
  const [page, setPage] = useState(0);
  const [notes, setNotes] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const answeredCount = useMemo(() => countAnswered(answers), [answers]);
  const progressPct = Math.round((answeredCount / QUIZ_TOTAL) * 100);

  const pageItems = useMemo(() => {
    const start = page * QUESTIONS_PER_PAGE;
    return QUIZ_ITEMS.slice(start, start + QUESTIONS_PER_PAGE);
  }, [page]);

  const pageAnswered = useMemo(
    () => pageItems.filter((q) => answers[q.id] === "a" || answers[q.id] === "b").length,
    [pageItems, answers],
  );

  const previewType = useMemo((): MbtiType | null => {
    if (!isQuizComplete(answers)) return null;
    try {
      return scoreMbtiFromAnswers(answers as Record<string, QuizChoice>);
    } catch {
      return null;
    }
  }, [answers]);

  const setChoice = (id: string, choice: QuizChoice) => {
    setAnswers((prev) => ({ ...prev, [id]: choice }));
  };

  const goPage = (next: number) => {
    setPage(Math.max(0, Math.min(QUIZ_PAGE_COUNT - 1, next)));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const onGenerate = async () => {
    if (!isQuizComplete(answers)) return;
    setError(null);
    setResult("");
    setLoading(true);
    try {
      const full = answers as Record<string, QuizChoice>;
      const type = scoreMbtiFromAnswers(full);
      const text = await callDeepSeekChat(MBTI_REPORT_SYSTEM_PROMPT, buildUserPrompt(type, full, notes));
      setResult(text);
    } catch (e) {
      setError(e instanceof Error ? e.message : "请求失败");
    } finally {
      setLoading(false);
    }
  };

  const firstGlobalIndex = page * QUESTIONS_PER_PAGE;

  return (
    <div className="mbti-app">
      <header className="mbti-hero">
        <div className="mbti-hero-top">
          <a className="mbti-back" href="/">
            ← 返回门户
          </a>
        </div>
        <h1 className="mbti-title">MBTI 完整版测评</h1>
        <p className="mbti-sub">
          共 {QUIZ_TOTAL} 道情境题（EI / SN / TF / JP 各 30 题），按直觉选 A 或 B；全部答完后本地计分得到四字母类型，再生成
          AI 解读报告。非官方施测，仅供自我觉察参考。
        </p>
      </header>

      <main className="mbti-card">
        <section className="mbti-section">
          <div className="mbti-progress-wrap">
            <div className="mbti-progress-meta">
              <span>
                答题进度：{answeredCount} / {QUIZ_TOTAL}（{progressPct}%）
              </span>
              <span>
                第 {page + 1} / {QUIZ_PAGE_COUNT} 页
              </span>
            </div>
            <div className="mbti-progress-bar" role="progressbar" aria-valuenow={progressPct} aria-valuemin={0} aria-valuemax={100}>
              <div className="mbti-progress-fill" style={{ width: `${progressPct}%` }} />
            </div>
          </div>

          <h2>答题</h2>
          <p className="mbti-hint">
            本页 {pageAnswered}/{pageItems.length} 题已选；每题必选一项。四维度顺序：外向/内向 → 实感/直觉 → 思考/情感 → 判断/知觉。
          </p>

          <div className="mbti-quiz">
            {pageItems.map((q, i) => {
              const globalIndex = firstGlobalIndex + i;
              const section = sectionForQuestionIndex(globalIndex);
              const showSection =
                section && (globalIndex === 0 || sectionForQuestionIndex(globalIndex - 1)?.dim !== section.dim);

              return (
                <div key={q.id}>
                  {showSection && (
                    <h3 className="mbti-dim-heading">
                      {section.label}
                      <span className="mbti-dim-range">
                        第 {section.start}–{section.end} 题
                      </span>
                    </h3>
                  )}
                  <fieldset className="mbti-q">
                    <legend className="mbti-q-legend">
                      <span className="mbti-q-num">{globalIndex + 1}</span>
                      {q.prompt}
                    </legend>
                    <div className="mbti-q-options">
                      <label className={`mbti-opt ${answers[q.id] === "a" ? "mbti-opt--on" : ""}`}>
                        <input
                          type="radio"
                          name={q.id}
                          checked={answers[q.id] === "a"}
                          onChange={() => setChoice(q.id, "a")}
                        />
                        <span className="mbti-opt-mark">A</span>
                        <span className="mbti-opt-text">{q.aText}</span>
                      </label>
                      <label className={`mbti-opt ${answers[q.id] === "b" ? "mbti-opt--on" : ""}`}>
                        <input
                          type="radio"
                          name={q.id}
                          checked={answers[q.id] === "b"}
                          onChange={() => setChoice(q.id, "b")}
                        />
                        <span className="mbti-opt-mark">B</span>
                        <span className="mbti-opt-text">{q.bText}</span>
                      </label>
                    </div>
                  </fieldset>
                </div>
              );
            })}
          </div>

          <div className="mbti-pager">
            <button type="button" className="mbti-btn mbti-btn-secondary" disabled={page === 0} onClick={() => goPage(page - 1)}>
              上一页
            </button>
            <span className="mbti-pager-info">
              {page + 1} / {QUIZ_PAGE_COUNT}
            </span>
            <button
              type="button"
              className="mbti-btn mbti-btn-secondary"
              disabled={page >= QUIZ_PAGE_COUNT - 1}
              onClick={() => goPage(page + 1)}
            >
              下一页
            </button>
          </div>
        </section>

        {previewType && (
          <p className="mbti-preview" role="status">
            根据当前作答计分：<strong>{previewType}</strong>
          </p>
        )}

        <section className="mbti-section">
          <h2>补充说明（可选）</h2>
          <p className="mbti-hint">职业、近期状态等可写在这里，一并交给模型润色进报告。</p>
          <textarea
            className="mbti-textarea"
            rows={4}
            placeholder="例如：刚换团队、希望报告里多写一点协作建议…"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </section>

        <div className="mbti-actions">
          <button
            type="button"
            className="mbti-btn mbti-btn-primary"
            disabled={loading || !isQuizComplete(answers)}
            onClick={onGenerate}
          >
            {loading ? "正在生成…" : `生成 AI 解读报告（需答满 ${QUIZ_TOTAL} 题）`}
          </button>
          {!isQuizComplete(answers) && (
            <p className="mbti-actions-hint">还差 {QUIZ_TOTAL - answeredCount} 题未作答，可切换页面继续填写。</p>
          )}
        </div>
      </main>

      {error && (
        <div className="mbti-alert" role="alert">
          <strong>出错了：</strong>
          {error}
          <p className="mbti-alert-detail">
            开发环境请在 <code>MBTI/.env.local</code> 中配置 <code>DEEPSEEK_API_KEY</code> 后，在仓库根目录执行{" "}
            <code>npm run dev</code>。
          </p>
        </div>
      )}

      {result && (
        <section className="mbti-result mbti-card">
          <h2 className="mbti-result-title">报告</h2>
          <article className="mbti-markdown">
            <ReactMarkdown>{result}</ReactMarkdown>
          </article>
        </section>
      )}

      <footer className="mbti-footer">
        <small>Powered by DeepSeek · 120 题完整版为简化自陈量表，非临床诊断。</small>
      </footer>
    </div>
  );
}
