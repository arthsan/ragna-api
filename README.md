<p align="center">
  <img src="public/images/ragtitle.png" alt="RagnaAPI" width="720" />
</p>

# RagnaAPI

RagnaAPI is a public **read-only** REST API (and website) for **Ragnarok Online** data (monsters and items, organized by different game “eras”).

- Website: `https://ragnapi.com`
- API base URL: `https://ragnapi.com/api`

## Endpoints (v1)

All endpoints below are **GET** and return **JSON**.

### Monsters

- `GET /api/v1/old-times/monsters/:monsterId`
- `GET /api/v1/re-newal/monsters/:monsterId`
- `GET /api/v1/re-start/monsters/:monsterId`

### Items

- `GET /api/v1/old-times/items/:itemId`
- `GET /api/v1/re-newal/items/:itemId`

> Note: the website documentation mentions other routes/resources (e.g. `re-start/items`, skills, etc.). In this repository, the endpoints above are the ones implemented under `src/pages/api/**`.

### Health

- `GET /api/health/mongo` → `{ isConnected, connectCalls }`

### Examples

```bash
curl https://ragnapi.com/api/v1/old-times/monsters/1001
curl https://ragnapi.com/api/v1/re-newal/items/501
```

## How it works (in this repository)

This project uses **Next.js (Pages Router)** to serve:

- website pages (`src/pages/*.tsx`)
- API routes (`src/pages/api/**`)

The API queries a MongoDB instance configured via environment variable and reads documents from:

- databases: `old-times`, `re-newal`, `re-start`
- collections: `monsters`, `items`

Lookup IDs are numeric (`monster_id` for monsters and `id` for items).

## Stack

- Next.js + React + TypeScript
- MongoDB (official driver)
- Typical deployment: Vercel (with CDN caching)

## Caching and responsible use

API routes set CDN-friendly cache headers via `Cache-Control` (e.g. Vercel). Still:

- cache responses client-side whenever possible
- avoid aggressive polling / unnecessary scraping

## Running locally

### Requirements

- Node.js compatible with the Next.js version in `package.json`
- Yarn (v1)
- A MongoDB instance containing the expected databases/collections

### Install

```bash
yarn install
```

### Environment variables

Create a `.env.local` file at the repo root:

```bash
MONGODB="mongodb+srv://<user>:<pass>@<host>/<db>?retryWrites=true&w=majority"
```

Optional (analytics):

- `NEXT_PUBLIC_GA_ID` (GA4 Measurement ID on the client)
- `GA4_API_SECRET` (Measurement Protocol secret for server-side events from `/api/**`)
- `GA4_MEASUREMENT_ID` (server-side alternative to `NEXT_PUBLIC_GA_ID`)
- `NEXT_PUBLIC_GA_DEBUG=true` / `GA4_DEBUG=true`

### Dev

```bash
yarn dev
```

Open `http://localhost:3000`.

### Build / production

```bash
yarn build
yarn start
```

## Contributing

Contributions are welcome.

- Setup guide: `doc/setup.md`
- Engineering guidelines: `doc/guideline.md`
- Decision log: `doc/decisions.md`

## Credits / data sources

This project references community sources (e.g. iRO Wiki). See `https://ragnapi.com/about` for more context.

## License

This repository does not include a `LICENSE` file yet. If you plan to reuse/redistribute the code, please open an issue/PR to define and add a license.
