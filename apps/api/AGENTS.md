# Backend API Guidelines & Agent Memory (`apps/api`)

## Security & Authentication
- **All Endpoints Must Be Guarded by Auth:** Every non-public API route must require authentication via FastAPI dependency injection:
  ```python
  from app.services.auth import get_current_user
  from app.models.user import User

  @router.get("/endpoint")
  async def my_endpoint(current_user: User = Depends(get_current_user)):
      ...
  ```
  Only public endpoints (login, register, health check) may omit `get_current_user`.
- **Tenant Isolation:** Always filter database queries by `current_user.id` to strictly prevent cross-user data leakage.

## Database & Latency Optimization
- **Asynchronous SQLAlchemy:** Use `AsyncSession` from `app.database.get_db`. All database I/O must use `await session.execute(...)`.
- **Eliminate N+1 Queries:** Use joined loading (`selectinload`, `joinedload`) or batch queries instead of fetching related records in loops.
- **Index Lookups:** Ensure foreign keys and frequent filter targets (`user_id`, `category`, `scenario_id`) are indexed in SQLAlchemy models.
- **Payload Minimization:** Use focused Pydantic schemas in `app/schemas/` with response models (`response_model=...`) to return only necessary fields and avoid serialization overhead.
- **In-Memory Caching:** Cache static and rarely changing datasets (e.g. currency conversion rates, fixed categories) rather than hitting the database or external APIs repeatedly.
- **Non-Blocking I/O:** Never call synchronous blocking functions (e.g. `requests.get`, `time.sleep`) inside async endpoints. Use `httpx.AsyncClient` or `asyncio.sleep`.

## Error Handling & Validation
- **Standardized Exceptions:** Raise `fastapi.HTTPException` with precise HTTP status codes (400, 401, 403, 404, 422) and clear, human-readable error details.
- **Input Sanitization:** Validate data strictly through Pydantic models with field constraints (positive numbers, valid currency codes, bounded rates).

## Server Lifecycle
- **Automatic Reloader:** Uvicorn runs with `--reload` via `npm run dev:api` and automatically detects Python file modifications in `apps/api`. Do not manually restart the backend process for code edits.
