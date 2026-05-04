# Jewel Backend

NestJS + PostgreSQL + TypeORM backend for the Lumina Jewelry e-commerce store.

## Prerequisites

- Node.js v20+
- PostgreSQL running locally
- A database named `jewel` created in your PostgreSQL instance

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure environment variables:
   ```bash
   cp .env.example .env
   ```
   Then edit `.env` with your database credentials:
   ```
   DATABASE_HOST=localhost
   DATABASE_PORT=5432
   DATABASE_USER=your_pg_user
   DATABASE_PASSWORD=
   DATABASE_NAME=jewel
   NODE_ENV=development
   PORT=3000
   ```

3. Start the development server:
   ```bash
   npm run start:dev
   ```

## Verify it's working

Open in browser or run:
```bash
curl http://localhost:3000/api/health
```

Expected response:
```json
{
  "success": true,
  "message": "Backend running",
  "data": {
    "db": "connected",
    "timestamp": "2026-05-03T..."
  }
}
```

## Notes

- This is built step-by-step. See `../backend-progress.md` for full build history.
- `synchronize: true` is enabled in development — schema auto-syncs from entities. Will switch to migrations before production.
- CORS is configured for `http://localhost:8080` (frontend dev server).
