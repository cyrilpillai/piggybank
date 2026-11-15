# 🏦 Piggybank API

The backend engine for **Piggybank**, built with **FastAPI**, **Async SQLAlchemy 2.0**, and **Pydantic v2**.

---

## 🌟 Features

- **Multi-Currency Net Worth Engine**: Automatically aggregates assets and liabilities across multiple currencies (USD, INR, EUR, GBP, AED, SGD, CAD, AUD, JPY) into a user's chosen base currency using official ECB reference exchange rates.
- **Categorized Portfolio Tracking**:
  - **Assets**: Equity (Direct Stocks, Mutual Funds, ETFs), Real Estate (Residential, Commercial, Land), Bullion (Gold, Silver), Cash & Equivalents (Savings, FDs), Crypto (Bitcoin, Ethereum, Altcoins), Retirement Accounts (EPF, PPF, 401k), and Alternative Assets.
  - **Liabilities**: Home Loans, Personal Loans, Car Loans, Credit Card Debt, Student Loans, and Mortgages with interest rate tracking.
- **Authentication & Security**:
  - Google OAuth 2.0 token verification with user profile provisioning.
  - JWT Access tokens (short-lived) + rotating Refresh tokens (30 days).
  - Developer login bypass (`/api/v1/auth/dev-login`) for fast local UI development without Google credentials.
  - Environment-based validation refusing startup if default dev secrets are detected in production.
- **Database Flexibility**:
  - Local development: Zero-configuration SQLite (`aiosqlite`).
  - Production: Neon Serverless PostgreSQL with pooling (`asyncpg`).

---

## 📁 Directory Structure

```
apps/api/
├── app/
│   ├── ai/             # AI Financial Companion & MCP Layer (Phase 3 & 4)
│   ├── models/         # SQLAlchemy 2.0 database models (User, Asset, Liability)
│   ├── routers/        # API route handlers (auth, users, assets, liabilities, currencies, dashboard)
│   ├── schemas/        # Pydantic v2 request/response schemas
│   ├── services/       # Core business logic (auth, dashboard calculations, FX engine)
│   ├── config.py       # Pydantic Settings & environment validators
│   ├── database.py     # Async database engine & session dependency
│   └── main.py         # FastAPI application entrypoint & CORS middleware
├── tests/              # Pytest test suite (auth, CRUD, currency conversions, security)
├── Dockerfile          # Production container image for Cloud Run
├── requirements.txt    # Python dependencies
└── pytest.ini          # Pytest configuration
```

---

## 🚀 Getting Started

### 1. Set Up Virtual Environment

```bash
cd apps/api
python3 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
```

### 2. Configure Environment

Copy the example configuration:

```bash
cp .env.example .env.dev
```

Variables in `.env.dev`:
- `ENVIRONMENT`: Set to `development` locally.
- `DATABASE_URL`: Defaults to `sqlite+aiosqlite:///./piggybank_dev.db`.
- `JWT_SECRET`: Random 32+ character string.
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`: Optional for local dev (use dev-login bypass).
- `ALLOWED_ORIGINS`: Comma-separated client origins (`http://localhost:3000,http://127.0.0.1:3000`).

### 3. Run the API Server

```bash
uvicorn app.main:app --reload --port 8000
```

- API Base URL: `http://localhost:8000`
- Interactive OpenAPI Docs: `http://localhost:8000/docs`
- ReDoc Docs: `http://localhost:8000/redoc`

---

## 🧪 Running Tests

```bash
PYTHONPATH=. pytest tests
```

Tests run in-memory using an asynchronous SQLite database and verify:
- Unauthenticated access rejection (401 Unauthorized)
- Google OAuth and developer login flows
- Token rotation and refresh endpoint
- Multi-currency asset/liability calculations
- Production configuration security validators

---

## 📡 API Overview

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/health` / `/api/v1/health` | Service health status | No |
| `POST` | `/api/v1/auth/google` | Sign in with Google ID token | No |
| `POST` | `/api/v1/auth/dev-login` | Local dev login bypass | No *(Dev only)* |
| `POST` | `/api/v1/auth/refresh` | Exchange refresh token for new access token | No |
| `POST` | `/api/v1/auth/logout` | Revoke current user session | Yes |
| `GET` | `/api/v1/auth/me` | Fetch authenticated user profile | Yes |
| `GET` | `/api/v1/dashboard/summary` | Aggregate net worth summary in target currency | Yes |
| `GET` | `/api/v1/assets` | List user's assets | Yes |
| `POST` | `/api/v1/assets` | Create a new asset | Yes |
| `DELETE` | `/api/v1/assets/{id}` | Delete an asset | Yes |
| `GET` | `/api/v1/assets/categories` | List supported asset categories and sub-categories | Yes |
| `GET` | `/api/v1/liabilities` | List user's liabilities | Yes |
| `POST` | `/api/v1/liabilities` | Create a new liability | Yes |
| `DELETE` | `/api/v1/liabilities/{id}` | Delete a liability | Yes |
| `GET` | `/api/v1/currencies/supported` | List supported currencies | Yes |
| `GET` | `/api/v1/currencies/rates` | List current exchange rates | Yes |
