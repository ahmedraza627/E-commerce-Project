# ShopSwift — MERN E-Commerce Platform

A production-grade, full-stack e-commerce reference application: an **Express + MongoDB** REST API secured with rotating JWTs delivered in **HTTP-only cookies**, paired with a **React (Vite) + Redux Toolkit + Tailwind CSS** single-page storefront built mobile-first in a Linear/Vercel-inspired design language.

Every subsystem — auth, cart, checkout — has been verified end-to-end against a live MongoDB instance, including a full COD checkout flow (order created → cart cleared → inventory decremented).

---

## 1. Project Overview & Architecture

### The stack

| Layer | Technology | Role |
|---|---|---|
| Frontend | React 18 + Vite, Redux Toolkit, Tailwind CSS, Lucide icons | SPA storefront, optimistic UI, design system |
| Backend | Node.js (ESM), Express 5-style routers | REST API under `/api/v1` |
| Database | MongoDB via Mongoose | Users, Products, Carts, Orders, RefreshToken sessions |
| Auth | JWT (access + refresh) in HTTP-only cookies | Stateless per-request auth + revocable sessions |
| Validation | Zod schemas at the route layer | Every write endpoint is validated before controllers run |

The repository is an **npm-workspaces monorepo**: `npm install` at the root installs both packages, `npm run dev` boots the API (`:5000`) and the Vite dev server (`:5173`) together with `concurrently`.

```
mern-ecommerce/
├── package.json                  # workspaces: server + client, dev/seed/build scripts
│
├── server/                       # ── Express API ──────────────────────────
│   ├── .env.example              # documented environment template
│   └── src/
│       ├── server.js             # entrypoint: boot, listen, graceful shutdown
│       ├── app.js                # app factory: helmet, CORS, sanitize, hpp, rate limits
│       ├── config/env.js         # validated env config (single source of truth)
│       ├── db/connect.js         # Mongoose connection + graceful disconnect
│       ├── models/               # User, Product, Cart, Order, RefreshToken
│       ├── middleware/           # protect/authorize, Zod validate, errors, limiters, uploads
│       ├── controllers/          # auth, products, cart, orders, users
│       ├── routes/               # /api/v1 routers (mounted in routes/index.js)
│       ├── utils/                # tokens (JWT+jti), cookies, ApiError, slugify
│       └── seed/seed.js          # 2 demo accounts + 10-product catalog
│
└── client/                       # ── React SPA ────────────────────────────
    └── src/
        ├── api/                  # axios instance + single-flight refresh interceptor
        ├── app/store.js          # Redux store + auth↔cart listener middleware
        ├── features/             # slices: auth, cart, products, orders, ui
        ├── hooks/useFocusTrap.js # reusable a11y focus trap
        ├── components/           # layout / product / cart / search / ui / routing
        └── pages/                # route-level pages (home → order detail → 404)
```

### Request lifecycle

1. Vite serves the SPA and proxies `/api/*` to Express (`vite.config.js`) — in development the browser sees a same-origin API, so auth cookies remain first-party with **zero CORS complexity**.
2. Express applies its security middleware chain (helmet → CORS with credentials → JSON body parsing → cookie parsing → NoSQL-sanitize → HPP → rate limiting).
3. `protect` resolves the caller from the access-token cookie (or `Authorization: Bearer` for non-browser clients); `authorize('admin')` gates privileged routes.
4. Zod `validate(schema)` middleware rejects malformed bodies/params/query before a controller executes.
5. Controllers return a uniform envelope: `{ success, message, data }`; errors flow to one central handler that distinguishes operational `ApiError`s from unexpected faults (masked as generic 500s in production).

### Domain model highlights

- **User** — embedded address book, bcrypt (cost 12) with `select: false`, `role: customer | admin`, soft-disable via `isActive`.
- **Product** — text index for keyword search, category+price compound index, `compareAtPrice` drives a `discountPercent` virtual, `toJSON` transform adds `inStock`.
- **Cart** — one per user; line items **denormalize name/price/image** so price history survives product edits.
- **Order** — immutable snapshot of items, prices, shipping and tax at checkout time; stock decrement with per-item validation; status machine `pending → processing → shipped → delivered | cancelled`.
- **RefreshToken** — hashed session rows with UA/IP metadata, TTL index for automatic expiry cleanup.

---

## 2. Production Security & Auth Architecture

### Two-token design — the browser never sees a token in JavaScript

| Token | Lifetime | Storage | Purpose |
|---|---|---|---|
| **Access token** | 15 min | `httpOnly` cookie `accessToken` (`Authorization: Bearer` also accepted) | Authenticates every API call |
| **Refresh token** | 7 days | `httpOnly` cookie `refreshToken` | Silent renewal at `POST /auth/refresh` |

Both cookies are set `httpOnly`, `secure` in production, `sameSite=lax` (dev) / `none` (prod cross-domain, requires HTTPS), `path=/`. Because JavaScript cannot read them, an XSS payload cannot exfiltrate credentials — the highest-value property of this design.

### Session storage: hashes, never raw tokens

On login/register the server signs the refresh JWT, then stores **SHA-256(token)** — never the token itself — as a `RefreshToken` session row containing user, user-agent, IP, expiry and lineage fields (`replacedByTokenHash`, `revokedAt`, `reason`). A database leak therefore yields nothing replayable. A TTL index garbage-collects expired rows automatically.

### Rotation on every refresh

`POST /auth/refresh` is a **one-time-use** endpoint:

1. Verify the presented refresh JWT and locate its session row by hash.
2. If the row is valid → **revoke it**, record `replacedByTokenHash`, issue a brand-new token pair, set the new cookies.
3. Return the fresh access token lifetime to the client, which replays whatever request originally 401'd.

Each refresh token is signed with a random **`jti` claim** so two tokens minted in the same second can never collide on the unique hash index.

### Reuse detection (stolen-token kill switch)

If a refresh token that is *already revoked* is presented again, that is the signature of token theft or a race on a dead session. The server responds 401 and **revokes the entire token family for that user** — every descendant of the original login. The attacker and the legitimate user are both forced back to a fresh login; the stolen lineage is dead. Verified live: replaying token A after rotating to B returns 401 *and* invalidates B.

### Lifecycle & revocation

- **Logout** revokes the current session row and clears cookies.
- **Logout-all** revokes every session for the user (all devices).
- **Access expiry** is invisible to the user: the axios interceptor single-flights one `/auth/refresh`, queues concurrent 401s behind it, and replays each original request exactly once (`_retried` guard prevents loops). If refresh fails, a single `auth:logout` window event (de-duplicated per outage) drops the SPA into a logged-out state.

### Hardening checklist (wired in `app.js` / middleware)

- `helmet` security headers · CORS locked to `CLIENT_URL` **with credentials**
- `express-mongo-sanitize` (NoSQL injection) · `hpp` (parameter pollution)
- Rate limiting: global 300 req/min; a tight dedicated limiter on auth endpoints
- Zod validation on **every** write endpoint (body, params, query)
- bcrypt cost 12 · password `select: false` · generic login errors (no account enumeration)
- Central error handler: operational `ApiError`s surface meaningful messages; anything unexpected is masked as a generic 500 in production
- Stock is re-validated server-side at checkout — client totals are never trusted for money math

---

## 3. Frontend State & Performance

### Redux Toolkit architecture

| Slice | Responsibility |
|---|---|
| `auth` | Boot-time session restore (`/auth/me` probe → `initialized` gate), login/register/logout thunks, `sessionRefreshed` / `sessionExpired` driven by browser events from the API layer |
| `cart` | Optimistic cart with per-line operation ledger (below), selectors for items / count / subtotal / error |
| `products` | Catalog list with filters, sort, pagination, search; product detail cache |
| `orders` | Checkout thunk, order history + detail, admin status updates |
| `ui` | Cart drawer, search overlay, dark-mode theme (persisted), toast queue |

Cross-slice coordination lives in **`createListenerMiddleware`** (`app/store.js`), never in components: login/restore → `fetchCart()`; logout/expiry → cancel in-flight cart ops + `resetCart()`, so one user's cart can never leak into another's session.

### Optimistic cart with a per-line operation ledger

Cart mutations update the UI **instantly**, then reconcile with server truth. The race-condition core is a module-level `Map` keyed by `productId`:

1. **Supersede** — before a request fires, any in-flight request for the same line is `AbortController.abort()`-ed and sequence-stamped. A stale response returning later finds its sequence no longer current and **discards itself** — an old response can never overwrite newer state.
2. **Debounce coalescing** — quantity steppers and rapid quick-add clicks accumulate optimistically for 400ms / 350ms, then dispatch **one** network request carrying the final quantity. Ten fast taps on `+` produce one PATCH, not ten.
3. **Targeted rollback** — failures restore *only the failed line* from a per-line snapshot; concurrent successful ops on other lines are untouched.
4. **Hydration guards** — a `fetchCart` response arriving mid-mutation is skipped (it would carry pre-mutation server data and wipe the optimistic update); on logout all ops are aborted and timers cleared.

The same cancellation discipline applies to search: keystrokes abort the previous in-flight query, so a slow response can never render results for a query the user already replaced.

### Silent refresh ↔ Redux bridge

`apiClient.js` keeps a module-level `refreshPromise` as a **single-flight lock**: the first 401 creates it, every concurrent 401 awaits the same promise, and it self-releases in `finally`. Auth endpoints (`login`, `register`, `refresh`, `logout`) are excluded from the retry dance — a 401 there is a legitimate answer. Refresh success/failure is bridged into Redux via `auth:refreshed` / `auth:logout` window events, keeping the API layer store-agnostic.

### Accessibility (A11y)

- **`useFocusTrap` hook** — shared by the cart drawer and the ⌘K search overlay: Tab/Shift+Tab cycle inside the dialog, Escape dismisses, and focus **returns to the trigger element** on close (the element that opened the overlay regains focus — keyboard users never lose their place).
- Overlays render `role="dialog"` + `aria-modal="true"` with labelled controls throughout (`aria-label` on icon-only buttons), visible focus rings, and 44px+ touch targets.
- Mobile-first Tailwind: single-column grid on phones → 2/3/4 columns upward, off-canvas filters on small screens, bottom-center toasts on phones, hamburger navigation below `md`.

### Performance profile

- Production build: **~1,675 modules → ~235 KB (~79 KB gzipped)**, zero warnings.
- Catalog list, product detail and cart hydration each ship as small thunks; images are lazy-loaded with hover cross-fades pre-positioned (no layout shift).
- MongoDB indexes match query patterns: text index for search, compound `{category, price}` for the listing sort, TTL index for session cleanup.

---

## 4. API Endpoints

Base URL: **`/api/v1`** · Envelope: `{ success, message, data }` · Auth legend: 🌐 public · 🔒 `protect` (any user) · 👑 `protect` + `authorize('admin')`

### Auth

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | 🌐 | Create account (rate-limited) → sets both cookies |
| POST | `/auth/login` | 🌐 | Issue access + refresh cookies |
| POST | `/auth/refresh` | 🌐 | Rotate refresh token → new cookie pair (reuse detection enforced) |
| POST | `/auth/logout` | 🌐 | Revoke current session, clear cookies |
| POST | `/auth/logout-all` | 🔒 | Revoke **all** sessions (every device) |
| GET | `/auth/me` | 🔒 | Current user profile |

### Products

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/products` | 🌐 | List with `search`, `category`, `brand`, price range, `sort`, pagination |
| GET | `/products/meta/categories` | 🌐 | Distinct categories (+ counts) for filter UI |
| GET | `/products/:idOrSlug` | 🌐 | Product detail by id or slug |
| POST | `/products` | 👑 | Create (multipart, ≤4 images) |
| PUT | `/products/:id` | 👑 | Update (partial) |
| DELETE | `/products/:id` | 👑 | Delete |

### Cart (all routes require auth)

| Method | Endpoint | Description |
|---|---|---|
| GET | `/cart` | Current user's cart with server-computed totals |
| POST | `/cart/items` | Add `{ productId, qty }` (stock-validated) |
| PATCH | `/cart/items/:productId` | Set quantity (`qty ≥ 1`; 0 and DELETE are equivalent removes) |
| DELETE | `/cart/items/:productId` | Remove one line |
| DELETE | `/cart` | Empty the cart |

### Orders

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/orders` | 🔒 | **Checkout** from cart: snapshots prices, validates stock, decrements inventory, clears the cart. Body: `{ shippingAddress, paymentMethod: "cod" \| "card" }` |
| GET | `/orders/my-orders` | 🔒 | Paginated order history for the caller |
| GET | `/orders/:id` | 🔒 | One order (owner or admin only) |
| GET | `/orders` | 👑 | All orders, paginated |
| PATCH | `/orders/:id/status` | 👑 | Advance status: `pending → processing → shipped → delivered` (or `cancelled`) |

Pricing rules applied server-side at checkout: free shipping at **$75+** (else $5.99 flat), **8% tax**, totals recomputed from cart snapshots — never from client input.

### Users

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| PUT | `/users/me` | 🔒 | Update profile |
| GET / POST | `/users/me/addresses` | 🔒 | List / add address book entries |
| PUT / DELETE | `/users/me/addresses/:addressId` | 🔒 | Update / remove an address |
| GET | `/users` | 👑 | List users |
| PATCH | `/users/:id/active` | 👑 | Enable / disable an account |

---

## 5. Setup & Running

### Prerequisites

- **Node.js ≥ 18.18** (developed on Node 22)
- **MongoDB 6+** — a local `mongod` (default port 27017) or a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster
- npm 9+ (workspaces)

### 1 — Install

```bash
git clone <your-repo-url> && cd mern-ecommerce
npm install        # installs server + client workspaces
```

### 2 — Configure environment

```bash
cp server/.env.example server/.env
```

| Variable | Example | Notes |
|---|---|---|
| `MONGO_URI` | `mongodb://127.0.0.1:27017/mern_ecommerce` | Or an Atlas SRV string: `mongodb+srv://user:pass@cluster/…` |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | *(random hex)* | **Must differ from each other.** Generate: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` |
| `JWT_ACCESS_EXPIRES` / `JWT_REFRESH_EXPIRES` | `15m` / `7d` | Token lifetimes |
| `PORT` | `5000` | API port |
| `CLIENT_URL` | `http://localhost:5173` | CORS + cookie origin |
| `COOKIE_SECURE` / `COOKIE_SAME_SITE` | `false` / `lax` | In production behind HTTPS: `true` / `none` |

> **Atlas vs local:** local Mongo needs zero configuration; Atlas is preferred for team development and deployment — just paste the SRV URI and allow your IP in the Atlas network panel. Nothing else in the codebase changes.

### 3 — Seed demo data

```bash
npm run seed
```

Creates **2 users** and a **10-product catalog** (Unsplash imagery, sale prices, one out-of-stock item):

| Account | Email | Password | Role |
|---|---|---|---|
| Admin | `admin@shopswift.dev` | `Admin123!` | admin |
| Customer | `demo@shopswift.dev` | `Demo123!` | customer |

### 4 — Run in development

```bash
npm run dev        # API on :5000 + client on :5173, concurrently
```

- Storefront → http://localhost:5173
- Health check → http://localhost:5000/health → `{"status":"ok"}`
- The Vite dev server proxies `/api/*` to Express, so cookies stay first-party — no CORS setup needed.

### 5 — Production build

```bash
npm run build      # bundles client/dist (~79 KB gzip)
npm start          # serves the API (point a CDN/static host at client/dist)
```

### Troubleshooting

| Symptom | Fix |
|---|---|
| `Missing required environment variable: MONGO_URI` | `server/.env` missing — repeat step 2 (dotenv resolves relative to `server/`, so any launch cwd works) |
| `MongooseServerSelectionError` | Mongo isn't running / wrong `MONGO_URI`; verify with `mongosh` |
| Logged out immediately after login | Secrets missing from `.env`, or cookie flags incompatible with the origin (HTTP needs `COOKIE_SECURE=false`) |
| Port already in use | `PORT` conflict — stop the other process or change `PORT` |

### Try the full loop

Log in as the demo customer → quick-add products → open the cart drawer (watch the free-shipping progress bar) → ⌘K to search → checkout with **Cash on Delivery** → land on the order detail page. Server-side, the order snapshot is created, inventory decrements, and the cart empties atomically with the checkout.

---

## Roadmap

Stripe payment-intent flow for the `card` option · Mongo-session transactions for atomic stock decrement · reviews & ratings · admin dashboard UI (routes + upload middleware are already wired) · S3/Cloudinary image storage.
