# 💻 Piggybank Web

The frontend web application for **Piggybank**, built with **Next.js 15 (App Router)**, **React 19**, and **Tailwind CSS**.

---

## 🌟 Features

- **Glassmorphic Financial Dashboard**: Clean, modern dark-mode interface with emerald asset highlights, crimson debt accents, and glass cards.
- **Dynamic Currency Switcher**: View total net worth, asset breakdowns, and liabilities dynamically converted to any base currency (INR, USD, EUR, GBP, AED, SGD, etc.).
- **Asset Allocation Visualizer**: Interactive progress bars and breakdown cards categorizing wealth across Equities, Real Estate, Crypto, Bullion, and Cash.
- **Debt & Liability Manager**: Track loans, outstanding credit balances, and interest rates.
- **Google OAuth 2.0**: One-tap Google Sign-In with automatic silent JWT token refresh handling.
- **Local Dev Login**: One-click bypass for instant development without needing Google Cloud credentials.
- **Mobile Responsive**: Custom bottom navigation bar on mobile and persistent sidebar on desktop.

---

## 📁 Directory Structure

```
apps/web/
├── src/
│   ├── app/                    # Next.js App Router (layout.tsx, page.tsx, globals.css)
│   ├── components/
│   │   ├── assets/             # Asset list, forms, and modals
│   │   ├── auth/               # Google login view and dev-login controls
│   │   ├── dashboard/          # Net worth cards, currency switcher, category breakdowns
│   │   ├── layout/             # Desktop sidebar, mobile navbar, top navbar
│   │   ├── liabilities/        # Liability list and modals
│   │   └── ui/                 # Reusable glass inputs, modals, and select dropdowns
│   ├── lib/
│   │   ├── analytics.ts        # Optional Google Analytics 4 integration
│   │   ├── api.ts              # Type-safe API client with automatic 401 token refresh
│   │   └── format.ts           # Multi-currency numerical formatting & symbols
│   └── types/                  # TypeScript interface definitions (User, Asset, Liability)
├── public/                     # Static icons, branding assets, and favicons
├── next.config.mjs             # Next.js build and environment configuration
├── tailwind.config.ts          # Custom color palette, animations, and glass styles
└── tsconfig.json               # TypeScript compiler configuration
```

---

## 🚀 Getting Started

### 1. Install Dependencies

From either the monorepo root or the `apps/web` directory:

```bash
cd apps/web
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env.dev`:

```bash
cp .env.example .env.dev
```

Variables:
- `PIGGYBANK_API_URL`: Backend endpoint (`http://localhost:8000/api/v1` for local development).
- `PUBLIC_GOOGLE_CLIENT_ID`: Your Google OAuth 2.0 Web Client ID.
- `PUBLIC_GA_MEASUREMENT_ID`: Google Analytics 4 Measurement ID (optional).
- `PUBLIC_ENABLE_DEV_LOGIN`: `true` to show the developer bypass button in development.

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🛠 Available Scripts

- `npm run dev`: Starts the Next.js development server on port 3000.
- `npm run build`: Compiles and produces the production Next.js build.
- `npm run start`: Runs the built production server locally.
- `npm run lint`: Runs ESLint to check for code issues.

---

## 🚢 Deployment to Vercel

The frontend is deployed to [Vercel](https://vercel.com/):
- **Root Directory**: Set to `apps/web` in Vercel Project Settings.
- **Environment Variables**:
  - `PIGGYBANK_API_URL`: Your production backend URL (`https://piggybank-api.cyrilpillai.com/api/v1`).
  - `PUBLIC_GOOGLE_CLIENT_ID`: Google Web Client ID configured with your production domain.
  - `PUBLIC_ENABLE_DEV_LOGIN`: Set to `false` in production.
