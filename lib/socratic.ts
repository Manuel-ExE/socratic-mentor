export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export type TutorResult = {
  message: string;
  is_correct: boolean | null;
  hint_level: number;
  session_complete: boolean;
};

const SYSTEM = `You are Socratic Mentor, a patient AI tutor for students.
Core rule: NEVER give the full answer first when you can guide the student to find it.
If the student insists on the full solution, still give only a partial step or a strong hint — never the complete worked solution in one reply.

Rules:
1. Ask ONE useful question at a time.
2. If they ask for a solution, start with a Socratic question, not the answer.
3. If correct: briefly encourage and advance one step.
4. If wrong: do not only say "wrong". Ask a targeted question that addresses the likely misconception.
5. Escalate hints only when needed (question → clue → strategy → partial step → explanation).
6. Keep replies short (2–5 short sentences), suitable for a chat UI.
7. When they solve it themselves, celebrate specifically what they did right.
8. Never treat an incorrect answer as correct.
9. If unclear, ask for clarification.

Respond with valid JSON only (no markdown fences):
{
  "message": "text the student sees",
  "is_correct": true or false or null,
  "hint_level": 0,
  "session_complete": false
}`;

function parseJson(text: string): TutorResult {
  let t = text.trim();
  if (t.startsWith("```")) {
    t = t.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  }
  try {
    const data = JSON.parse(t);
    return {
      message: String(data.message || "What are you thinking so far?"),
      is_correct:
        data.is_correct === true || data.is_correct === false
          ? data.is_correct
          : null,
      hint_level: Number(data.hint_level) || 0,
      session_complete: Boolean(data.session_complete),
    };
  } catch {
    const match = t.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        const data = JSON.parse(match[0]);
        return {
          message: String(data.message || t.slice(0, 1200)),
          is_correct: null,
          hint_level: 0,
          session_complete: false,
        };
      } catch {
        /* fall through */
      }
    }
    return {
      message: t.slice(0, 1500) || "Could you rephrase that?",
      is_correct: null,
      hint_level: 0,
      session_complete: false,
    };
  }
}

function friendlyOpenAI(status: number, errMsg: string): string {
  const lower = errMsg.toLowerCase();
  if (
    lower.includes("incorrect api key") ||
    lower.includes("invalid api key") ||
    lower.includes("invalid_api_key") ||
    lower.includes("authentication") ||
    status === 401
  ) {
    return "Invalid OpenAI API key. Fix OPENAI_API_KEY in Vercel and Redeploy — or add GEMINI_API_KEY instead.";
  }
  if (
    lower.includes("insufficient_quota") ||
    lower.includes("billing") ||
    lower.includes("quota")
  ) {
    return "OpenAI has no credits. Add billing, or set GEMINI_API_KEY for free-tier Gemini.";
  }
  if (status === 429 || lower.includes("rate limit")) {
    return "OpenAI rate limit. Wait a minute, or use GEMINI_API_KEY.";
  }
  const short = errMsg.replace(/\s+/g, " ").slice(0, 140);
  return `OpenAI error (${status || "?"}): ${short || "unknown"}`;
}

function friendlyGemini(status: number, errMsg: string): string {
  const lower = errMsg.toLowerCase();
  if (status === 400 && lower.includes("api key")) {
    return "Invalid GEMINI_API_KEY. Get a key at aistudio.google.com/apikey, set it in Vercel, Redeploy.";
  }
  if (status === 403 || lower.includes("permission") || lower.includes("api_key")) {
    return "Gemini API key rejected. Check GEMINI_API_KEY in Vercel and Redeploy.";
  }
  if (status === 429 || lower.includes("quota") || lower.includes("rate")) {
    return "Gemini quota/rate limit. Wait a bit and try again.";
  }
  if (lower.includes("not found") || lower.includes("model")) {
    return "Gemini model not available. Set AI_MODEL to gemini-2.5-flash or gemini-2.0-flash-001 and Redeploy.";
  }
  const short = errMsg.replace(/\s+/g, " ").slice(0, 140);
  return `Gemini error (${status || "?"}): ${short || "unknown"}`;
}

async function replyOpenAI(
  key: string,
  history: ChatMessage[],
  userMessage: string
): Promise<TutorResult> {
  const model = process.env.AI_MODEL?.trim() || "gpt-4o-mini";
  const messages = [
    { role: "system" as const, content: SYSTEM },
    ...history.slice(-12).map((m) => ({
      role: m.role === "user" ? ("user" as const) : ("assistant" as const),
      content: m.content,
    })),
    { role: "user" as const, content: userMessage },
  ];

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.6,
      max_tokens: 1024,
      response_format: { type: "json_object" },
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const errMsg =
      data?.error?.message ||
      data?.error?.code ||
      data?.error?.type ||
      `HTTP ${res.status}`;
    console.error("[openai]", res.status, errMsg);
    return {
      message: friendlyOpenAI(res.status, String(errMsg)),
      is_correct: null,
      hint_level: 0,
      session_complete: false,
    };
  }

  const text = data?.choices?.[0]?.message?.content || "";
  if (!text) {
    return {
      message: "OpenAI returned an empty reply. Try again.",
      is_correct: null,
      hint_level: 0,
      session_complete: false,
    };
  }
  return parseJson(text);
}

async function replyGemini(
  key: string,
  history: ChatMessage[],
  userMessage: string
): Promise<TutorResult> {
  // Prefer current Flash models; AI_MODEL can override
  const model =
    process.env.AI_MODEL?.trim() ||
    process.env.GEMINI_MODEL?.trim() ||
    "gemini-2.5-flash";

  const contents = [
    ...history.slice(-12).map((m) => ({
      role: m.role === "user" ? "user" : "model",
      parts: [{ text: m.content }],
    })),
    { role: "user", parts: [{ text: userMessage }] },
  ];

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    model
  )}:generateContent?key=${encodeURIComponent(key)}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM }] },
      contents,
      generationConfig: {
        temperature: 0.6,
        maxOutputTokens: 1024,
        responseMimeType: "application/json",
      },
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const errMsg =
      data?.error?.message ||
      data?.error?.status ||
      data?.error?.code ||
      `HTTP ${res.status}`;
    console.error("[gemini]", res.status, errMsg);
    return {
      message: friendlyGemini(res.status, String(errMsg)),
      is_correct: null,
      hint_level: 0,
      session_complete: false,
    };
  }

  const text =
    data?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text || "").join("") ||
    "";
  if (!text) {
    const block = data?.candidates?.[0]?.finishReason || data?.promptFeedback?.blockReason;
    console.error("[gemini] empty", block, JSON.stringify(data).slice(0, 200));
    return {
      message: block
        ? `Gemini blocked the reply (${block}). Try a different question.`
        : "Gemini returned an empty reply. Try again.",
      is_correct: null,
      hint_level: 0,
      session_complete: false,
    };
  }
  return parseJson(text);
}

export async function socraticReply(
  history: ChatMessage[],
  userMessage: string
): Promise<TutorResult> {
  const geminiKey = process.env.GEMINI_API_KEY?.trim();
  const openaiKey = process.env.OPENAI_API_KEY?.trim();

  // Prefer Gemini when available (free tier friendly), else OpenAI
  if (geminiKey) {
    try {
      return await replyGemini(geminiKey, history, userMessage);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[gemini] fetch failed", msg);
      // Fall through to OpenAI if present
      if (!openaiKey) {
        return {
          message: `Gemini network error: ${msg.slice(0, 120)}`,
          is_correct: null,
          hint_level: 0,
          session_complete: false,
        };
      }
    }
  }

  if (openaiKey) {
    try {
      return await replyOpenAI(openaiKey, history, userMessage);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[openai] fetch failed", msg);
      return {
        message: `OpenAI network error: ${msg.slice(0, 120)}`,
        is_correct: null,
        hint_level: 0,
        session_complete: false,
      };
    }
  }

  return {
    message:
      "No API key configured. In Vercel → Settings → Environment Variables add GEMINI_API_KEY (free) and/or OPENAI_API_KEY, then Redeploy.",
    is_correct: null,
    hint_level: 0,
    session_complete: false,
  };
}
