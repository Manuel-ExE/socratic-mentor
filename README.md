# Socratic Mentor — Vercel website

A real website you can host on **[Vercel](https://vercel.com)** for free.

Same tutoring idea: guides students instead of dumping answers.  
No Telegram. No Python on your PC required for production.

---

## Deploy to Vercel (recommended)

### 1. Put the code on GitHub

1. Create a new GitHub repository.
2. Upload this `socratic-vercel` folder (or push with git).

### 2. Import on Vercel

1. Go to [vercel.com](https://vercel.com) and sign up with **GitHub**.
2. **Add New Project** → import your repo.
3. Framework: **Next.js** (auto-detected).
4. Before deploy, open **Environment Variables** and add:

| Name | Value |
|------|--------|
| `GEMINI_API_KEY` | your key from [Google AI Studio](https://aistudio.google.com/apikey) |
| `AI_MODEL` (optional) | e.g. `gemini-3.6-flash` (default) |

5. Click **Deploy**.

### 3. Open your site

Vercel gives you a URL like:

`https://socratic-mentor-xxxx.vercel.app`

That link works for anyone on the internet.

---

## Run locally (optional)

Need **Node.js 18+** installed.

```bash
cd socratic-vercel
cp .env.example .env.local
# edit .env.local and set GEMINI_API_KEY=...

npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Project structure

```
socratic-vercel/
├── app/
│   ├── page.tsx          # chat UI
│   ├── layout.tsx
│   ├── globals.css
│   └── api/chat/route.ts # server talks to Gemini
├── lib/socratic.ts       # Socratic rules + JSON parsing
├── package.json
└── README.md
```

---

## Notes

- API key stays on the **server** (Vercel env) — never exposed in the browser.
- Default model is `gemini-3.6-flash` (override with `AI_MODEL`).
- Free Vercel + free Gemini tier is enough for an MVP. Watch Gemini quota if the site is public; there is no built-in rate limit yet.
- Replies are structured JSON (`message`, `is_correct`, `hint_level`, `session_complete`). The UI shows correct/incorrect badges and a session-complete note when present.
- If replies fail, check Vercel → Project → Settings → Environment Variables and **Logs** (errors are logged server-side).
