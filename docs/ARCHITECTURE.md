# Architecture

## Overview

KaraQueue is a pnpm/Turborepo monorepo with two apps (`web`, `mobile`)
sharing business logic through internal packages, backed by a single
Supabase project (Postgres + Auth + RLS + Realtime).

## Guiding principles

1. **No duplicated business logic.** Subscription limits, queue rules, and
   validation live in `packages/shared` and `packages/validation`, imported
   by both apps.
2. **Server is authoritative.** Client-side checks (queue full, playlist
   limit) are UX conveniences only. The database/API is the real gate —
   enforced via RLS policies and transactional Postgres functions.
3. **Secrets never reach the client.** `SUPABASE_SERVICE_ROLE_KEY`,
   `YOUTUBE_API_KEY`, and Stripe secret keys are used only in server-side
   route handlers / webhooks.
4. **Native experiences, not wrappers.** The Android app is a real Expo/
   React Native app, not a WebView around the web app.

## Package boundaries

```
packages/shared       → types, subscription rules, queue/playlist domain logic
packages/validation    → Zod schemas (imports packages/shared)
packages/database      → Supabase client factories, generated DB types
packages/config        → tsconfig + eslint bases
```

`apps/web` and `apps/mobile` depend on all four packages but never depend on
each other.

## Phased build plan

| Phase | Deliverable                      |
| ----- | -------------------------------- |
| 0     | Monorepo foundation (this phase) |
| 1     | Database schema + authentication |
| 2     | Landing page + design system     |
| 3     | YouTube search                   |
| 4     | Queue system                     |
| 5     | YouTube player + auto-advance    |
| 6     | Playlists                        |
| 7     | Subscriptions + payments         |
| 8     | Android application              |
| 9     | Realtime + multi-device sync     |
| 10    | Testing & hardening              |
| 11    | Deployment                       |

Each phase is implemented, linted, type-checked, tested, and documented
before the next phase begins.

## Design system (Phase 2)

Reusable UI primitives live in `apps/web/components/ui/`:
`Button`, `Input`, `Card`, `Badge`, `SubscriptionBadge`, `Dialog`,
`Skeleton`, `LoadingSpinner`, `EmptyState`. Landing-page-specific
sections live in `apps/web/components/landing/`.

The karaoke visual identity (dark stage background, neon magenta/purple/
blue accents, glow shadows) is defined once in `apps/web/tailwind.config.ts`
and consumed everywhere via Tailwind utility classes — no ad hoc color
values elsewhere.

**Typography note:** headings use a `font-display` token that currently
falls back to the system font stack, because this build environment can't
reach `fonts.googleapis.com` to fetch a webfont at build time. Swap in a
distinctive display face via `next/font/local` (self-hosted files) or
`next/font/google` once building with internet access, by updating
`fontFamily.display` in `tailwind.config.ts`.

**A note on a debugging detour:** `apps/web/components/ui/empty-state.tsx`
briefly hit a TypeScript error (`ReactElement<unknown, ...>` not
assignable to `ReactPortal`) that turned out to be caused by importing
`ReactNode` as a named type from `"react"` instead of referencing the
ambient `React.ReactNode` namespace type. The fix — and the convention
used everywhere else in this codebase — is to type `ReactNode` props as
`React.ReactNode` without a named import.

## Why `web`'s `typecheck` script runs `next build` (Phase 3)

In this environment, plain `tsc --noEmit` against `apps/web` produces false
positives on ordinary `forwardRef`-based JSX usage (`next/link`,
`next/image`, `lucide-react` icons) — errors like `'Link' cannot be used as
a JSX component` / `Property 'children' is missing ... required in type
'ReactPortal'`. These do **not** reproduce in `next build`'s own internal
type-checking pass, which resolves TypeScript/React types differently and
succeeds consistently across repeated clean builds.

Since `next build` already performs real type-checking as part of
compiling the app, `apps/web`'s `typecheck` script runs
`next build --no-lint` (with placeholder Supabase env vars so it works
without a `.env.local`) instead of a standalone `tsc --noEmit`. This is the
authoritative check for this app; a passing `pnpm --filter web typecheck`
means the app actually type-checks and builds. Other packages
(`shared`, `validation`, `database`) still use plain `tsc --noEmit`, which
works fine for them since they contain no JSX.
