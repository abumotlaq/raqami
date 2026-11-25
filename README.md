# Raqami (رَقْمي)

Raqami is a digital products store. It sells downloadable items only: ebooks, templates, code, and sound effects. There is no shipping and no physical product. After payment, the customer downloads the file immediately from their library.

This is a graduation project built by a team of four. This repository contains both the frontend (`client/`) and the backend (`server/`).

## Team

| Member | Role |
|---|---|
| Osama Abdelwahab Abu Motlaq | Frontend developer |
| Mousa Sameer Dababsh | Backend developer |
| Ahlam Ibrahim Saadat | UI/UX designer |

## Tech stack

**Frontend (`client/`)**
- React and TypeScript (strict mode)
- Vite
- Tailwind CSS v4 (`@tailwindcss/vite`), configured with theme tokens in `src/index.css`
- React Router (`react-router-dom`)
- React Context with `useReducer` for auth and cart state

**Backend (`server/`)**
- Node.js and Express
- TypeScript
- Drizzle ORM with PostgreSQL (`pg`)
- Zod for request validation
- JSON Web Tokens (`jsonwebtoken`) and `bcryptjs` for authentication
- Multer for file uploads
- Swagger UI (`swagger-ui-express`) for API documentation

**Database and infrastructure**
- PostgreSQL 17 running in Docker, defined in `server/docker-compose.yml`

**Tooling**
- pnpm (version pinned by `packageManager` in each `package.json`)
- Git and GitHub for version control and pull requests
- Figma for interface design

## Repository layout

```
raqami/
├── client/   React frontend
└── server/   Express backend, database schema, and migrations
```

## Running the frontend

Prerequisites: Node.js and pnpm.

```bash
cd client
pnpm install
pnpm dev
```

Open http://localhost:5173.

The frontend reads the backend address from `client/.env.local`:

```
VITE_API_URL=http://localhost:3000/api/v1
```

Use the address the backend team gives you. Copy `client/.env.example` to `client/.env.local` and fill in the value. Never commit `.env.local`.

## Running the backend

See [server/README.md](server/README.md) for the full setup: Docker, environment variables, migrations, and seeding.

## API documentation

- The API contract and frontend specification are in the approved project report.
- With the backend running, Swagger UI is available at http://localhost:3000/api/docs.

## Development rules

- Do not commit directly to `main`. Create a branch from the latest `main`, then open a pull request.
- Each pull request needs a review from another team member before merging.
- Never commit secrets: no `.env` files, passwords, tokens, or keys.