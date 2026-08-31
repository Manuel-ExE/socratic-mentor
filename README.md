# Socratic Mentor ✦ Socratic AI Tutor

AI tutor that teaches through questions, not lectures.

## API keys (Vercel Environment Variables)

| Variable | Provider | Get key |
|----------|----------|---------|
| **`XAI_API_KEY`** (preferred) | Grok / xAI | [console.x.ai](https://console.x.ai) |
| `GEMINI_API_KEY` | Google Gemini | [aistudio.google.com/apikey](https://aistudio.google.com/apikey) |
| `OPENAI_API_KEY` | OpenAI | [platform.openai.com/api-keys](https://platform.openai.com/api-keys) |
| `AI_MODEL` (optional) | Model id | e.g. `grok-4.5`, `gemini-2.5-flash`, `gpt-4o-mini` |

Priority when multiple keys are set: **Grok → Gemini → OpenAI**.

After changing env vars: **Deployments → Redeploy**.

## Routes

- `/` — landing page  
- `/chat` — live Socratic dialogue  

## Local

```bash
cp .env.example .env.local
# set XAI_API_KEY=...

npm install
npm run dev
```
