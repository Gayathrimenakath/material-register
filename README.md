# Material Register

A web app to search, filter, sort and paginate material records (spare parts, consumables, raw materials and tools), in the style of SAP master data. All filtering, sorting and pagination run in PostgreSQL, and table state lives in the URL, so views can be refreshed or shared.

## Tech stack

- **Backend:** Node.js, TypeScript, Express 5, PostgreSQL 17 (Docker Compose), Drizzle ORM + drizzle-kit, Zod 4
- **Frontend:** Vite, React 19, React Router 7, Mantine 9, TanStack Table 9

## Setup

Requirements: Docker, Node.js and npm (developed on Node 26).

```bash
# 1. Environment
cp backend/.env.example backend/.env

# 2. Install dependencies
npm install
npm run install:all

# 3. Start PostgreSQL
docker compose up -d

# 4. Migrate and seed the database (wait a few seconds after step 3 for
#    PostgreSQL to accept connections)
npm run db:migrate --prefix backend
npm run db:seed --prefix backend

# 5. Start backend and frontend
npm run dev
```

Open http://localhost:5173. The Vite dev server proxies `/api` to the backend, so no separate API URL or CORS configuration is needed for local development.

Other commands:

| Command | What it does |
|---|---|
| `npm run typecheck` (backend) | Run TypeScript checks without emitting files |
| `npm test` (backend) | Run the unit tests (no database needed) |
| `npm run db:generate` (backend) | Generate a SQL migration from `src/db/schema.ts` |
| `npm run db:studio` (backend) | Open Drizzle Studio to browse the data |
| `npm run build` (frontend) | Typecheck and bundle the frontend |
| `npm run lint` (frontend) | Run frontend linting |

The seed script uses a fixed Faker seed for reproducible pseudo-random sample values and never deletes existing data. It stops with an error if either `plants` or `materials` already contains rows.

To start again from scratch, run:

```bash
docker compose down -v
```

**Warning:** This deletes the PostgreSQL database volume and all data stored in it. Repeat the database and backend setup steps afterwards.

## API

### `GET /api/materials`

All parameters are optional and validated with a Zod schema. Invalid values return `400`.

| Parameter | Values | Default |
|---|---|---|
| `search` | Case-insensitive contains match on material number, description and manufacturer part number; max 100 characters | None |
| `type` | `Spare Part`, `Consumable`, `Raw Material`, `Tool` | None |
| `status` | `Active`, `Obsolete`, `Pending Review` | None |
| `plantId` | Plant ID (see `/api/plants`) | None |
| `sortBy` | `materialNumber`, `description`, `type`, `status`, `manufacturer`, `plant`, `unitPrice`, `stockQuantity`, `updatedAt` | `materialNumber` |
| `sortOrder` | `asc`, `desc` | `asc` |
| `page` | Integer ≥ 1 | `1` |
| `pageSize` | Integer 1 to 100 | `25` |

Search matches any of the three searchable fields. Search and the selected type, status and plant filters are combined with AND.

Sorting always adds `id` as a tiebreaker, providing deterministic ordering when multiple records share the same sort value.

Example response:

```jsonc
// GET /api/materials?search=bearing&type=Spare%20Part&sortBy=unitPrice&sortOrder=desc&page=1&pageSize=25
{
  "items": [
    {
      "id": 17,
      "materialNumber": "MAT-000017",
      "description": "Bearing, deep groove ball, 25mm bore",
      "type": "Spare Part",
      "status": "Active",
      "manufacturer": "SKF",
      "manufacturerPartNumber": "A3OF4H1W",
      "unitOfMeasure": "EA",
      "unitPrice": 129.5,
      "stockQuantity": 42,
      "createdAt": "2025-03-02T01:10:00.000Z",
      "updatedAt": "2026-01-14T09:30:00.000Z",
      "plant": { "id": 1, "code": "1000", "name": "Brisbane" }
    }
  ],
  "total": 263,
  "page": 1,
  "pageSize": 25
}
```

### Other endpoints

- `GET /api/plants` returns `[{ id, code, name }]`, sorted by code. Used to populate the plant filter.
- `GET /health` returns `{ "status": "ok" }`.

### Errors

Every error uses the same shape:

```json
{
  "error": {
    "message": "...",
    "details": [{ "path": "...", "message": "..." }]
  }
}
```

Validation failures (and malformed JSON bodies) return `400`, with details for validation errors. Unknown routes return `404`, and unexpected errors return `500` with a generic message. The underlying error is logged on the server only.

## Architecture and trade-offs

- **Database design.** Two tables, `plants` and `materials`, linked by a foreign key. Manufacturer is represented by two columns on `materials` (name and part number), as in the brief, rather than a separate table. This keeps the list query to one join, at the cost of possible spelling variations. Normalising manufacturers later would be a straightforward migration. `type` and `status` are PostgreSQL enums, so the database rejects invalid values. Price uses `numeric(12,2)` rather than a floating-point type. Material numbers are stored as text so prefixes and leading zeros are preserved.

- **Database-side data operations.** Filtering, sorting and pagination are handled by the Drizzle query builder. Sort fields are mapped through an allowlist rather than interpolated from user input. Search wildcards (`%` and `_`) are escaped so they are treated as literal characters.

- **URL as the source of truth.** Search, filters, sorting and page are represented by URL search parameters. A debounced search box (400 ms) updates the URL, which triggers the request. Changing search, a filter or the sort resets the page to 1. Default values are omitted from the URL to keep it clean.

- **REST API rather than tRPC.** The brief allows a REST API, and this avoided adding another dependency and build setup. The trade-off is that API types and enum values are duplicated manually on the frontend and backend. The API validates incoming values, so mismatches result in a visible validation error rather than silently producing incorrect data.

- **Frontend separation of concerns.** URL search parameters represent table state, the API client handles HTTP communication, and the data hook manages fetching and cancellation. TanStack Table handles table configuration and sorting state, while Mantine provides the UI components.

- **Stale response handling.** The data hook cancels the previous request when inputs change. While a new page loads, the previous rows remain visible under a loading overlay.

- **Headless table.** TanStack Table is used for its table logic rather than its own UI. Sorting and pagination happen in PostgreSQL, so the table displays the returned rows and reports header clicks. Mantine renders the table markup.

- **Development proxy.** Vite forwards `/api` requests to Express, avoiding separate API URL configuration during local development. The backend currently enables `cors()` for any origin, which is convenient locally but should be restricted in a real deployment.

- **Known quirks.** `type` sorts in PostgreSQL enum order (Spare Part, Consumable, Raw Material, Tool), not alphabetically. Page size is fixed at 25 in the UI, although the API accepts up to 100.

## Performance notes (EXPLAIN ANALYZE)

I ran `EXPLAIN ANALYZE` against the seeded dataset of 5,000 materials. The `materials` table is approximately 672 kB. Each timing below is from a single local run and should be treated as indicative; repeated runs vary by a few milliseconds.

**Existing indexes:** Primary keys, a unique index on `materials.material_number`, and B-tree indexes on `plant_id`, `type`, `status` and `manufacturer`.

### Standalone SELECT queries

| Query | Plan | Time |
|---|---|---:|
| `description ILIKE '%bearing%'` | Sequential scan, 263 rows | 6.9 ms |
| `material_number`, `description` or `manufacturer_part_number` `ILIKE '%bearing%'` | Sequential scan, 263 rows | 22.5 ms |
| `status = 'Active' ORDER BY updated_at DESC, id DESC LIMIT 25` | Bitmap Index Scan on `materials_status_idx`, then top-N sort | 8.0 ms |
| `type = 'Spare Part' AND status = 'Active' AND plant_id = 1` | Bitmap Index Scan on `materials_plant_id_idx`, other conditions applied as filters | 9.5 ms |

### Queries shaped like the API

These include the join to `plants`, ordering with an `id` tiebreaker and a page limit of 25.

| Query | Plan | Time |
|---|---|---:|
| Default list, sorted by material number | Index scan on `materials_material_number_unique`, stops after 26 rows | 1.3 ms |
| Search `bearing` across three columns | Same index scan, `ILIKE` applied as a filter | 1.7 ms |
| `type` + `status` + `plant_id` filters | Same index scan, rows filtered along the way | 2.4 ms |
| `count(*)` for `type = 'Tool'` | Index-only scan on `materials_type_idx` | 0.9 ms |
| Sort by `unit_price DESC` | Sequential scan, then top-N heapsort | 10.8 ms |

### Findings and decisions

- PostgreSQL uses the filter indexes where they help, including bitmap scans for selective filters and an index-only scan for counts. When a query also sorts by material number with a `LIMIT`, the planner prefers walking the material-number index in order and stopping once it has enough rows. In that plan, the filter indexes are not used.

- The standalone three-column search took longer than the description-only search (22.5 ms versus 6.9 ms). A leading-wildcard `ILIKE '%term%'` condition cannot use a standard B-tree index, so the standalone search uses a sequential scan. At 5,000 rows, the measured time is still modest.

- The API-shaped search has a different execution plan: PostgreSQL walks the material-number index in sort order, applies the search condition as a filter and stops when it has enough rows for the requested page. Its timing is therefore not directly comparable to the standalone search.

- Only the default material-number sort uses an index to provide the requested ordering. Other sorts scan the table and sort the top rows; sorting by unit price took about 11 ms in this run.

- **Indexing decision:** I added no further indexes. At the current dataset size, measured query times were acceptable. Additional indexes would add storage and write overhead without a demonstrated need. Search performance can be revisited if the dataset grows significantly.

## Tests

Run `npm test --prefix backend`. The suite has 10 small unit tests, using Node's built-in test runner through `tsx`, so there are no extra dependencies. They cover query-parameter validation (defaults, string-to-number conversion, the `pageSize` cap, allowed type and status values, the sort-column whitelist and search trimming) and the escaping of `%` and `_` in search terms. They don't need the database or Docker.

There are no API-level tests yet.

## Next steps

- **Edit route and UI:** add `PATCH /api/materials/:id` with Zod validation of the body and a 404 for unknown ids, plus a detail view in the table for editing a single material.
- **Tests for editing:** add API-level tests for the edit route (validation errors, unknown ids, `updatedAt` changing). These should run against a separate test database so they cannot change development data. The same setup could then also cover the list endpoint's pagination, filters and sorting.

## AI-assisted development

I used Claude Code (CLI, Claude Sonnet 5.5) as a development assistant throughout the project. I have experience with React and TypeScript, so I used it primarily to accelerate implementation and explore the backend and database aspects of the stack.

**How I used it**

- **Backend and database implementation:** Exploring the Drizzle schema, PostgreSQL relationships, migrations, seed data and Express API implementation.
- **Implementation and refinement:** Working through the application in small, reviewable milestones.
- **Tests:** Writing a small set of unit tests for query validation and LIKE escaping, then confirming they fail when the code under test is deliberately broken.
- **Performance investigation:** Using PostgreSQL `EXPLAIN ANALYZE` to inspect query plans, understand index usage and decide whether additional indexes were justified.

**How I validated its output**

- Reviewed generated code and design decisions rather than accepting suggestions without inspection.
- Ran TypeScript checks, builds and linting, and tested API behaviour against the local PostgreSQL database.
- Tested pagination and sorting across the seeded dataset to check that the `id` tiebreaker prevented duplicate or missing records between pages.
- Challenged suggestions that added unnecessary complexity, including simplifying the seed script and preventing it from deleting existing data.

AI assisted with implementation, but architectural decisions, code review and verification remained my responsibility.