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
    "👋 Hi — I'm Socratic Mentor.\n\nAsk a question or paste a problem. I'll guide you step by step instead of dumping the answer.\n\nTry: “Solve 3x + 6 = 18” or “What is photosynthesis?”",
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

    // Exclude pure welcome / reset greetings from model history
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
      <header className="header">
        <div className="brand">
          <span className="logo" aria-hidden="true">
            🧭
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

      <main className="chat" role="log" aria-live="polite" aria-relevant="additions">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`bubble ${m.role === "user" ? "student" : "mentor"}`}
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
          <div className="bubble mentor typing" aria-busy="true">
            Thinking…
          </div>
        )}
        <div ref={bottomRef} />
      </main>

      <footer className="footer">
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
          <button type="submit" disabled={loading || !input.trim()}>
            Send
          </button>
        </form>
        <div className="chips">
          <button
            type="button"
            className="chip"
            onClick={() => send("I need a hint")}
            disabled={loading}
          >
            💡 Hint
          </button>
          <button
            type="button"
            className="chip"
            onClick={() => send("Explain the idea, not the full answer")}
            disabled={loading}
          >
            🧠 Explain idea
          </button>
          <button
            type="button"
            className="chip"
            onClick={() => send("I think I got it")}
            disabled={loading}
          >
            ✅ I got it
          </button>
        </div>
      </footer>

      <style jsx>{`
        .shell {
          max-width: 720px;
          margin: 0 auto;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          padding: 1rem;
        }
        .header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-bottom: 1rem;
          border-bottom: 1px solid var(--border);
          margin-bottom: 1rem;
        }
        .brand {
          display: flex;
          gap: 0.75rem;
          align-items: center;
        }
        .logo {
          font-size: 1.75rem;
        }
        h1 {
          font-size: 1.25rem;
          font-weight: 650;
        }
        .tag {
          color: var(--muted);
          font-size: 0.85rem;
        }
        .chat {
          flex: 1;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          padding-bottom: 1rem;
        }
        .bubble {
          max-width: 90%;
          padding: 0.85rem 1rem;
          border-radius: var(--radius);
          line-height: 1.45;
          font-size: 0.95rem;
          white-space: pre-wrap;
          position: relative;
        }
        .mentor {
          align-self: flex-start;
          background: var(--mentor);
          border: 1px solid #2a4a73;
        }
        .student {
          align-self: flex-end;
          background: var(--student);
          border: 1px solid #2f4a35;
        }
        .typing {
          opacity: 0.7;
          font-style: italic;
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
          background: #166534;
          color: #bbf7d0;
        }
        .badge.incorrect {
          background: #7f1d1d;
          color: #fecaca;
        }
        .complete {
          margin-top: 0.5rem;
          padding-top: 0.5rem;
          border-top: 1px solid #2a4a73;
          color: #86efac;
          font-size: 0.85rem;
          font-weight: 500;
        }
        .footer {
          border-top: 1px solid var(--border);
          padding-top: 0.75rem;
        }
        .form {
          display: flex;
          gap: 0.5rem;
        }
        input {
          flex: 1;
          background: var(--panel);
          border: 1px solid var(--border);
          color: var(--text);
          border-radius: 999px;
          padding: 0.75rem 1.1rem;
          outline: none;
        }
        input:focus {
          border-color: var(--accent);
        }
        button[type="submit"] {
          background: var(--accent);
          color: white;
          border: none;
          border-radius: 999px;
          padding: 0.75rem 1.25rem;
          font-weight: 600;
          cursor: pointer;
        }
        button[type="submit"]:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        button[type="submit"]:not(:disabled):hover {
          background: var(--accent-hover);
        }
        .ghost {
          background: transparent;
          color: var(--muted);
          border: 1px solid var(--border);
          border-radius: 999px;
          padding: 0.5rem 1rem;
          cursor: pointer;
        }
        .ghost:hover {
          color: var(--text);
        }
        .chips {
          display: flex;
          flex-wrap: wrap;
          gap: 0.4rem;
          margin-top: 0.6rem;
        }
        .chip {
          background: var(--panel);
          border: 1px solid var(--border);
          color: var(--muted);
          border-radius: 999px;
          padding: 0.35rem 0.75rem;
          font-size: 0.8rem;
          cursor: pointer;
        }
        .chip:hover:not(:disabled) {
          color: var(--text);
          border-color: var(--accent);
        }
        .chip:disabled {
          opacity: 0.5;
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
