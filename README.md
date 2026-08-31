# Socratic Mentor — Vercel website

AI tutor that guides students with Socratic questions instead of dumping answers.

---

## Deploy to Vercel

1. Push this repo to GitHub and import on [vercel.com](https://vercel.com).
2. Framework: **Next.js** (auto-detected).
3. Add **Environment Variables**:

| Name | Required? | Where to get it |
|------|-----------|-----------------|
| `GEMINI_API_KEY` | Recommended (free) | [Google AI Studio](https://aistudio.google.com/apikey) |
| `OPENAI_API_KEY` | Optional | [OpenAI API keys](https://platform.openai.com/api-keys) |
| `AI_MODEL` | Optional | e.g. `gemini-2.5-flash` or `gpt-4o-mini` |

If **both** keys are set, **Gemini is used first**. OpenAI is the fallback.

4. Deploy. After any env change, **Redeploy**.

---

## Run locally

```bash
cp .env.example .env.local
# set GEMINI_API_KEY and/or OPENAI_API_KEY

npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Notes

- Keys stay on the server only.
- Errors in chat explain key / billing / quota issues.
- Default models: Gemini `gemini-2.5-flash`, OpenAI `gpt-4o-mini`.
