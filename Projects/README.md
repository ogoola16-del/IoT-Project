# ECG Data Backend (PostgreSQL + Vercel-ready)

Converted from MySQL to **PostgreSQL**. Configured for deployment on **Vercel** (API + static) with a managed Postgres provider such as **Neon** or **Vercel Postgres**.

## Important notes about Vercel

- Vercel runs Node as **serverless functions**. Long-lived connections (MQTT) do **not** work well on pure serverless.
- Set `SKIP_MQTT=1` in Vercel environment variables if you host the MQTT subscriber on a persistent platform (Railway, Render, Fly.io, a VPS, etc.).
- For a full always-on backend (Express + MQTT), prefer Railway / Render / Fly.io / a VPS and point the frontend on Vercel to that API URL.

## Database setup

1. Create a free Postgres database at [Neon](https://neon.tech) or enable Vercel Postgres.
2. Copy the connection string into `DATABASE_URL`.
3. Run the schema once:

```bash
psql "$DATABASE_URL" -f database/schema.sql
```

Or paste the contents of `database/schema.sql` into the Neon SQL editor.

## Local development

```bash
cp .env.example .env
# edit DATABASE_URL or DB_* vars
npm install
npm run dev
```

## Vercel deployment

1. Push this repo to GitHub.
2. Import the project in Vercel.
3. Add environment variables:
   - `DATABASE_URL` = your Neon / Vercel Postgres connection string
   - `SKIP_MQTT=1` (recommended unless you solve MQTT separately)
   - `NODE_ENV=production`
4. Deploy. The `vercel.json` routes all traffic to `app.js`.

## Key changes from original MySQL version

- `mysql` / `mysql2` → `pg` (connection pool)
- `?` placeholders auto-converted to `$1, $2, ...`
- `AUTO_INCREMENT` → `SERIAL`
- `DATE_ADD(NOW(), INTERVAL 5 MINUTE)` → `NOW() + INTERVAL '5 minutes'`
- Boolean `0/1` → proper `BOOLEAN` / `TRUE`/`FALSE`
- `ER_DUP_ENTRY` → Postgres unique-violation code `23505`
- Schema file: `database/schema.sql`
- App exported for serverless; optional MQTT skip

## Scripts

| Script        | Purpose                          |
|---------------|----------------------------------|
| `npm start`   | Production (`node app.js`)       |
| `npm run dev` | Development with nodemon         |
