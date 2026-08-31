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

function friendlyError(status: number, errMsg: string): string {
  const lower = errMsg.toLowerCase();
  if (
    lower.includes("incorrect api key") ||
    lower.includes("invalid api key") ||
    lower.includes("invalid_api_key") ||
    lower.includes("authentication") ||
    status === 401
  ) {
    return "Invalid OpenAI API key. Create a new key at platform.openai.com/api-keys, set OPENAI_API_KEY in Vercel, and Redeploy.";
  }
  if (lower.includes("insufficient_quota") || lower.includes("billing") || lower.includes("quota")) {
    return "OpenAI account has no credits / quota. Add billing at platform.openai.com/account/billing.";
  }
  if (status === 429 || lower.includes("rate limit")) {
    return "OpenAI rate limit hit. Wait a minute and try again.";
  }
  if (lower.includes("model") || status === 404) {
    return "Model not available. Set AI_MODEL to gpt-4o-mini in Vercel env and Redeploy.";
  }
  // Show a short sanitized reason so we can debug
  const short = errMsg.replace(/\s+/g, " ").slice(0, 160);
  return `OpenAI error (${status || "?"}): ${short || "unknown"}. Check Vercel logs and your API key/billing.`;
}

export async function socraticReply(
  history: ChatMessage[],
  userMessage: string
): Promise<TutorResult> {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) {
    return {
      message:
        "Server is missing OPENAI_API_KEY. Add it in Vercel → Settings → Environment Variables (exact name), then Redeploy.",
      is_correct: null,
      hint_level: 0,
      session_complete: false,
    };
  }

  const model = process.env.AI_MODEL?.trim() || "gpt-4o-mini";

  const messages = [
    { role: "system" as const, content: SYSTEM },
    ...history.slice(-12).map((m) => ({
      role: m.role === "user" ? ("user" as const) : ("assistant" as const),
      content: m.content,
    })),
    { role: "user" as const, content: userMessage },
  ];

  try {
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
      console.error("[socraticReply]", res.status, errMsg);
      return {
        message: friendlyError(res.status, String(errMsg)),
        is_correct: null,
        hint_level: 0,
        session_complete: false,
      };
    }

    const text = data?.choices?.[0]?.message?.content || "";
    if (!text) {
      console.error("[socraticReply] empty content", JSON.stringify(data).slice(0, 300));
      return {
        message: "OpenAI returned an empty reply. Try again, or check model name (gpt-4o-mini).",
        is_correct: null,
        hint_level: 0,
        session_complete: false,
      };
    }
    return parseJson(text);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[socraticReply] fetch failed", msg);
    return {
      message: `Network/server error talking to OpenAI: ${msg.slice(0, 120)}. Try again in a moment.`,
      is_correct: null,
      hint_level: 0,
      session_complete: false,
    };
  }
}
