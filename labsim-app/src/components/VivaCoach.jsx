import { useState } from 'react';

async function callViva(payload) {
  const res = await fetch('/api/viva', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Viva request failed.');
  return data;
}

const TOTAL_QUESTIONS = 3;

export default function VivaCoach({ experimentName, code, resultData, onFinish }) {
  const [stage, setStage] = useState('idle'); // idle | loading | question | grading | feedback | finished | error
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState(null); // { correct, feedback }
  const [pendingNext, setPendingNext] = useState(null); // next question text, held until the student clicks Continue
  const [hint, setHint] = useState(null);
  const [hintLoading, setHintLoading] = useState(false);
  const [history, setHistory] = useState([]); // [{question, correct}]
  const [score, setScore] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');

  async function start() {
    setStage('loading');
    setErrorMsg('');
    if (onFinish) onFinish(null);
    try {
      const data = await callViva({ action: 'start', experimentName, code, resultData });
      setQuestion(data.question);
      setHint(null);
      setFeedback(null);
      setPendingNext(null);
      setAnswer('');
      setHistory([]);
      setScore(0);
      setStage('question');
    } catch (err) {
      setErrorMsg(err.message);
      setStage('error');
    }
  }

  async function getHint() {
    setHintLoading(true);
    try {
      const data = await callViva({ action: 'hint', experimentName, code, resultData, question });
      setHint(data.hint);
    } catch (err) {
      setHint('Could not load a hint right now.');
    } finally {
      setHintLoading(false);
    }
  }

  async function submitAnswer() {
    if (!answer.trim()) return;
    setStage('grading');
    setErrorMsg('');
    try {
      const data = await callViva({
        action: 'answer', experimentName, code, resultData,
        question, answer, history,
      });
      const nextHistory = [...history, { question, correct: data.correct }];
      setHistory(nextHistory);
      if (data.correct) setScore(s => s + 1);
      setFeedback({ correct: data.correct, feedback: data.feedback });

      if (nextHistory.length >= TOTAL_QUESTIONS || !data.nextQuestion) {
        setPendingNext(null); // no next question — "Continue" will show the final score
      } else {
        setPendingNext(data.nextQuestion);
      }
      setStage('feedback');
    } catch (err) {
      setErrorMsg(err.message);
      setStage('error');
    }
  }

  function continueToNext() {
    if (pendingNext) {
      setQuestion(pendingNext);
      setAnswer('');
      setHint(null);
      setFeedback(null);
      setPendingNext(null);
      setStage('question');
    } else {
      setStage('finished');
      if (onFinish) onFinish({ score, total: TOTAL_QUESTIONS });
    }
  }

  return (
    <div className="viva-panel">
      <div className="viva-header">
        <h2>AI Viva Coach</h2>
        {stage === 'question' || stage === 'grading' || stage === 'feedback' ? (
          <span className="viva-progress">Question {history.length + 1} of {TOTAL_QUESTIONS}</span>
        ) : null}
      </div>

      {stage === 'idle' && (
        <div className="viva-idle">
          <p>Get asked {TOTAL_QUESTIONS} viva questions based on your actual result for this experiment.</p>
          <button className="btn btn-primary btn-sm" onClick={start}>Start AI Viva</button>
        </div>
      )}

      {stage === 'loading' && <p className="viva-status">Thinking of a question…</p>}

      {(stage === 'question' || stage === 'grading') && (
        <div className="viva-body">
          <div className="viva-bubble viva-bubble-ai">{question}</div>

          {hint && <div className="viva-bubble viva-bubble-hint">💡 {hint}</div>}

          <textarea
            className="viva-input"
            rows={3}
            placeholder="Type your answer…"
            value={answer}
            onChange={e => setAnswer(e.target.value)}
            disabled={stage === 'grading'}
          />
          <div className="row-actions">
            <button className="btn btn-primary btn-sm" onClick={submitAnswer} disabled={stage === 'grading' || !answer.trim()}>
              {stage === 'grading' ? 'Grading…' : 'Submit answer'}
            </button>
            <button className="btn btn-ghost btn-sm" onClick={getHint} disabled={hintLoading || !!hint || stage === 'grading'}>
              {hintLoading ? 'Loading hint…' : 'Give me a hint'}
            </button>
          </div>
        </div>
      )}

      {stage === 'feedback' && (
        <div className="viva-body">
          <div className="viva-bubble viva-bubble-ai">{question}</div>
          <div className={`viva-bubble ${feedback.correct ? 'viva-bubble-correct' : 'viva-bubble-incorrect'}`}>
            {feedback.correct ? '✓ ' : '✗ '}{feedback.feedback}
          </div>
          <button className="btn btn-primary btn-sm" onClick={continueToNext}>
            {pendingNext ? 'Next question' : 'See my score'}
          </button>
        </div>
      )}

      {stage === 'finished' && (
        <div className="viva-body">
          <div className="viva-score">
            <span className="viva-score-num">{score}/{TOTAL_QUESTIONS}</span>
            <span className="viva-score-label">viva score</span>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={start}>Try again</button>
        </div>
      )}

      {stage === 'error' && (
        <div className="viva-body">
          <p style={{ color: 'var(--red)', fontSize: 13 }}>{errorMsg}</p>
          <p style={{ color: 'var(--muted-2)', fontSize: 11.5, fontFamily: 'var(--font-mono)', marginTop: 6 }}>
            The viva coach needs a backend endpoint at <code>/api/viva</code> with <code>GEMINI_API_KEY</code> set —
            this only works when deployed on Vercel (or run locally with `vercel dev`), not on GitHub Pages.
          </p>
          <button className="btn btn-ghost btn-sm" style={{ marginTop: 10 }} onClick={start}>Retry</button>
        </div>
      )}
    </div>
  );
}
