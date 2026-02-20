#!/usr/bin/env bash
set -euo pipefail

pnpm db:up

pnpm --filter api dev &
API_PID=$!

pnpm --filter api db:studio &
STUDIO_PID=$!

cleanup() {
  kill "$API_PID" 2>/dev/null || true
  kill "$STUDIO_PID" 2>/dev/null || true
}

trap cleanup EXIT INT TERM

pnpm dev:mobile
