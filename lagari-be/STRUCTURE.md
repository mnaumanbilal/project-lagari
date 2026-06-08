# lagari-be — Project structure

Aligned with [pern-alpha](C:\Nauman Data\GITHUB\Github\PERN Sample\pern-alpha): **routes** wire URLs to **controllers**; **config** loads dotenv + DB; **services** hold reusable business logic.

## Comparison

| pern-alpha | lagari-be |
|------------|-----------|
| `config/config.js` — dotenv + Sequelize CLI env | `config/config.cjs` |
| `config/database.js` — Sequelize instance | `src/config/database.ts` |
| `utils/constantSettings.js` — `PORT` | `src/config/env.ts` — `PORT`, `env.db`, JWT |
| `app.js` — middleware + `server.use(routes)` | `src/app.ts` + `src/routes/index.ts` |
| `routes/authRoute.js` — `router.post('/login', login)` | `src/routes/authRoute.ts` |
| `controllers/authController.js` — handler bodies | `src/controllers/*.controller.ts` |
| `utils/catchAsync.js` | `src/utils/catchAsync.ts` |
| `db/models`, `db/migrations` | `src/db/models`, `src/db/migrations` |

## Layout

```
lagari-be/
├── config/
│   └── config.cjs          # Sequelize CLI (DB_* from .env)
├── src/
│   ├── index.ts            # listen(PORT), connect DB
│   ├── app.ts              # Express + middleware
│   ├── config/
│   │   ├── env.ts          # dotenv + PORT + db + jwt
│   │   └── database.ts     # Sequelize from env
│   ├── routes/             # URLs only → controller + catchAsync
│   │   ├── authRoute.ts
│   │   ├── catalogRoute.ts
│   │   └── index.ts        # registerRoutes(app)
│   ├── controllers/        # Request handlers
│   ├── services/           # Catalog, cart, orders, sessions
│   ├── middleware/
│   ├── db/
│   │   ├── models/
│   │   ├── migrations/
│   │   └── seeders/
│   └── utils/
│       └── catchAsync.ts
└── .env                    # PORT, DB_PASSWORD, DB_HOST, …
```

## Env variables (`.env`)

| Variable | Example | Notes |
|----------|---------|--------|
| `PORT` | `4000` | Server port |
| `DB_HOST` | `127.0.0.1` | |
| `DB_PORT` | `5432` | |
| `DB_USER` or `DB_USERNAME` | `postgres` | pern uses `DB_USERNAME` |
| `DB_PASSWORD` | *(required)* | Your Postgres password |
| `DB_NAME` | `lagari` | |
| `DATABASE_URL` | optional | Overrides `DB_*` |
| `CORS_ORIGIN` | `http://localhost:3000` | |

## Request flow

```
HTTP → route (authRoute.ts)
     → catchAsync(controller.login)
     → controller (auth.controller.ts)
     → service / models (optional)
     → JSON response
```
