# AGENTS.md

## Task completion requirements

- All of `bun format`, `bun lint`, and `bun typecheck` must pass before considering tasks completed.
- NEVER run `bun test`. Always use `bun run test` (e.g. Vitest) once a test script exists. For changes that affect builds, routing, or production behavior, `bun run build` must pass as well.

Use **Bun** for installs and scripts (`bun install`, `bun run <script>`). Do not add or rely on `package-lock.json` for this repo.

## Project snapshot

**Lisbon Radar** is a Next.js app (App Router, TypeScript, Tailwind CSS 4). The goal is a very simple UI for **current departing and arriving planes** (data and screens not implemented yet). It follows the local `nextjs-starter` pattern: Biome + Ultracite, `next-themes`, and shadcn-ready `components.json`.

The codebase is early; proposing changes that improve clarity, performance, and long-term maintainability is welcome.

## Core priorities

1. Performance first.
2. Reliability first.
3. Keep behavior predictable under load and during failures (slow networks, partial data, refreshes).

If a tradeoff is required, choose correctness and robustness over short-term convenience.

## Maintainability

Long-term maintainability is a core priority. If you add new functionality, first check whether shared logic can live in a small module (for example under `src/lib/` or a dedicated feature folder). Duplicate logic across files is a code smell and should be avoided. Do not be afraid to change existing code. Avoid shortcuts that bolt one-off logic onto a single component when the behavior will be reused or tested.

## Package / directory roles

This is a single Next.js application (not a monorepo).

- **`src/app/`** — App Router routes, root layout, metadata, and `globals.css`. Prefer server components by default; use client components only when you need browser-only APIs or interactivity.
- **`src/components/`** — Reusable UI (e.g. theme provider, toggles). Add feature-specific components here or colocate under `src/app/` when they are route-private.
- **`src/lib/`** — Shared utilities (e.g. `cn()` for class names). Keep side effects and data-fetching helpers explicit and easy to test.
- **`public/`** — Static assets served as-is.
- **Root config** — `next.config.ts`, `biome.json`, `components.json`, `tsconfig.json`, and PostCSS/Tailwind setup define tooling; keep them aligned with how the app is actually built and linted.
