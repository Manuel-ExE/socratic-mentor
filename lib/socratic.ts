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

export async function socraticReply(
  history: ChatMessage[],
  userMessage: string
): Promise<TutorResult> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    return {
      message:
        "Server is missing OPENAI_API_KEY. Add it in Vercel → Settings → Environment Variables, then Redeploy.",
      is_correct: null,
      hint_level: 0,
      session_complete: false,
    };
  }

  const model = process.env.AI_MODEL || "gpt-4o-mini";

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

    const data = await res.json();

    if (!res.ok) {
      const errMsg =
        data?.error?.message || data?.error?.code || `HTTP ${res.status}`;
      console.error("[socraticReply]", errMsg);
      const lower = String(errMsg).toLowerCase();
      let friendly =
        "Sorry, I'm having trouble thinking right now. Please try again in a moment.";
      if (
        lower.includes("api key") ||
        lower.includes("incorrect api") ||
        lower.includes("invalid") ||
        res.status === 401 ||
        res.status === 403
      ) {
        friendly =
          "API key problem. Check OPENAI_API_KEY in Vercel → Settings → Environment Variables, then Redeploy.";
      } else if (lower.includes("model") || res.status === 404) {
        friendly =
          "Model not available. Set AI_MODEL to a valid OpenAI model (e.g. gpt-4o-mini) and Redeploy.";
      } else if (
        lower.includes("quota") ||
        lower.includes("rate") ||
        lower.includes("billing") ||
        res.status === 429
      ) {
        friendly =
          "OpenAI rate limit or billing issue. Check your OpenAI usage/billing and try again.";
      }
      return {
        message: friendly,
        is_correct: null,
        hint_level: 0,
        session_complete: false,
      };
    }

    const text = data?.choices?.[0]?.message?.content || "";
    return parseJson(text);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[socraticReply]", msg);
    return {
      message:
        "Sorry, I'm having trouble thinking right now. Please try again in a moment.",
      is_correct: null,
      hint_level: 0,
      session_complete: false,
    };
  }
}
