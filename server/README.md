# Backend

Node.js HTTP API with MongoDB, storefront serving, and SEO rendering. Requires
Node.js 24 or newer and a MongoDB replica set for transactions.

## Structure

```text
server/
  config/        MongoDB connection and transaction helpers
  controllers/   API and media request handlers
  cors/          Same-origin request validation
  cron/          Reserved for scheduled job entry points
  middleware/    Authentication, sessions, rate limiting, and JSON parsing
  models/        Collection access, defaults, and audit records
  routes/        Request dispatch to API and media controllers
  services/      Checkout, payments, shipping, email, images, and SEO
  utils/         Validation, content sanitization, and maintenance commands
  tests/         Unit and integration tests
  index.js       HTTP server and storefront entry point
```

The backend uses the MongoDB driver directly; `models/db.js` provides its data
access functions. Shared storefront modules are imported from `../src/shared`,
so retain the repository layout when deploying. The built storefront is served
from `../dist`.

## Setup and commands

Run from `server/`:

```sh
npm ci
```

Copy `.env.example` to `.env` if you do not already have a local environment file,
then configure MongoDB and the integrations you use. Keep secrets out of Git.

```sh
npm run dev             # Watch the backend
npm start               # Start the backend and built storefront
npm run admin           # Interactive administrator setup
npm run migrate:imagekit
npm test                # Uses an isolated in-memory MongoDB replica set
npm run format          # Apply Prettier to backend files
npm run format:check    # Check backend formatting
```

The integration test runner may download a MongoDB binary on its first run.
Build the storefront with `npm run build` from the repository root before serving
it in production. Root commands `npm run server`, `npm start`, and `npm test`
also delegate to this backend.

Requests use the existing same-origin policy. Set `SITE_URL` to the storefront
origin; local frontend requests are proxied by Vite. Raw webhook bytes are retained
for signature verification. No scheduled jobs are started automatically.
