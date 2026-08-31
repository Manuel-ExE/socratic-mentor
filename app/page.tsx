import Link from "next/link";

const PROMPTS = [
  "What assumptions underpin your current beliefs about…?",
  "How do you define the concept of…?",
  "In what ways might your perspective change if…?",
  "Why do you think it is important to consider…?",
  "What underlying values are in conflict in this dilemma?",
];

const FEATURES = [
  {
    n: "I",
    title: "Facilitating Self-Reflection",
    body: "Slow down the rush to answers. Each question invites you to examine what you truly think and why.",
  },
  {
    n: "II",
    title: "Surfacing Assumptions",
    body: "Hidden premises and misconceptions are drawn into the light — calmly, without judgment.",
  },
  {
    n: "III",
    title: "Guiding Independent Reasoning",
    body: "You build the argument. The mentor only lights the next step of the path.",
  },
  {
    n: "IV",
    title: "Building Durable Understanding",
    body: "Insights you arrive at yourself tend to last. Memorized answers rarely do.",
  },
];

const STEPS = [
  { title: "Choose a topic", body: "A problem, a concept, or a dilemma you want to understand more deeply." },
  { title: "Engage in dialogue", body: "Share your thinking. The mentor responds with one focused question at a time." },
  { title: "Reflect on the probes", body: "Notice assumptions, gaps, and new angles you hadn’t considered." },
  { title: "Discover insight", body: "Arrive at clarity yourself — with guidance, not a lecture." },
];

export default function LandingPage() {
  return (
    <>
      <header className="nav">
        <div className="container nav-inner">
          <Link href="/" className="nav-logo">
            <span className="mark" aria-hidden="true">
              ✦
            </span>
            Socratic Mentor
          </Link>
          <nav>
            <ul className="nav-links">
              <li>
                <a href="#how">How it Works</a>
              </li>
              <li>
                <a href="#features">Features</a>
              </li>
              <li>
                <a href="#dialogue">Example Dialogue</a>
              </li>
              <li>
                <a href="#start">Free</a>
              </li>
            </ul>
          </nav>
          <Link href="/chat" className="btn btn-gold nav-cta-desktop">
            Start Dialogue
          </Link>
          <Link href="/chat" className="btn btn-gold nav-cta">
            Start
          </Link>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="hero">
          <div className="container hero-grid">
            <div>
              <p className="hero-eyebrow">
                <span aria-hidden="true">✦</span> Digital agora for deeper thought
              </p>
              <h1>
                Socratic Mentor <span className="sep">✦</span>{" "}
                <span className="accent">Socratic AI Tutor</span>
              </h1>
              <p className="hero-sub">
                An AI that teaches through questions, not lectures. Illuminate
                your thoughts by discovering the answers yourself.
              </p>
              <p className="hero-support">
                Powered by deep philosophical inquiry. Instead of giving you
                answers, it asks the right questions — guiding you to reason,
                reflect, and truly understand.
              </p>
              <div className="hero-actions">
                <Link href="/chat" className="btn btn-gold">
                  Begin a Dialogue
                </Link>
                <a href="#how" className="btn btn-ghost">
                  See How It Works
                </a>
              </div>
            </div>
            <div className="hero-visual">
              <div className="hero-glow" aria-hidden="true" />
              <div className="hero-card">
                <p className="hero-card-label">Live dialogue preview</p>
                <div className="mini-bubble bot">
                  What do you already believe is true about this problem — and
                  why?
                </div>
                <div className="mini-bubble user">
                  I think the answer is 4, because…
                </div>
                <div className="mini-bubble bot">
                  If that step were uncertain, what would you check first?
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Prompt starters */}
        <section className="section" id="prompts">
          <div className="container">
            <div className="section-header">
              <span className="section-label">Begin anywhere</span>
              <h2>Questions that open doors</h2>
              <p>
                Sample prompts in the spirit of Socratic inquiry — use them as
                they are, or bring your own problem.
              </p>
            </div>
            <div className="prompts">
              {PROMPTS.map((q) => (
                <Link key={q} href="/chat" className="prompt-card">
                  <span className="q">“{q}”</span>
                  <span className="hint">Start with this →</span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Understanding */}
        <section className="section" id="about">
          <div className="container understand">
            <div className="understand-copy">
              <span className="section-label">The philosophy</span>
              <h2>Understanding the Socratic Mentor</h2>
              <p>
                The Socratic Mentor is an AI persona designed to embody the
                essence of Socratic philosophy. It does not act as an information
                repository. It stimulates critical thinking, self-reflection, and
                deeper understanding through dialogue and questions.
              </p>
              <p className="highlight">
                Unlike conventional AI that provides direct answers, the Socratic
                Mentor encourages you to explore and articulate your own views.
              </p>
            </div>
            <div className="understand-panel">
              <ul>
                <li>
                  <span className="ico">✦</span>
                  One useful question at a time — never a dump of answers
                </li>
                <li>
                  <span className="ico">✦</span>
                  Hints escalate only when you need them
                </li>
                <li>
                  <span className="ico">✦</span>
                  Wrong turns are met with targeted probes, not judgment
                </li>
                <li>
                  <span className="ico">✦</span>
                  Your breakthroughs are celebrated specifically
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="section" id="features">
          <div className="container">
            <div className="section-header">
              <span className="section-label">Core functions</span>
              <h2>What the dialogue is for</h2>
              <p>
                Four capacities the mentor practices with you — calm, precise,
                and always in service of your own reasoning.
              </p>
            </div>
            <div className="features">
              {FEATURES.map((f) => (
                <article key={f.n} className="feature-card">
                  <div className="feature-num">{f.n}</div>
                  <h3>{f.title}</h3>
                  <p>{f.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="section" id="how">
          <div className="container">
            <div className="section-header">
              <span className="section-label">How it works</span>
              <h2>Four steps to clearer thought</h2>
              <p>Simple enough for homework. Serious enough for hard ideas.</p>
            </div>
            <div className="steps">
              {STEPS.map((s, i) => (
                <div key={s.title} className="step">
                  <div className="step-num">{i + 1}</div>
                  <h3>{s.title}</h3>
                  <p>{s.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Sample dialogue */}
        <section className="section" id="dialogue">
          <div className="container">
            <div className="section-header">
              <span className="section-label">Example</span>
              <h2>A short dialogue</h2>
              <p>
                Notice: the mentor never hands over the full solution. It draws
                the next step from you.
              </p>
            </div>
            <div className="dialogue-wrap">
              <div className="dialogue-bar">
                <span className="dot" />
                Sample · Algebra
              </div>
              <div className="dialogue-body">
                <div className="d-msg student">
                  <div className="d-role">You</div>
                  Solve 3x + 6 = 18 for me.
                </div>
                <div className="d-msg mentor">
                  <div className="d-role">Socratic Mentor</div>
                  What would you try first to isolate the term with x?
                </div>
                <div className="d-msg student">
                  <div className="d-role">You</div>
                  Subtract 6 from both sides?
                </div>
                <div className="d-msg mentor">
                  <div className="d-role">Socratic Mentor</div>
                  Yes. After that, what remains — and what is the next small step?
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="final-cta" id="start">
          <div className="container">
            <h2>Ready to think more deeply?</h2>
            <p>
              Open a dialogue. Bring a problem, a concept, or a question you
              care about.
            </p>
            <Link href="/chat" className="btn btn-gold">
              Start Free Dialogue
            </Link>
            <p className="note">
              No account required to begin · Powered by advanced AI
            </p>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="container footer-inner">
          <div className="footer-brand">
            <div className="nav-logo">
              <span className="mark" aria-hidden="true">
                ✦
              </span>
              Socratic Mentor
            </div>
            <p>Questions over answers.</p>
          </div>
          <ul className="footer-links">
            <li>
              <a href="#how">How it Works</a>
            </li>
            <li>
              <a href="#features">Features</a>
            </li>
            <li>
              <Link href="/chat">Start Dialogue</Link>
            </li>
          </ul>
          <p className="footer-copy">
            © {new Date().getFullYear()} Socratic Mentor ✦ Socratic AI Tutor
          </p>
        </div>
      </footer>
    </>
  );
}
