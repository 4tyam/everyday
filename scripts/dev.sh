#!/usr/bin/env bash
set -euo pipefail

pnpm db:up

pnpm --filter api dev &
API_PID=$!

cleanup() {
  kill "$API_PID" 2>/dev/null || true
}

trap cleanup EXIT INT TERM

pnpm dev:mobile
