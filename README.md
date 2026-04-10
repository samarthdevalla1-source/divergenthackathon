# AfterVisit AI

AfterVisit AI is a simple website that turns doctor notes into patient-friendly after-visit instructions.

## Stack

- Frontend: plain `HTML`, `CSS`, and `JavaScript`
- Backend: one `JavaScript` serverless function in `api/simplify.js`
- Deployment: Vercel

## Environment variables

Create `.env.local` for local use or add these in Vercel:

```env
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4o-mini
```

## Project structure

```text
api/
  simplify.js
index.html
main.js
styles.css
vercel.json
```

## Deploy to Vercel

1. Import the GitHub repo into Vercel.
2. Keep the root directory as the repository root.
3. Add `OPENAI_API_KEY`.
4. Optionally add `OPENAI_MODEL=gpt-4o-mini`.
5. Deploy.
