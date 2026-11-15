# Material Register

Take-home project: a web app to search, filter, sort and paginate material records (spare parts, consumables, raw materials, SAP-style data). One repo, two folders.

## Stack
- `backend/`: Node, TypeScript, Express 5, PostgreSQL (Docker Compose), Drizzle ORM + drizzle-kit, Zod, tsx
- `frontend/`: Vite, React 19, React Router 7 (SPA), Mantine, TanStack Table
- Developing inside WSL (Ubuntu). Repo lives under `~/assignment`.

## Commands
Verified against the `package.json` files. If you add or rename a script, update this list.
- Database: `docker compose up -d` (repo root; reads `backend/.env`)
- Install all (repo root): `npm run install:all`
- Both apps together (repo root): `npm run dev` (needs the database running first)
- Backend: `cd backend && npm run dev`
- Frontend: `cd frontend && npm run dev`
- Migrations (in `backend/`): `npm run db:generate` then `npm run db:migrate`; `npm run db:studio` for the browser UI
- Seed (in `backend/`): `npm run db:seed` (refuses to run if tables are not empty)
- Typecheck backend: `npm run typecheck` in `backend/`
- Typecheck frontend: `npx tsc -b` in `frontend/` (plain `tsc --noEmit` checks nothing there, because the root tsconfig only has project references)
- Frontend build / lint: `npm run build`, `npm run lint` in `frontend/`
- Ports: API on 3000 (`PORT` in `backend/.env`), Vite on 5173, which proxies `/api` to the API

## How to work with me
- I am new to Drizzle and Mantine (I normally use Prisma and MUI/Chakra). Explain new code briefly and compare with Prisma/MUI where it helps.
- For anything touching more than one file, give a short plan first and wait for my OK before writing code.
- Work in reasonable small steps, one concern at a time. Suggest a commit message after each step.
- Do not add dependencies without asking.
- Check library versions in `package.json` and current docs before using Drizzle, Mantine or React Router APIs. Do not use outdated APIs.

## Data and API rules
- Filtering, sorting and pagination happen in SQL on the server, never in the client.
- `GET /api/materials` takes search, filters, sort, `page`, `pageSize`. One Zod schema validates it. Response: `{ items, total, page, pageSize }`.
- Use Drizzle's query builder only. No SQL built from strings.
- Material numbers are text (SAP numbers keep leading zeros).
- Stable sort: always add `id` as a tiebreaker. Cap `pageSize`.
- Add indexes that match the filters and search. Verify with `EXPLAIN ANALYZE` on the seeded data.
- Return consistent errors: 400 for validation, 500 for the rest, with a clear message.

## Frontend rules
- Filters, sort and page live in URL search params. Debounce the search input.
- Handle loading, empty and error states.
- Keep components small. Keep column config separate from data fetching.
- Use Mantine only. No other UI library.

## Do not
- Run destructive database commands or edit applied migrations without asking.
- Commit `.env` or secrets.
- Read `node_modules` or generated files. Name the exact files you need.

## When compacting
Keep the current task, files changed and decisions made.

## General principle
Prioritize a working, understandable and maintainable application over unnecessary complexity.
