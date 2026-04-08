# BookAmplify — Author AI Marketing Platform

## What this is
SaaS: author uploads manuscript → AI learns voice → generates weekly social content →
author approves in 7 min/week → agent posts, replies, scouts opportunities.
Nothing posts without explicit author approval.

## Stack
- Frontend: Next.js 15 (App Router), TypeScript STRICT MODE, Tailwind CSS 4
- Backend: Supabase (Auth + PostgreSQL + pgvector + Storage + Vault)
- AI: Anthropic Claude API (model: claude-sonnet-4-20250514)
- Embeddings: OpenAI text-embedding-3-small
- Email: Resend
- Payments: Razorpay (India-first — NOT Stripe)
- Deployment: Vercel

## Commands
- npm run dev → start dev server (port 3000)
- npm run build → production build
- npm run typecheck → TypeScript check (MUST pass, strict mode)
- npm run lint → ESLint

## Non-negotiable rules
- Model string: claude-sonnet-4-20250514 (never change this)
- TypeScript strict: true — zero 'any' types, zero @ts-ignore
- Never import createAdminClient() in client components or shared lib files
- createAdminClient() lives only in src/app/api/** routes
- Every API route: validate session first, return 401 if no session
- All user input validated with Zod before touching DB or AI
- Social OAuth tokens: Supabase Vault only, never plain text columns
- Razorpay only for payments (not Stripe)
- .env.local must never be committed

## Folder structure
src/
  app/
    (auth)/login/         → login page
    (auth)/signup/        → signup + auto-create author + subscription rows
    (auth)/callback/      → Supabase OAuth callback route
    onboarding/           → 4-step wizard
    dashboard/            → sidebar layout + tabs
    api/
      authors/profile/route.ts
      upload/manuscript/route.ts
      content/generate/route.ts
      content/[id]/approve/route.ts
      content/[id]/reject/route.ts
      content/queue/route.ts
      razorpay/checkout/route.ts
      razorpay/webhook/route.ts
  components/             → reusable UI components
  lib/
    supabase/client.ts    → browser client (anon key ONLY)
    supabase/server.ts    → server client (anon key + cookies)
    supabase/admin.ts     → service role (API routes ONLY — never import elsewhere)
    claude.ts             → Anthropic SDK singleton
    openai.ts             → OpenAI SDK (embeddings only)
    razorpay.ts           → Razorpay singleton
    genreSkills.ts        → genre prompt layers
    schemas.ts            → Zod validation schemas
  agents/
    voiceExtraction.ts    → manuscript → voice_profile + book_chunks embeddings
  types/
    supabase.ts           → generated DB types

## Environment variables
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ANTHROPIC_API_KEY=
OPENAI_API_KEY=
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=
RAZORPAY_PLAN_ID=
RESEND_API_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000
