# Lisbon Radar

A small Next.js app to show **current departing and arriving planes** at Lisbon (implementation TBD).

Stack matches the local `nextjs-starter` pattern: App Router, TypeScript, Tailwind CSS 4, Biome + Ultracite, `next-themes`, shadcn-ready (`components.json`), and path alias `@/`* → `src/*`.

## Scripts (Bun)

- `bun dev` — development server
- `bun run build` / `bun start` — production
- `bun lint` — `biome check`
- `bun format` — `biome format --write`
- `bun typecheck` — `tsc --noEmit`

Install dependencies with `bun install`. Husky runs `bunx ultracite fix` on pre-commit (staged files).

## Structure

```
src/
├── app/           # routes, layout, globals.css
├── components/    # theme-provider, mode-toggle
└── lib/utils.ts   # cn() helper for shadcn
```

