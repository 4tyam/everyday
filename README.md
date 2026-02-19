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
pnpm --filter api db:studio
```

### One command for full local dev

```bash
pnpm dev:full
```

This starts Postgres/Adminer, then starts API + mobile dev servers.
