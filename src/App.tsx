import { useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import type { MbtiType } from "./constants";
import { MBTI_REPORT_SYSTEM_PROMPT } from "./prompts";
import {
  isQuizComplete,
  type AnswersMap,
  type QuizChoice,
  QUIZ_ITEMS,
  scoreMbtiFromAnswers,
} from "./quizData";
import { callDeepSeekChat } from "./lib/callDeepSeek";
import "./App.css";

function buildUserPrompt(type: MbtiType, answers: Record<string, QuizChoice>, notes: string): string {
  const lines = QUIZ_ITEMS.map((q, i) => {
    const pick = answers[q.id]!;
    const side = pick === "a" ? `A：${q.aText}` : `B：${q.bText}`;
    return `${i + 1}. ${q.prompt} → 选 ${pick.toUpperCase()}（${side}）`;
  });
  const n = notes.trim();
  return `【计分得到的四字母类型】${type}（由前端根据 12 题作答 A/B 计数得出；你须在全文认可以此为唯一类型代码。）\n\n【各题作答】\n${lines.join("\n")}\n\n【可选补充说明】\n${n || "无"}`;
}

export default function App() {
  const [answers, setAnswers] = useState<AnswersMap>({});
  const [notes, setNotes] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <div className="mbti-app">
      <header className="mbti-hero">
        <div className="mbti-hero-top">
          <a className="mbti-back" href="/">
            ← 返回门户
          </a>
        </div>
        <h1 className="mbti-title">MBTI 情境测评</h1>
        <p className="mbti-sub">
          共 12 道情境题（EI / SN / TF / JP 各 3 题），按直觉选 A 或 B；提交后由本地计分得到四字母类型，再调用 DeepSeek 生成解读报告。非官方施测，仅供自我觉察参考。
        </p>
      </header>

      <main className="mbti-card">
        <section className="mbti-section">
          <h2>答题</h2>
          <p className="mbti-hint">每题必选一项；全部答完后可生成 AI 报告。</p>

          <div className="mbti-quiz">
            {QUIZ_ITEMS.map((q, index) => (
              <fieldset key={q.id} className="mbti-q">
                <legend className="mbti-q-legend">
                  <span className="mbti-q-num">{index + 1}</span>
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
            ))}
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
            {loading ? "正在生成…" : "生成 AI 解读报告"}
          </button>
        </div>

        {error && (
          <div className="mbti-alert" role="alert">
            <strong>出错了：</strong>
            {error}
            <p className="mbti-alert-detail">
              开发环境请在 <code>MBTI/.env.local</code> 中配置 <code>DEEPSEEK_API_KEY</code> 后，在仓库根目录执行{" "}
              <code>npm run dev</code> 启动主应用与本子应用。
            </p>
          </div>
        )}

        {result && (
          <section className="mbti-result">
            <h2 className="mbti-result-title">报告</h2>
            <article className="mbti-markdown">
              <ReactMarkdown>{result}</ReactMarkdown>
            </article>
          </section>
        )}
      </main>

      <footer className="mbti-footer">
        <small>Powered by DeepSeek · 情境题为简化自陈量表，非临床诊断。</small>
      </footer>
    </div>
  );
}
