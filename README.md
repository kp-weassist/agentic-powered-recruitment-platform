## Agentic Powered Recruitment Platform

An AI‑native recruitment platform built with Next.js, Supabase, Tailwind CSS, and shadcn/ui. It delivers end‑to‑end hiring workflows with secure authentication, modern UI components, and a foundation for AI‑assisted matching and assessments.

- **Docs**: see `docs/prd/index.md` and `docs/architecture.md`
- **Tech stack**: Next.js, TypeScript, Supabase (Auth), Tailwind CSS, shadcn/ui
- **Status**: Active development (MVP foundation: authentication, protected routes, UI shell)

## Features

- **Authentication & Sessions**: Email/password auth via Supabase with cookie‑based sessions available across Server Components, Route Handlers, and Middleware
- **Protected Routes**: Middleware‑enforced redirects for unauthenticated users; authenticated areas under `app/protected`
- **UI System**: Tailwind CSS and shadcn/ui component library preconfigured for rapid UI work
- **Dark Mode**: Theme switching via `next-themes`
- **Forms & Validation**: `react-hook-form` + `zod` for robust form handling

## Getting started

### Prerequisites

- Node.js 18+ (recommended 20+)
- A Supabase project: create one from the [Supabase dashboard](https://database.new)

### 1) Install dependencies

```bash
npm install
```

### 2) Configure environment variables

Create a `.env.local` file in the repository root with the following values from your Supabase project (API settings):

```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY=your-anon-or-publishable-key
```

These are consumed by the Supabase clients in `lib/supabase/client.ts`, `lib/supabase/server.ts`, and `lib/supabase/middleware.ts`.

### 3) Run the dev server

```bash
npm run dev
```

App runs at `http://localhost:3000`.

## Scripts

- `npm run dev`: Start Next.js in development mode (Turbopack enabled)
- `npm run build`: Build for production
- `npm run start`: Start the production server
- `npm run lint`: Run linting

## Project structure

```
app/                    # Next.js App Router pages and routes
  auth/                 # Auth flows (login, sign-up, update-password, etc.)
  protected/            # Authenticated routes
components/             # UI components (shadcn/ui + custom)
lib/                    # Supabase clients, utilities
docs/                   # PRD, architecture, and product docs
``` 

Key files:

- `middleware.ts`: Connects Supabase session handling to Next.js middleware
- `lib/supabase/*`: Browser/server clients and auth session handling
- `components/ui/*`: Generated shadcn/ui primitives

## Documentation

- PRD index: [`docs/prd/index.md`](docs/prd/index.md)
- Architecture notes: [`docs/architecture.md`](docs/architecture.md)
- Project brief: [`docs/project-brief.md`](docs/project-brief.md)

## Deployment

The app is deployable to Vercel:

1. Create a project on Vercel and import this repository
2. Add the required environment variables in Vercel Project Settings → Environment Variables
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY`
3. Deploy (Vercel will build and start automatically)

## Notes

- To customize the design system, edit `tailwind.config.ts` and `components.json`. If you want a different shadcn/ui preset, delete `components.json` and follow the [shadcn/ui installation guide](https://ui.shadcn.com/docs/installation/next).

## Acknowledgements

This project is based on the official Next.js + Supabase starter and adapted for the Agentic Powered Recruitment Platform.
