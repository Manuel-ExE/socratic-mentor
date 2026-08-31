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

type Provider = "grok" | "gemini" | "openai";

async function replyOpenAICompatible(
  provider: "grok" | "openai",
  key: string,
  history: ChatMessage[],
  userMessage: string
): Promise<TutorResult> {
  const isGrok = provider === "grok";
  const base = isGrok ? "https://api.x.ai/v1" : "https://api.openai.com/v1";
  const defaultModel = isGrok ? "grok-4.5" : "gpt-4o-mini";
  const model = process.env.AI_MODEL?.trim() || defaultModel;

  const messages = [
    { role: "system" as const, content: SYSTEM },
    ...history.slice(-12).map((m) => ({
      role: m.role === "user" ? ("user" as const) : ("assistant" as const),
      content: m.content,
    })),
    { role: "user" as const, content: userMessage },
  ];

  const body: Record<string, unknown> = {
    model,
    messages,
    temperature: 0.6,
    max_tokens: 1024,
  };
  // OpenAI supports response_format json_object; xAI is generally compatible
  body.response_format = { type: "json_object" };

  const res = await fetch(`${base}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify(body),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const errMsg =
      data?.error?.message ||
      data?.error?.code ||
      data?.error?.type ||
      `HTTP ${res.status}`;
    console.error(`[${provider}]`, res.status, errMsg);
    const lower = String(errMsg).toLowerCase();
    let friendly = `${isGrok ? "Grok" : "OpenAI"} error (${res.status}): ${String(errMsg).slice(0, 140)}`;
    if (res.status === 401 || lower.includes("api key") || lower.includes("auth")) {
      friendly = isGrok
        ? "Invalid XAI_API_KEY. Get a key at console.x.ai, set XAI_API_KEY in Vercel, Redeploy."
        : "Invalid OPENAI_API_KEY. Fix the key in Vercel and Redeploy.";
    } else if (res.status === 429 || lower.includes("rate") || lower.includes("quota")) {
      friendly = isGrok
        ? "Grok rate limit or quota. Wait a minute or check credits at console.x.ai."
        : "OpenAI rate limit or billing issue. Check platform.openai.com billing.";
    }
    return {
      message: friendly,
      is_correct: null,
      hint_level: 0,
      session_complete: false,
    };
  }

  const text = data?.choices?.[0]?.message?.content || "";
  if (!text) {
    return {
      message: `${isGrok ? "Grok" : "OpenAI"} returned an empty reply. Try again.`,
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
      `HTTP ${res.status}`;
    console.error("[gemini]", res.status, errMsg);
    return {
      message: `Gemini error (${res.status}): ${String(errMsg).slice(0, 140)}`,
      is_correct: null,
      hint_level: 0,
      session_complete: false,
    };
  }

  const text =
    data?.candidates?.[0]?.content?.parts
      ?.map((p: { text?: string }) => p.text || "")
      .join("") || "";
  if (!text) {
    return {
      message: "Gemini returned an empty reply. Try again.",
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
  // Prefer Grok (xAI), then Gemini, then OpenAI
  const xaiKey =
    process.env.XAI_API_KEY?.trim() || process.env.GROK_API_KEY?.trim();
  const geminiKey = process.env.GEMINI_API_KEY?.trim();
  const openaiKey = process.env.OPENAI_API_KEY?.trim();

  const tryProviders: { name: Provider; run: () => Promise<TutorResult> }[] =
    [];

  if (xaiKey) {
    tryProviders.push({
      name: "grok",
      run: () => replyOpenAICompatible("grok", xaiKey, history, userMessage),
    });
  }
  if (geminiKey) {
    tryProviders.push({
      name: "gemini",
      run: () => replyGemini(geminiKey, history, userMessage),
    });
  }
  if (openaiKey) {
    tryProviders.push({
      name: "openai",
      run: () => replyOpenAICompatible("openai", openaiKey, history, userMessage),
    });
  }

  if (tryProviders.length === 0) {
    return {
      message:
        "No API key set. Add XAI_API_KEY (Grok) in Vercel → Environment Variables, then Redeploy. Get a key at console.x.ai",
      is_correct: null,
      hint_level: 0,
      session_complete: false,
    };
  }

  let lastError = "";
  for (const p of tryProviders) {
    try {
      const result = await p.run();
      // If provider returned a soft error message about auth, try next
      const softFail =
        result.message.includes("Invalid") &&
        result.message.includes("API") &&
        tryProviders.length > 1;
      if (softFail) {
        lastError = result.message;
        continue;
      }
      return result;
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
      console.error(`[${p.name}] threw`, lastError);
    }
  }

  return {
    message:
      lastError ||
      "All providers failed. Check XAI_API_KEY / GEMINI_API_KEY / OPENAI_API_KEY in Vercel and Redeploy.",
    is_correct: null,
    hint_level: 0,
    session_complete: false,
  };
}
