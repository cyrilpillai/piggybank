# Web Frontend Guidelines & Agent Memory (`apps/web`)

## UI Component Architecture & Reuse Rules
- **Never create custom, one-off logic for UI components:** Always look to reuse standardized, pre-existing UI primitives from `src/components/ui/`.
- **Reusable Primitives Directory (`src/components/ui/`):**
  - `GlassModal`: Centralized modal container with fixed header, scrollable body (when needed), and sticky footer (`footer` prop).
  - `GlassSelect`: Unified glass dropdown selector with search filtering, sublabels, and icons.
  - `ConfirmDialog`: Standardized confirmation dialog for deletions and high-impact actions.
  - `GlassEmptyState`: Common empty state container with icon and callout styling.
  - `GlassSearchInput`: Unified glass search input with leading icon.
  - `GlassSlider`: Standardized range input with value tracking.
  - `PiggyLogo`: Vector logo mark.
- **New Components Pattern:** If a truly new UI pattern is required, author it as a generic, reusable primitive in `src/components/ui/` following common standard props (`className`, `children`, disabled states, accessibility aria-attributes) rather than embedding bespoke ad-hoc implementations inside feature views.

## Design System & Styling Conventions
- **iOS Liquid Glass System:** Adhere strictly to the defined Tailwind and CSS utility classes in `src/app/globals.css`:
  - Action buttons: `.ios-btn-primary`, `.ios-btn-secondary`, `.ios-btn-danger`.
  - Form inputs: `.ios-glass-input` (translucent dark glass with subtle border).
  - Segmented controls: `.ios-segmented-track` and `.ios-segmented-pill`.
  - Modals: `.ios-modal-card`, `.ios-modal-header`, `.ios-modal-footer`, `.ios-modal-backdrop`, `.ios-modal-close`.
  - Icon containers: `.ios-icon-box`, `.ios-icon-box-emerald`, `.ios-icon-box-rose`, etc.
- **Viewport Bounds & Eager Display:** Design modals and forms to fit standard viewports eagerly (~400-500px total height on desktop/laptop). Group related fields into multi-column rows (e.g. 12-column grid) to prevent unnecessary scrolling.
- **Scroll Performance:** Never add nested `overflow-y-auto` containers. Avoid redundant `backdrop-filter` on child elements inside already blurred glass cards.

## Copy & Text Centralization Rules
- **Zero Hardcoded Text Policy:** Never write raw, hardcoded user-facing strings (labels, button texts, titles, descriptions, validation messages, empty states, or tooltips) directly inside React/TSX files.
- **Centralized Source of Truth (`src/constants/copy.ts`):**
  - All user-facing copy MUST be declared inside the `COPY` object in `src/constants/copy.ts` under appropriate domain keys (e.g. `COPY.APP`, `COPY.NAV`, `COPY.NET_WORTH`, `COPY.NET_WORTH_TREND`, `COPY.ASSETS`, `COPY.LIABILITIES`, `COPY.FIRE`, `COPY.AUTH`, `COPY.COMMON`, etc.).
  - Always import and reference `COPY` in components (`import { COPY } from "@/constants/copy"`). This ensures consistent terminology and prepares the application for localization.

## Development & Server Lifecycle
- **Fast Refresh (HMR):** Next.js handles frontend changes dynamically in real time. Do not restart the dev server (`npm run dev:web` / `next dev`) when editing React, TypeScript, or CSS files.
- **Cache Integrity:** Never run `npm run build` or `next build` concurrently while `next dev` is running, as they share the `.next` cache directory and will cause Webpack module resolution errors in the running dev server.
