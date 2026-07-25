TSH Synergy - Accounts Receivable (Scaffold)

This workspace contains a scaffold for a modern AR system split into `client/` (React + Vite) and `server/` (Node + Express + Sequelize).

Quick start (requires Docker):

1. Build and start services:

```bash
docker-compose up --build
```

2. Frontend will run on http://localhost:5173 and backend on http://localhost:8000 (API prefix `/api`).

Local dev (without Docker):

Server:
```bash
cd server
npm install
npm run dev
```

Client:
```bash
cd client
npm install
npm run dev
```

Notes:
- Environment variables are read from `server/.env` (see `server/.env.example`).
- This scaffold provides minimal implementations for auth, models, and a sample UI to build upon.
