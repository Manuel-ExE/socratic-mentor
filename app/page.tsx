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

      <style jsx>{`
        .page {
          min-height: 100vh;
          display: flex;
          align-items: stretch;
          justify-content: center;
          padding: 1.5rem 1rem;
        }
        .frame {
          width: 100%;
          max-width: 680px;
          min-height: calc(100vh - 3rem);
          display: flex;
          flex-direction: column;
          background: var(--glass);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1px solid var(--glass-border);
          border-radius: 24px;
          box-shadow: 0 24px 80px rgba(0, 0, 0, 0.45);
          overflow: hidden;
        }
        .header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1.1rem 1.35rem;
          border-bottom: 1px solid var(--glass-border);
          flex-shrink: 0;
        }
        .brand {
          display: flex;
          align-items: center;
          gap: 0.7rem;
        }
        .spark {
          color: var(--accent);
          font-size: 1.25rem;
        }
        h1 {
          font-size: 1.2rem;
          font-weight: 700;
          letter-spacing: -0.01em;
        }
        .tag {
          font-size: 0.78rem;
          color: var(--muted);
          margin-top: 0.15rem;
        }
        .chat {
          flex: 1;
          overflow-y: auto;
          padding: 1.25rem 1.35rem;
          display: flex;
          flex-direction: column;
          gap: 0.85rem;
        }
        .bubble {
          max-width: 92%;
          padding: 1rem 1.15rem;
          border-radius: var(--radius);
          font-size: 0.95rem;
          line-height: 1.55;
          white-space: pre-wrap;
          border: 1px solid transparent;
        }
        .bot {
          align-self: flex-start;
          background: var(--mentor-bg);
          border-color: rgba(167, 139, 250, 0.28);
        }
        .user {
          align-self: flex-end;
          background: var(--student-bg);
          border-color: rgba(232, 121, 249, 0.32);
        }
        .dim {
          opacity: 0.7;
          font-style: italic;
          color: var(--muted);
        }
        .badge {
          display: inline-flex;
          width: 1.2rem;
          height: 1.2rem;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          font-size: 0.7rem;
          font-weight: 700;
          margin-right: 0.35rem;
        }
        .badge.ok {
          background: rgba(22, 101, 52, 0.55);
          color: #86efac;
        }
        .badge.no {
          background: rgba(127, 29, 29, 0.5);
          color: #fca5a5;
        }
        .done {
          margin-top: 0.5rem;
          padding-top: 0.5rem;
          border-top: 1px solid var(--glass-border);
          color: #86efac;
          font-size: 0.85rem;
        }
        .composer {
          flex-shrink: 0;
          padding: 1rem 1.25rem 1.2rem;
          border-top: 1px solid var(--glass-border);
          background: rgba(0, 0, 0, 0.2);
        }
        .row {
          display: flex;
          gap: 0.55rem;
        }
        input {
          flex: 1;
          background: rgba(0, 0, 0, 0.35);
          border: 1px solid var(--glass-border);
          border-radius: 999px;
          padding: 0.85rem 1.25rem;
          color: var(--text);
          outline: none;
        }
        input::placeholder {
          color: var(--muted);
        }
        input:focus {
          border-color: var(--accent);
          box-shadow: 0 0 0 3px var(--accent-dim);
        }
        .btn-send {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          padding: 0.85rem 1.25rem;
          border-radius: 999px;
          border: 1px solid var(--accent);
          background: transparent;
          color: var(--accent);
          font-weight: 650;
          font-size: 0.82rem;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          cursor: pointer;
          white-space: nowrap;
          transition: background 0.15s, color 0.15s;
        }
        .btn-send:not(:disabled):hover {
          background: var(--accent);
          color: #1a0a2e;
        }
        .btn-send:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
        .btn-ghost {
          background: transparent;
          border: 1px solid var(--glass-border);
          color: var(--muted);
          border-radius: 999px;
          padding: 0.45rem 0.95rem;
          font-size: 0.82rem;
          cursor: pointer;
        }
        .btn-ghost:hover {
          color: var(--text);
          border-color: rgba(255, 255, 255, 0.3);
        }
        .chips {
          display: flex;
          flex-wrap: wrap;
          gap: 0.45rem;
          margin-top: 0.75rem;
        }
        .chip {
          background: rgba(0, 0, 0, 0.25);
          border: 1px solid var(--glass-border);
          color: var(--muted);
          border-radius: 999px;
          padding: 0.4rem 0.9rem;
          font-size: 0.8rem;
          cursor: pointer;
        }
        .chip:hover:not(:disabled) {
          color: var(--accent);
          border-color: var(--accent);
          background: var(--accent-dim);
        }
        .chip:disabled {
          opacity: 0.45;
        }
        .sr-only {
          position: absolute;
          width: 1px;
          height: 1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
        }
        @media (max-width: 560px) {
          .page {
            padding: 0;
          }
          .frame {
            min-height: 100vh;
            border-radius: 0;
            border-left: none;
            border-right: none;
          }
        }
      `}</style>
    </div>
  );
}
