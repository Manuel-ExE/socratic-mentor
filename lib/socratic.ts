import { GoogleGenerativeAI } from "@google/generative-ai";

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
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    return {
      message:
        "Server is missing GEMINI_API_KEY. Add it in Vercel Environment Variables, then redeploy.",
      is_correct: null,
      hint_level: 0,
      session_complete: false,
    };
  }

  const genAI = new GoogleGenerativeAI(key);
  const model = genAI.getGenerativeModel({
    model: process.env.AI_MODEL || "gemini-2.0-flash",
    systemInstruction: SYSTEM,
    generationConfig: {
      temperature: 0.6,
      maxOutputTokens: 1024,
      responseMimeType: "application/json",
    },
  });

  const contents = [
    ...history.slice(-12).map((m) => ({
      role: m.role === "user" ? ("user" as const) : ("model" as const),
      parts: [{ text: m.content }],
    })),
    { role: "user" as const, parts: [{ text: userMessage }] },
  ];

  try {
    const result = await model.generateContent({ contents });
    const text = result.response.text() || "";
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
