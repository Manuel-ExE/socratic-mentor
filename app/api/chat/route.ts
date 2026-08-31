import { NextRequest, NextResponse } from "next/server";
import { socraticReply, type ChatMessage } from "@/lib/socratic";

export const runtime = "nodejs";

type Body = {
  message?: string;
  history?: ChatMessage[];
};

export async function POST(req: NextRequest) {
  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const message = (body.message || "").trim();
  if (!message) {
    return NextResponse.json({ error: "Empty message" }, { status: 400 });
  }
  if (message.length > 4000) {
    return NextResponse.json({ error: "Message too long" }, { status: 400 });
  }

  const history = Array.isArray(body.history)
    ? body.history
        .filter(
          (m): m is ChatMessage =>
            m != null &&
            (m.role === "user" || m.role === "assistant") &&
            typeof m.content === "string"
        )
        .slice(-20)
    : [];

  try {
    const result = await socraticReply(history, message);
    return NextResponse.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[/api/chat]", msg);
    return NextResponse.json(
      {
        message:
          "Sorry, something went wrong on the server. Please try again.",
        is_correct: null,
        hint_level: 0,
        session_complete: false,
      },
      { status: 500 }
    );
  }
}
