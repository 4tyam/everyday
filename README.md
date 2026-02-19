# Everyday Monorepo

## Local Postgres (Docker)

This repo includes a local PostgreSQL instance for development via Docker Compose.

### Services

- `postgres` on `localhost:5433`
- `adminer` on `http://localhost:8080` for browsing tables in a web UI

### Start and stop

```bash
pnpm db:up
pnpm db:status
pnpm db:logs
pnpm db:down
```

### API environment

Use the API env file:

```bash
cp apps/api/.env.example apps/api/.env
```

The default `DATABASE_URL` is:

```bash
postgres://postgres:postgres@localhost:5433/everyday
```

### Run migrations

```bash
pnpm --filter api db:migrate
```

Generate auth schema again after Better Auth config changes:

```bash
pnpm --filter api auth:generate
pnpm --filter api db:generate
pnpm --filter api db:migrate
```

### Open a SQL shell

```bash
pnpm db:psql
```

### Browse tables

Option 1: Adminer

- Open `http://localhost:8080`
- System: `PostgreSQL`
- Server: `postgres`
- Username: `postgres`
- Password: `postgres`
- Database: `everyday`

Option 2: Drizzle Studio

```bash
pnpm db:studio
```

## Better Auth (Email + Password)

### API env

`apps/api/.env` now expects:

- `BETTER_AUTH_URL` (default `http://localhost:3000/api/auth`)
- `BETTER_AUTH_SECRET`
- `BETTER_AUTH_TRUSTED_ORIGINS` (comma-separated)
- `APP_SCHEME` (default `everyday`)

OAuth placeholders are already in `.env`/`.env.example` for phase 2:

- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
- `APPLE_CLIENT_ID`, `APPLE_TEAM_ID`, `APPLE_KEY_ID`, `APPLE_PRIVATE_KEY`

### Google OAuth setup

1. Create OAuth credentials in Google Cloud Console (Web application).
2. Add this authorized redirect URI:
   - `http://localhost:3000/api/auth/callback/google`
   - Or `<your-public-auth-url>/api/auth/callback/google` in tunneled/dev cloud setups.
3. Put credentials in `apps/api/.env`:
   - `GOOGLE_CLIENT_ID=...`
   - `GOOGLE_CLIENT_SECRET=...`
4. Restart the API.

### Mobile env

`apps/mobile/.env.local` should include:

```bash
EXPO_PUBLIC_API_URL=http://localhost:3000
EXPO_PUBLIC_APP_SCHEME=everyday
```

For physical device testing, use your machine LAN IP:

```bash
EXPO_PUBLIC_API_URL=http://<your-lan-ip>:3000
```

### Auth endpoints

Better Auth is mounted at:

- `http://localhost:3000/api/auth/*`

### One command for full local dev

```bash
pnpm dev:full
```

This starts Postgres/Adminer, then starts API + mobile dev servers.

## Linting and formatting (Biome)

Run from repo root:

```bash
pnpm lint
pnpm lint:fix
pnpm format
pnpm format:check
pnpm format:write
pnpm check
pnpm check:fix
```
