# Raqami — Frontend

The React frontend for Raqami, a digital products store. It is part of a graduation project; the backend is in `../server`.

## Stack

- React and TypeScript (strict mode)
- Vite
- Tailwind CSS v4, configured with theme tokens in `src/index.css`
- React Router
- React Context with `useReducer` for authentication and cart state

## Setup

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

Set the backend address in `.env.local`:

```
VITE_API_URL=http://localhost:3000/api/v1
```

Open http://localhost:5173. The backend must be running for sign-in, products, cart, checkout, and downloads to work. See [../server/README.md](../server/README.md).

## Scripts

| Command | What it does |
| --- | --- |
| `pnpm dev` | Starts the development server |
| `pnpm build` | Builds the production bundle |
| `pnpm exec tsc --noEmit` | Type-checks the project |

## Structure

```
src/
├── components/   Shared UI and feature components
├── context/      AuthContext and CartContext
├── hooks/        Data-fetching hooks
├── pages/        One file per route
├── routes/       Router configuration
├── services/     api.ts, the only file that calls fetch
└── types/        Shared API types
```

## Contact

Osama Abdelwahab Abu Motlaq — oabumotlaq@gmail.com