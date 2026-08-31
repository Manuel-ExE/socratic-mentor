"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type Msg = {
  role: "user" | "assistant";
  content: string;
  is_correct?: boolean | null;
  session_complete?: boolean;
};

const WELCOME: Msg = {
  role: "assistant",
  content:
    "Welcome. Bring a problem, a concept, or a question.\n\nI'll guide you with questions — not dump the answer.\n\nTry: “Solve 3x + 6 = 18” or “What is photosynthesis?”",
};

export default function ChatPage() {
  const [messages, setMessages] = useState<Msg[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const history = messages.filter(
      (m) =>
        m.role === "user" ||
        (m.role === "assistant" &&
          m.content !== WELCOME.content &&
          !m.content.startsWith("New session started"))
    );

    setMessages((prev) => [...prev, { role: "user", content: trimmed }]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed, history }),
      });
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.message || data.error || "Something went wrong.",
          is_correct:
            data.is_correct === true || data.is_correct === false
              ? data.is_correct
              : null,
          session_complete: Boolean(data.session_complete),
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Could not reach the server. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  function reset() {
    setMessages([
      {
        role: "assistant",
        content: "New session started. What would you like to work on?",
      },
    ]);
    setInput("");
    inputRef.current?.focus();
  }

  return (
    <div className="chat-page">
      <div className="chat-top">
        <Link href="/" className="nav-logo">
          <span className="mark" aria-hidden="true">
            ✦
          </span>
          Socratic Mentor
        </Link>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <button type="button" className="btn btn-ghost" onClick={reset}>
            New chat
          </button>
          <Link href="/" className="btn btn-ghost">
            Home
          </Link>
        </div>
      </div>

      <div className="chat-shell">
        <main className="chat-log" role="log" aria-live="polite">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`bubble ${m.role === "user" ? "user" : "bot"}`}
            >
              {m.role === "assistant" && m.is_correct === true && (
                <span className="badge ok">✓</span>
              )}
              {m.role === "assistant" && m.is_correct === false && (
                <span className="badge no">✗</span>
              )}
              {m.content}
              {m.session_complete && (
                <div className="done">Session complete — great work!</div>
              )}
            </div>
          ))}
          {loading && <div className="bubble bot dim">Thinking…</div>}
          <div ref={bottomRef} />
        </main>

        <footer className="composer">
          <form
            className="row"
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
          >
            <label htmlFor="chat-input" className="sr-only">
              Message
            </label>
            <input
              id="chat-input"
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a problem or question…"
              maxLength={4000}
              disabled={loading}
              autoComplete="off"
            />
            <button
              type="submit"
              className="btn btn-gold"
              disabled={loading || !input.trim()}
              style={{ opacity: loading || !input.trim() ? 0.45 : 1 }}
            >
              Send →
            </button>
          </form>
          <div className="chips">
            <button
              type="button"
              className="chip"
              onClick={() => send("I need a hint")}
              disabled={loading}
            >
              Hint
            </button>
            <button
              type="button"
              className="chip"
              onClick={() => send("Explain the idea, not the full answer")}
              disabled={loading}
            >
              Explain idea
            </button>
            <button
              type="button"
              className="chip"
              onClick={() => send("I think I got it")}
              disabled={loading}
            >
              I got it
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
