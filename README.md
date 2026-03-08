# AI Note Companion (Merged with AI-Note-Explainer Backend)

This project keeps the current React UI and now uses backend/features merged from `AI-Note-Explainer`:

- Supabase auth (register/login/logout)
- Student profile metadata on signup
- Notes CRUD with offline cache + sync queue
- AI generation via Supabase Edge Function (`generate-explanation`)
- AI token usage tracking
- Protected routes for dashboard/notes/add-note/ai-helper

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env` from `.env.example` and set values:

```bash
cp .env.example .env
```

3. Run the app:

```bash
npm run dev
```

## Supabase Setup

Run SQL in this order:

1. [database/schema.sql](/C:/Users/Angel/Desktop/12/ai-note-companion/database/schema.sql)
2. [database/admin_rules.sql](/C:/Users/Angel/Desktop/12/ai-note-companion/database/admin_rules.sql) (optional but needed for admin rules)

Deploy edge function:

```bash
npx supabase functions deploy generate-explanation --project-ref <your-project-ref>
```

Set function secret:

```bash
npx supabase secrets set GEMINI_API_KEY=<your_gemini_api_key> --project-ref <your-project-ref>
```

Edge function source:
- [supabase/functions/generate-explanation/index.ts](/C:/Users/Angel/Desktop/12/ai-note-companion/supabase/functions/generate-explanation/index.ts)

## Verification

- `npm run build` passes
- `npm run test` passes

`npm run lint` currently has existing pre-existing errors in UI scaffold files unrelated to this merge.
