# Development Guidelines & Agent Memory

## Server & Build Guidelines
- **Dynamic JS/TS Reloading (HMR):** Next.js Fast Refresh handles frontend changes dynamically in real time. Do not restart the dev server (`npm run dev:web` / `next dev`) when editing React/TypeScript/CSS files.
- **Cache Integrity:** Never run `npm run build` or `next build` concurrently while `next dev` is running, as they share the `.next` cache directory and will cause Webpack module resolution errors in the running dev server.
- **Backend Reloader:** Uvicorn runs with `--reload` and automatically picks up Python changes in `apps/api`.

## Git Commit Guidelines
- **Conventional Scoped Commits:** Follow conventional scoped commit messages based on the affected package, e.g. `feat(web): ...`, `feat(api): ...`, `fix(web): ...`, `fix(api): ...`, `chore(web): ...`, `chore(api): ...`, etc.

## Copy & Text Centralization (`apps/web`)
- **Zero Hardcoded Text Policy:** Never write raw, hardcoded user-facing strings directly in `.tsx` components. All UI strings, labels, buttons, titles, descriptions, and empty state messages MUST be added to `apps/web/src/constants/copy.ts` and consumed via the `COPY` object.
