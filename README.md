# 🐷 Piggybank

**Piggybank** is a modern, privacy-first personal wealth and net worth tracking application designed for multi-currency portfolio management, real-time FX conversions, asset/liability tracking, and upcoming AI financial companion insights.

---

## 🏛 Architecture & Tech Stack

Piggybank is organized as an npm workspaces monorepo:

```
piggybank/
├── apps/
│   ├── api/        # FastAPI Python backend (Cloud Run)
│   └── web/        # Next.js 15 frontend (Vercel)
├── .github/
│   └── workflows/  # GitHub Actions CI/CD workflows
├── package.json    # Monorepo workspace configuration
└── .gitignore
```

### Frontend (`apps/web`)
- **Framework**: [Next.js 15](https://nextjs.org/) (App Router) + [React 19](https://react.dev/)
- **Language**: TypeScript
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) with a custom dark-mode glassmorphism theme
- **Icons**: [Lucide React](https://lucide.dev/)
- **Hosting**: [Vercel](https://vercel.com/)

### Backend (`apps/api`)
- **Framework**: [FastAPI](https://fastapi.tiangolo.com/) (Python 3.11+)
- **ORM / Database**: [SQLAlchemy 2.0 Async](https://docs.sqlalchemy.org/) with `asyncpg` (PostgreSQL) / `aiosqlite` (SQLite)
- **Data Validation & Settings**: [Pydantic v2](https://docs.pydantic.dev/) & `pydantic-settings`
- **Authentication**: Google OAuth 2.0 verification + JWT (access + rotating refresh tokens)
- **Production Database**: [Neon Serverless PostgreSQL](https://neon.tech/)
- **Hosting & CI/CD**: [Google Cloud Run](https://cloud.google.com/run) via Workload Identity Federation

---

## 🚀 Quickstart & Local Development

### Prerequisites
- **Node.js**: `v20.x` or later
- **Python**: `3.11` or later
- **Git**

### 1. Clone & Install Dependencies

```bash
# Clone the repository
git clone https://github.com/cyrilpillai/piggybank.git
cd piggybank

# Install root & frontend dependencies
npm install

# Setup backend Python virtual environment
cd apps/api
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cd ../..
```

### 2. Configure Local Environment Variables

Create `.env.dev` for both apps using the provided templates:

```bash
# Backend configuration
cp apps/api/.env.example apps/api/.env.dev

# Frontend configuration
cp apps/web/.env.example apps/web/.env.dev
```

*(For local testing without Google OAuth, the backend includes a Developer Login bypass: `john.doe@example.com`)*

### 3. Run Development Servers

From the root directory:

```bash
# Terminal 1: Run Backend API (http://localhost:8000)
npm run dev:api

# Terminal 2: Run Frontend Web (http://localhost:3000)
npm run dev:web
```

- Web UI: [http://localhost:3000](http://localhost:3000)
- Interactive API Docs: [http://localhost:8000/docs](http://localhost:8000/docs)
- API Health Check: [http://localhost:8000/api/v1/health](http://localhost:8000/api/v1/health)

---

## 🛠 Monorepo NPM Scripts

Run these from the repository root:

| Command | Action |
| :--- | :--- |
| `npm run dev:web` | Starts Next.js development server on port 3000 |
| `npm run dev:api` | Starts FastAPI uvicorn server on port 8000 with hot-reload |
| `npm run test:api` | Runs the Python test suite with `pytest` |
| `npm run build:web` | Validates TypeScript types and builds the Next.js production bundle |
| `npm run lint` | Lints the frontend application |

---

## 🔒 Security & Public Repository Practices

Piggybank is open-source and enforces strict security best practices:
- **Zero Hardcoded Secrets**: Secrets (JWT signing keys, database connection strings, OAuth client secrets) are stored in Google Cloud Secret Manager in production.
- **Fail-Safe Startup Guardrails**: In production (`ENVIRONMENT=production`), the backend automatically rejects default dev secrets and SQLite databases, terminating immediately if improperly configured.
- **Decoupled Infrastructure**: Google Cloud project IDs, service accounts, and Workload Identity providers are parameterized through GitHub Actions variables.
- **Restricted CORS**: Cross-Origin Resource Sharing is strictly scoped to authorized client domains.

---

## 🚢 Deployment Architecture

```
GitHub Push to 'main'
  ├── apps/api/** changes  ──► GitHub Actions  ──► Docker Build  ──► Google Cloud Run (Asia-Southeast1)
  └── apps/web/** changes  ──► Vercel Git Sync ──► Next.js Build ──► Vercel Edge Network
```

- **Backend**: Deployed to Google Cloud Run via `.github/workflows/deploy-api.yml` using Google Workload Identity Federation (keyless authentication).
- **Frontend**: Automatically built and deployed by Vercel with Root Directory set to `apps/web`.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
