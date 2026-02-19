# Everyday

pnpm monorepo (pnpm@9, Node >=20). Workspaces defined in `pnpm-workspace.yaml` covering `apps/*` and `packages/*`. TypeScript (strict, ES2020) throughout with a shared `tsconfig.base.json`.

## apps/mobile

Expo SDK 54 React Native app (React 19, RN 0.81). Entry point is `index.js` -> `App.tsx`. Uses `expo start` for dev. The app reads `EXPO_PUBLIC_API_URL` from `.env.local` to reach the API. Currently has a health-check screen that fetches `/health` and validates the response with the shared Zod schema. EAS builds configured via root scripts (`eas:ios`, `eas:android`).

## apps/api

Express 4 server. Entry at `src/index.ts` which loads dotenv then starts listening (default port 3000). App setup in `src/app.ts` — CORS, JSON body parser, and route mounting. Routes live in `src/routes/`. Database is PostgreSQL via Drizzle ORM; schema in `src/db/schema.ts` (currently a `users` table), connection singleton in `src/db/client.ts` using `DATABASE_URL`. Drizzle config at `drizzle.config.ts`, migrations output to `./drizzle`. Dev runs via `tsx watch`. DB commands: `db:generate`, `db:migrate`, `db:studio`.

## packages/shared

Shared library consumed by both apps as `"shared": "workspace:*"`. Exports Zod schemas (`src/schemas.ts`), inferred TypeScript types (`src/types.ts`), and constants (`src/constants.ts`). Must be built (`tsc`) before dependents can use it; `prepare` script handles this automatically on install.

## Dev workflow

`pnpm dev` runs `scripts/dev.sh` which starts the API in the background and Expo in the foreground. `pnpm dev:api` and `pnpm dev:mobile` run them individually.
