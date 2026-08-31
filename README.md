# Socratic Mentor — Vercel website

A real website you can host on **[Vercel](https://vercel.com)** for free.

Guides students with Socratic questions instead of dumping answers.

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
| `OPENAI_API_KEY` | your key from [OpenAI API keys](https://platform.openai.com/api-keys) |
| `AI_MODEL` (optional) | e.g. `gpt-4o-mini` (default) |

5. Click **Deploy**.

### 3. Open your site

Vercel gives you a URL like:

`https://socratic-mentor-xxxx.vercel.app`

---

## Run locally (optional)

Need **Node.js 18+** installed.

```bash
cd socratic-vercel
cp .env.example .env.local
# edit .env.local and set OPENAI_API_KEY=...

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
│   └── api/chat/route.ts # server talks to OpenAI
├── lib/socratic.ts       # Socratic rules + JSON parsing
├── package.json
└── README.md
```

---

## Notes

- API key stays on the **server** (Vercel env) — never exposed in the browser.
- Default model is `gpt-4o-mini` (override with `AI_MODEL`).
- Replies are structured JSON (`message`, `is_correct`, `hint_level`, `session_complete`). The UI shows correct/incorrect badges and a session-complete note when present.
- If replies fail, check Vercel → Project → Settings → Environment Variables and **Logs**.
