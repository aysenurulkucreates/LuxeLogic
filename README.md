# LuxeLogic

A multi-tenant SaaS backend for clinic management: appointments, customers, products, sales and staff, with role-based access and real-time updates.

Each clinic is a tenant. Clinics sign up on their own, share one database, and can only ever see their own data. Inside a clinic, what a user can see and do depends on their role.

> **Status:** in active development. Tenant scoping, input validation and login rate limiting are in place; the current focus is tests, then Docker and deployment. See [Roadmap](#roadmap).

---

## Why this project is interesting

- **Tenant isolation enforced in one place.** Resolvers don't write `tenantId` filters by hand. They get a database client that is locked to the caller's clinic (a Prisma Client Extension), so a new resolver can't forget the filter. The tenant always comes from the authenticated user, never from the client.
- **A role matrix enforced on the server.** Every resolver starts with a single `requireAuth` or `requireRole` line. The UI hides what a role can't use, but the server is the security boundary.
- **No double booking, even under concurrency.** PostgreSQL exclusion constraints reject overlapping appointments for the same doctor or customer, so two requests at the same moment can't both get the same slot.
- **Validated input at the boundary.** Mutation inputs are checked with zod schemas before they reach the database.
- **Real-time updates and record locking** with Socket.io, authenticated through the same gate as the GraphQL API.
- **Audited and hardened.** I ran a line-by-line audit of my own codebase (72 findings, 6 critical) and have been fixing them in priority order: cross-tenant reads and writes, missing role checks, data leaks through real-time events, error messages that revealed whether a record existed, brute-force sign-in attempts and unvalidated input.

---

## Tech stack

| Layer | Technologies |
| --- | --- |
| Backend | Node.js, TypeScript, Express 5, GraphQL (Apollo Server), Prisma 7, PostgreSQL, Socket.io |
| Auth and security | JWT (HS256), bcrypt, rate-limiter-flexible |
| Validation | zod |
| Frontend | React 19, TypeScript, Vite, Apollo Client, Tailwind CSS |

The focus of this project is the backend. The frontend's UI was generated with an AI tool (Gemini). I built the parts that connect it to the backend (GraphQL queries and mutations, Socket.io, authentication), using AI tools along the way, and later reviewed and fixed the client: shared error and loading states, one shared socket connection, centralized page permissions and session handling.

---

## Features

- **Clinics (tenants):** self-serve sign-up; the person who signs up becomes the clinic admin.
- **Appointments:** create, edit, change status; no double booking for the staff member or the customer, enforced by the database.
- **Customers:** search, add, edit, soft delete.
- **Products and sales:** stock is lowered on a sale and restored when a sale is deleted (refund), inside one transaction.
- **Staff:** the admin adds staff and gets a random temporary password to share; removed staff are deactivated, not deleted.
- **Dashboard:** revenue and activity stats for the clinic admin.
- **Real time:** other open windows update live; a record being edited is locked for others.

---

## Roles and permissions

| | Clinic admin | Doctor | Secretary |
| --- | --- | --- | --- |
| Dashboard (revenue, stats) | ✓ | ✗ | ✗ |
| Appointments | All | Own only | All |
| Create / edit appointments | ✓ | Own only | ✓ |
| Change appointment status | ✓ | Own only | ✓ |
| Delete appointments | ✓ | ✗ | ✗ |
| Customers: view, add, edit | ✓ | ✓ | ✓ |
| Delete customers (soft delete) | ✓ | ✗ | ✗ |
| Products | Full | View | View |
| Make a sale | ✓ | ✓ | ✓ |
| Delete a sale (refund) | ✓ | ✗ | ✗ |
| Staff | ✓ | ✗ | ✗ |

- **Nurses** appear on the clinic's staff list but don't get a login account.
- **The platform admin** manages clinics and sees platform-wide totals, but doesn't work inside a clinic's records.

---

## Architecture

```text
React client ── GraphQL (HTTP) ──┐
       │                         ├── getUserFromToken ── tenant-scoped Prisma client ── PostgreSQL
       └──── Socket.io ──────────┘   (one auth gate)      (locked to the user's clinic)
```

- **One auth gate.** Both the GraphQL context and the Socket.io middleware call `getUserFromToken`. It verifies the token, loads the user from the database, and returns nothing for invalid tokens, deactivated staff and nurse accounts. A rule added there applies to both entry points at once.
- **Identity from the database, not the token.** The token only carries the user's id. Role and tenant are read from the database on every request, so a role change or a deactivation takes effect immediately instead of when the token expires.
- **A database client per request, locked to one clinic.** After authentication, the context builds `db`, a Prisma client with a tenant-scope extension. Every read, update, delete, count and aggregate on clinic data gets `tenantId` added to its `where`, after the caller's own filters, so a value sent by the client can't override it. If there's no signed-in user, `db` is `null`: the API fails closed instead of running an unscoped query.
- **The server picks the socket room.** After authentication, the server joins the socket to the user's own clinic room. Clients can't choose a room.
- **Typed errors.** Small helpers (`unauthenticated`, `forbidden`, `badInput`) set the GraphQL error code. The frontend reacts to the code: an authentication error ends the session, a permission error shows a message.

---

## Engineering decisions

**Tenant scoping moved from every resolver to one extension.**
At first, each resolver added `tenantId` to its own queries. That worked, but a single forgotten filter in a new resolver would quietly leak another clinic's data. The scoping now lives in one Prisma Client Extension, so isolation no longer depends on remembering a line in every query.

**Same answer for "not found" and "not yours".**
Records are looked up together with the caller's tenant. If nothing matches, the API returns the same `FORBIDDEN` message whether the record doesn't exist or belongs to another clinic, so ids from other clinics can't be probed.

**Soft delete for customers and staff.**
Past appointments and sales must be kept. Deleting a customer sets `deletedAt`; removing a staff member sets `isActive: false`. Lists, lookups and dashboard counts filter both out.

**Sales aren't editable.**
A sale works like a receipt: a wrong sale is deleted (which restores the stock) and entered again. That keeps the stock logic in two simple, tested places instead of a multi-product update.

**Double booking is blocked by the database, not only by the code.**
Before saving, the resolver checks for an overlapping appointment. But the check and the insert are two separate steps: two requests at the same moment can both pass the check and both insert (a check-then-act race). A transaction doesn't fix it, because in PostgreSQL's default isolation level neither request sees the other's uncommitted insert, and there's no existing row to lock. Two exclusion constraints now enforce the rule in PostgreSQL itself: the same doctor, or the same customer, can't have two active appointments whose time ranges overlap. Cancelled appointments don't count, back-to-back appointments are allowed, and reopening a cancelled appointment is rejected if its slot has been taken. The application check stays, because it gives a clear message in the normal case; if the constraint fires (`23P01`), that error is turned into the same readable message.

```sql
ALTER TABLE "Appointment"
  ADD CONSTRAINT appointment_staff_no_overlap
  EXCLUDE USING gist ("staffId" WITH =, tsrange("startTime", "endTime") WITH &&)
  WHERE (status <> 'CANCELLED');
-- the same for "customerId"
```

**Stock can't go below zero, even with two sales at once.**
A sale lowers the stock with one conditional update (`stock >= quantity`, then decrement), inside the same transaction as the sale. If two people sell the last item at the same moment, only one update matches; the other gets an "insufficient stock" error instead of a negative stock.

**Sign-in attempts are rate limited.**
Failed sign-ins are counted per email and IP (5 per 15 minutes) and per IP (50 per hour). A blocked user is told how many minutes to wait, and a successful sign-in resets the counter for that email.

**Input is validated before it touches the database.**
Each mutation passes its input through a zod schema (required fields, formats, positive prices and quantities). The first problem is returned as a `BAD_USER_INPUT` error with a readable message, and sign-up no longer returns raw database errors to the client.

**Socket events carry only an id.**
Events used to broadcast full records, including customer details, to everyone in the clinic. Now they only say "appointment X changed", and each client refetches through GraphQL, which already applies the role rules. Authorization lives in one place; the cost is one extra request per event.

**Events are emitted after the transaction commits.**
Otherwise other windows could be told about a sale that was rolled back.

**Staff and login accounts are created atomically.**
A staff member who signs in gets a `User` linked to their `Staff` record, created in one transaction. A unique constraint on the email handles two admins adding the same person at the same moment.

**Sessions end cleanly.**
Any authentication error, from GraphQL or Socket.io, ends the session in one place: the token is removed and the app reloads on the sign-in page with a "session expired" message. The full reload resets the Apollo cache, the socket connection and the auth state together.

---

## Getting started

### Requirements

- Node.js 20.19 or later (required by Vite 7; the backend scripts also use `--env-file`)
- A running PostgreSQL server. You don't need to create the database yourself: `prisma migrate dev` creates it.
- Port 4000 (backend) and 5173 (frontend) free. Both are currently fixed in the code.

### Backend

```bash
cd backend
npm install
cp .env.example .env
```

Fill in `.env`:

```dotenv
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/luxelogic"
JWT_SECRET="a-long-random-string"
```

Apply the migrations, generate the Prisma client and start the server:

```bash
npx prisma migrate dev
npm run generate
npm run dev
```

The GraphQL API runs at `http://localhost:4000/graphql`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The app runs at `http://localhost:5173`. Sign up to create a clinic; you'll be its admin. Then add staff from the Staff page and share the temporary password shown once.

---

## Known limitations

- API and socket URLs, the backend port and the allowed CORS origins are hard-coded for local development.
- Record locking is enforced in the UI only; the server doesn't yet reject a save on a locked record.
- Staff contact details are readable by every role through the staff list query (the secretary needs the doctor list when booking).
- Staff updates don't use a zod schema yet.
- The platform admin currently uses an unscoped database client; it will get its own limited set of queries.
- Sign-in rate limits are kept in memory, so they reset when the server restarts and aren't shared between instances.
- No automated tests yet.

---

## Roadmap

- [x] Tenant scoping in one place with a Prisma Client Extension, replacing hand-written `tenantId` filters
- [x] Remove the `any` types from the GraphQL context
- [x] Input validation with zod (customers, products, sales, appointments, sign-up); atomic stock updates
- [x] Rate limiting for sign-in
- [x] Database-level protection against double booking (exclusion constraints)
- [x] Profile updates: zod validation, and the current password is required to change the email or password
- [ ] zod for staff updates; remove the remaining `any` types in resolver arguments
- [ ] Server-side record locking
- [ ] Tenant isolation and critical-flow tests
- [ ] 14-day trial and suspension for clinics
- [ ] Docker, CI (lint, test, build) and deployment
- [ ] Demo account with seed data
