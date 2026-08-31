"use client";

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
    "Hi — I'm Socratic Mentor.\n\nAsk a question or paste a problem. I'll guide you step by step instead of dumping the answer.\n\nTry: “Solve 3x + 6 = 18” or “What is photosynthesis?”",
};

export default function Home() {
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
    <div className="page">
      <div className="frame">
        <header className="header">
          <div className="brand">
            <span className="spark" aria-hidden="true">
              ✦
            </span>
            <div>
              <h1>Socratic Mentor</h1>
              <p className="tag">Guided reasoning — not just answers</p>
            </div>
          </div>
          <button type="button" className="btn-ghost" onClick={reset}>
            New chat
          </button>
        </header>

        <main className="chat" role="log" aria-live="polite">
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
              className="btn-send"
              disabled={loading || !input.trim()}
            >
              Send
              <span aria-hidden="true">→</span>
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
