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
    <div className="shell">
      <div className="orb orb-1" aria-hidden="true" />
      <div className="orb orb-2" aria-hidden="true" />

      <header className="header glass">
        <div className="brand">
          <span className="logo" aria-hidden="true">
            ✦
          </span>
          <div>
            <h1>Socratic Mentor</h1>
            <p className="tag">Guided reasoning — not just answers</p>
          </div>
        </div>
        <button type="button" className="ghost" onClick={reset}>
          New chat
        </button>
      </header>

      <main
        className="chat"
        role="log"
        aria-live="polite"
        aria-relevant="additions"
      >
        {messages.map((m, i) => (
          <div
            key={i}
            className={`bubble glass ${
              m.role === "user" ? "student" : "mentor"
            }`}
          >
            {m.role === "assistant" && m.is_correct === true && (
              <span className="badge correct" title="Looks correct">
                ✓
              </span>
            )}
            {m.role === "assistant" && m.is_correct === false && (
              <span className="badge incorrect" title="Not quite">
                ✗
              </span>
            )}
            {m.content}
            {m.session_complete && (
              <div className="complete">Session complete — great work!</div>
            )}
          </div>
        ))}
        {loading && (
          <div className="bubble glass mentor typing" aria-busy="true">
            Thinking…
          </div>
        )}
        <div ref={bottomRef} />
      </main>

      <footer className="footer glass">
        <form
          className="form"
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
          <button type="submit" className="send" disabled={loading || !input.trim()}>
            Send
            <span className="arrow" aria-hidden="true">
              →
            </span>
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

      <style jsx>{`
        .shell {
          position: relative;
          max-width: 720px;
          margin: 0 auto;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          padding: 1.25rem 1rem 1.5rem;
          z-index: 1;
        }
        .orb {
          position: fixed;
          border-radius: 50%;
          filter: blur(80px);
          pointer-events: none;
          z-index: 0;
        }
        .orb-1 {
          width: 420px;
          height: 420px;
          top: -80px;
          right: -60px;
          background: rgba(124, 58, 237, 0.45);
        }
        .orb-2 {
          width: 320px;
          height: 320px;
          bottom: 10%;
          left: -80px;
          background: rgba(192, 38, 211, 0.3);
        }
        .glass {
          background: var(--panel);
          backdrop-filter: blur(var(--blur));
          -webkit-backdrop-filter: blur(var(--blur));
          border: 1px solid var(--border);
          box-shadow: var(--shadow);
        }
        .header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.85rem 1.1rem;
          border-radius: var(--radius);
          margin-bottom: 1.25rem;
        }
        .brand {
          display: flex;
          gap: 0.75rem;
          align-items: center;
        }
        .logo {
          font-size: 1.35rem;
          color: var(--accent);
          line-height: 1;
        }
        h1 {
          font-size: 1.15rem;
          font-weight: 700;
          letter-spacing: 0.02em;
        }
        .tag {
          color: var(--muted);
          font-size: 0.8rem;
          margin-top: 0.1rem;
        }
        .chat {
          flex: 1;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 0.85rem;
          padding: 0.25rem 0 1rem;
        }
        .bubble {
          max-width: 88%;
          padding: 0.95rem 1.15rem;
          border-radius: var(--radius);
          line-height: 1.5;
          font-size: 0.95rem;
          white-space: pre-wrap;
        }
        .mentor {
          align-self: flex-start;
          background: var(--mentor);
          border-color: rgba(167, 139, 250, 0.25);
        }
        .student {
          align-self: flex-end;
          background: var(--student);
          border-color: rgba(232, 121, 249, 0.3);
        }
        .typing {
          opacity: 0.75;
          font-style: italic;
          color: var(--muted);
        }
        .badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 1.25rem;
          height: 1.25rem;
          border-radius: 999px;
          font-size: 0.7rem;
          font-weight: 700;
          margin-right: 0.4rem;
          vertical-align: middle;
        }
        .badge.correct {
          background: rgba(22, 101, 52, 0.6);
          color: var(--success);
        }
        .badge.incorrect {
          background: rgba(127, 29, 29, 0.55);
          color: var(--danger);
        }
        .complete {
          margin-top: 0.55rem;
          padding-top: 0.55rem;
          border-top: 1px solid var(--border);
          color: var(--success);
          font-size: 0.85rem;
          font-weight: 500;
        }
        .footer {
          border-radius: var(--radius);
          padding: 0.9rem 1rem 1rem;
        }
        .form {
          display: flex;
          gap: 0.5rem;
        }
        input {
          flex: 1;
          background: rgba(0, 0, 0, 0.25);
          border: 1px solid var(--border);
          color: var(--text);
          border-radius: var(--radius-pill);
          padding: 0.8rem 1.2rem;
          outline: none;
          transition: border-color 0.15s ease;
        }
        input::placeholder {
          color: var(--muted);
        }
        input:focus {
          border-color: var(--accent);
          box-shadow: 0 0 0 3px var(--accent-soft);
        }
        .send {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          background: transparent;
          color: var(--accent);
          border: 1px solid var(--accent);
          border-radius: var(--radius-pill);
          padding: 0.75rem 1.2rem;
          font-weight: 600;
          font-size: 0.85rem;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          cursor: pointer;
          transition: background 0.15s ease, color 0.15s ease;
        }
        .send:not(:disabled):hover {
          background: var(--accent);
          color: #1a0a2e;
        }
        .send:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
        .arrow {
          font-size: 1rem;
        }
        .ghost {
          background: transparent;
          color: var(--muted);
          border: 1px solid var(--border);
          border-radius: var(--radius-pill);
          padding: 0.45rem 0.95rem;
          font-size: 0.85rem;
          cursor: pointer;
          transition: color 0.15s ease, border-color 0.15s ease;
        }
        .ghost:hover {
          color: var(--text);
          border-color: var(--border-strong);
        }
        .chips {
          display: flex;
          flex-wrap: wrap;
          gap: 0.45rem;
          margin-top: 0.7rem;
        }
        .chip {
          background: rgba(0, 0, 0, 0.2);
          border: 1px solid var(--border);
          color: var(--muted);
          border-radius: var(--radius-pill);
          padding: 0.35rem 0.85rem;
          font-size: 0.78rem;
          letter-spacing: 0.02em;
          cursor: pointer;
          transition: color 0.15s ease, border-color 0.15s ease, background 0.15s ease;
        }
        .chip:hover:not(:disabled) {
          color: var(--accent);
          border-color: var(--accent);
          background: var(--accent-soft);
        }
        .chip:disabled {
          opacity: 0.45;
        }
        .sr-only {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border: 0;
        }
      `}</style>
    </div>
  );
}
