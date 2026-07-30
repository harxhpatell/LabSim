// Vercel serverless function: /api/viva
// Keeps GEMINI_API_KEY server-side. Never call the Gemini API directly
// from the browser — that would expose the key to anyone reading dev tools.
//
// Set GEMINI_API_KEY in your Vercel project's Environment Variables
// (Project Settings -> Environment Variables), not in any committed file.

const MODEL = 'gemini-2.5-flash'; // cheap + fast, good fit for short viva Q&A
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

async function callGemini(apiKey, { systemPrompt, userPrompt, jsonSchema, maxOutputTokens }) {
  const body = {
    system_instruction: { parts: [{ text: systemPrompt }] },
    contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
    generationConfig: {
      maxOutputTokens: maxOutputTokens || 400,
      thinkingConfig: { thinkingBudget: 0 }, // short Q&A doesn't need extended thinking; avoids truncated output
      ...(jsonSchema ? { responseMimeType: 'application/json', responseSchema: jsonSchema } : {}),
    },
  };

  const response = await fetch(`${ENDPOINT}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini API error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  const text = (data.candidates?.[0]?.content?.parts || [])
    .map(p => p.text || '')
    .join('\n')
    .trim();

  if (!text) throw new Error('Gemini returned an empty response.');
  return text;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'GEMINI_API_KEY is not configured on the server.' });
    return;
  }

  const { action, experimentName, code, resultData, history, question, answer } = req.body || {};

  if (!action || !experimentName) {
    res.status(400).json({ error: 'Missing action or experimentName.' });
    return;
  }

  try {
    if (action === 'start') {
      const systemPrompt = `You are a strict but fair civil engineering viva examiner at an Indian engineering college. A student just completed the "${experimentName}" experiment (${code}) in a virtual lab, with these results: ${JSON.stringify(resultData)}.

Ask exactly ONE short conceptual viva question testing their understanding of the underlying theory (not just "what number did you get"). Keep it under 30 words. Do not greet the student or add commentary — output only the question text.`;
      const text = await callGemini(apiKey, { systemPrompt, userPrompt: 'Ask the first viva question.', maxOutputTokens: 300 });
      res.status(200).json({ question: text });
      return;
    }

    if (action === 'hint') {
      const systemPrompt = `You are a civil engineering viva examiner. The student is stuck on this question about the "${experimentName}" experiment (${code}): "${question}". Their result data: ${JSON.stringify(resultData)}.

Give ONE short hint (under 25 words) that nudges them toward the answer WITHOUT stating the answer directly. Output only the hint text.`;
      const text = await callGemini(apiKey, { systemPrompt, userPrompt: 'Give a hint.', maxOutputTokens: 250 });
      res.status(200).json({ hint: text });
      return;
    }

    if (action === 'answer') {
      const questionNumber = (history?.length || 0) + 1;
      const systemPrompt = `You are a civil engineering viva examiner grading a student's spoken answer in a virtual lab viva for "${experimentName}" (${code}). Result data: ${JSON.stringify(resultData)}.

Question asked: "${question}"
Student's answer: "${answer}"

Judge whether the answer demonstrates correct conceptual understanding (minor wording issues are fine; the core idea must be right). This was question ${questionNumber} of 3.
- If this was question 1 or 2, write a new, different conceptual question about the same experiment for "nextQuestion".
- If this was question 3, set "nextQuestion" to null.`;

      const jsonSchema = {
        type: 'OBJECT',
        properties: {
          correct: { type: 'BOOLEAN' },
          feedback: { type: 'STRING', description: 'One short sentence of feedback, max 25 words.' },
          nextQuestion: { type: 'STRING', nullable: true },
        },
        required: ['correct', 'feedback'],
      };

      const text = await callGemini(apiKey, {
        systemPrompt, userPrompt: 'Grade the answer and respond with the JSON object.',
        jsonSchema, maxOutputTokens: 500,
      });

      let parsed;
      try {
        parsed = JSON.parse(text);
      } catch {
        res.status(502).json({ error: 'Could not parse grading response.' });
        return;
      }
      res.status(200).json(parsed);
      return;
    }

    res.status(400).json({ error: 'Unknown action.' });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Unexpected server error.' });
  }
}
