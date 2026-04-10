# AfterVisit AI

A lightweight Next.js + TypeScript demo that converts doctor notes into patient-friendly after-visit instructions using the OpenAI API.

## Local setup

1. Install dependencies:

```bash
npm install
```

2. Configure environment variables in `.env.local`:

```env
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4o-mini
```

3. Start the dev server:

```bash
npm run dev
```

## Deploy to Vercel

1. Create or import a Vercel project from this repository.
2. Set the project root directory to `aftervisit-ts-app`.
3. Add these environment variables in Vercel:
   - `OPENAI_API_KEY`
   - `OPENAI_MODEL`
4. Deploy.

## Production scripts

- `npm run dev`
- `npm run build`
- `npm run start`
- `npm run lint`
