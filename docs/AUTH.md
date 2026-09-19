# Auth

## Provider

Supabase Auth, email/password only for now. The Server Action layer
(`apps/web/app/actions/auth.ts`) is the only place that calls
`supabase.auth.*`, so adding Google/Apple OAuth later means adding new
actions here without touching the rest of the app.

## Flows implemented (Phase 1)

| Flow               | Where                                                                               |
| ------------------ | ----------------------------------------------------------------------------------- |
| Sign up            | `/register` → `signUpAction` → `supabase.auth.signUp`                               |
| Email confirmation | `/auth/callback` route handler exchanges the code for a session                     |
| Sign in            | `/login` → `signInAction` → `supabase.auth.signInWithPassword`                      |
| Sign out           | `signOutAction` (used on `/dashboard`)                                              |
| Forgot password    | `/forgot-password` → `forgotPasswordAction` → `resetPasswordForEmail`               |
| Reset password     | `/reset-password` → `resetPasswordAction` → `updateUser({ password })`              |
| Profile view/edit  | `/profile` → `updateProfileAction`                                                  |
| Account deletion   | `/profile` → `deleteAccountAction` (uses the Admin API via the service-role client) |

## Session handling

- `apps/web/lib/supabase/client.ts` — browser client (Client Components).
- `apps/web/lib/supabase/server.ts` — request-scoped server client (Server
  Components, Server Actions, Route Handlers). Reads/writes the session via
  cookies.
- `apps/web/lib/supabase/middleware.ts` + `apps/web/middleware.ts` —
  refreshes the session cookie on every request and redirects
  unauthenticated requests away from protected routes
  (`/dashboard`, `/search`, `/queue`, `/playlists`, `/settings`,
  `/subscription`, `/profile`).
- `apps/web/lib/auth/require-user.ts` — a second, independent check inside
  protected Server Components, so a page never renders without a user even
  if the middleware matcher ever drifts.

## Never do this

- Never import `apps/web/lib/supabase/service-role.ts` from a Client
  Component — it's guarded with the `server-only` package so doing so is a
  build error, not just a lint warning.
- Never call `supabase.auth.admin.*` anywhere except server-only helpers
  like `apps/web/lib/auth/delete-account.ts`.

## Signup side effects

`supabase/migrations/002_create_profiles.sql` and
`003_create_subscriptions.sql` install a `handle_new_user()` trigger on
`auth.users` that automatically creates a matching `profiles` row and a
default **Free** `subscriptions` row. The app never has to remember to do
this manually, and it can't be bypassed by calling the API directly.

## OAuth (future)

Google/Apple sign-in can be added by:

1. Enabling the provider in the Supabase dashboard.
2. Adding `signInWithOAuth` calls alongside the existing email/password
   actions in `app/actions/auth.ts`.
3. Adding provider buttons to `LoginForm` / `RegisterForm`.

No schema changes are needed — `profiles` is keyed off `auth.users.id`
regardless of provider.
