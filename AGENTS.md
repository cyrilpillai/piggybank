# Development Guidelines & Agent Memory

## Server & Build Guidelines
- **Dynamic JS/TS Reloading (HMR):** Next.js Fast Refresh handles frontend changes dynamically in real time. Do not restart the dev server (`npm run dev:web` / `next dev`) when editing React/TypeScript/CSS files.
- **Cache Integrity:** Never run `npm run build` or `next build` concurrently while `next dev` is running, as they share the `.next` cache directory and will cause Webpack module resolution errors in the running dev server.
- **Backend Reloader:** Uvicorn runs with `--reload` and automatically picks up Python changes in `apps/api`.
