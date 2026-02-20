# Everyday

pnpm monorepo (`pnpm@9`, Node `>=20`) with workspaces in `apps/*` and `packages/*`. TypeScript strict mode via shared `tsconfig.base.json`.

## Current architecture

### `apps/api`
- Express **5** API (`type: module`), entry at `src/index.ts`, app wiring in `src/app.ts`.
- Better Auth mounted at `/api/auth/*splat` via `toNodeHandler`.
- Auth config in `src/auth.ts`:
  - Drizzle adapter against Postgres
  - email/password enabled
  - Google OAuth enabled when `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` exist
  - Google prompt set to `select_account`
  - account linking enabled for `google` + `email-password`
  - Expo plugin enabled
- Drizzle schema files:
  - Better Auth schema: `src/db/auth-schema.ts`
  - Legacy app schema: `src/db/schema.ts` (legacy `users` table removed)
- Migrations in `apps/api/drizzle`.

### `apps/mobile`
- Expo SDK 54 app (React 19 / RN 0.81).
- Auth client in `src/lib/auth.ts` using `@better-auth/expo/client` + `expo-secure-store`.
- App-wide auth context added:
  - `src/context/auth-context.tsx` (`AuthProvider`, `useAuth`)
- Calendar-first UI now lives in Expo Router screens/components (not the old auth demo in `App.tsx`).
- Main calendar implementation is in:
  - `apps/mobile/src/components/image-calendar.tsx`
  - `apps/mobile/src/components/calendar/day-cell.tsx`
  - `apps/mobile/src/components/calendar/selected-day-memories.tsx`
- Calendar behavior notes:
  - Month view supports horizontal swipe between allowed months.
  - Tapping a day collapses to week view (single row) with that day selected.
  - Back arrow or iOS left-edge back swipe in week view resets to month view.
  - In month view, scrolling/swiping up in the memories area collapses to week view (today row).
  - In week view, pulling/swiping down from memories area resets to full month view.
  - Memory add is currently local mock state via `useDayMemories` (no backend persistence yet).

### `packages/shared`
- Shared workspace package (`shared`) with Zod schemas/types/constants.

## Local dev + database

- Local Postgres + Adminer run via Docker Compose.
- Key root scripts:
  - `pnpm dev` / `pnpm dev:full`: starts DB, API, and mobile
  - `pnpm dev:api` (alias `pnpm api`): starts DB + API
  - `pnpm dev:mobile`: mobile only
  - `pnpm db:up`, `pnpm db:down`, `pnpm db:status`, `pnpm db:logs`, `pnpm db:psql`
  - `pnpm db:studio`: starts DB and Drizzle Studio

## Important env vars

### API (`apps/api/.env`)
- `DATABASE_URL`
- `BETTER_AUTH_SECRET`
- `BETTER_AUTH_URL` (e.g. `http://localhost:3000/api/auth`)
- `BETTER_AUTH_TRUSTED_ORIGINS`
- `APP_SCHEME` (default `everyday`)
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`

### Mobile (`apps/mobile/.env.local`)
- `EXPO_PUBLIC_API_URL` (e.g. `http://localhost:3000`)
- `EXPO_PUBLIC_APP_SCHEME` (default `everyday`)

## Notes for next sessions

- For Google OAuth, redirect URI in Google Cloud must exactly match:
  - `http://localhost:3000/api/auth/callback/google`
  - or tunnel/domain equivalent.
- Email/password -> Google linking is enabled.
- Google-first -> email/password login is **not** automatic unless a separate set-password / credential-link flow is implemented.
