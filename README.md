# LuxeLogic

A multi-tenant SaaS backend for clinic management: appointments, customers, products, sales and staff, with role-based access and real-time updates.

Each clinic is a tenant. Clinics sign up on their own, share one database, and can only ever see their own data. Inside a clinic, what a user can see and do depends on their role.

> **Status:** in active development. The current focus is security and tenant isolation. See [Roadmap](#roadmap).

---

## Why this project is interesting

- **Tenant isolation enforced on the server.** The tenant always comes from the authenticated user, never from the client. Every query and every real-time event is scoped to the caller's clinic.
- **A role matrix enforced in one place.** Every resolver starts with a single `requireAuth` or `requireRole` line. The UI hides what a role can't use, but the server is the security boundary.
- **Real-time updates and record locking** with Socket.io, authenticated through the same gate as the GraphQL API.
- **Audited and hardened.** I ran a line-by-line audit of my own codebase (72 findings, 6 critical) and have been fixing them in priority order: cross-tenant reads and writes, missing role checks, data leaks through real-time events, and error messages that revealed whether a record existed.

---

## Tech stack

| Layer | Technologies |
| --- | --- |
| Backend | Node.js, TypeScript, Express 5, GraphQL (Apollo Server), Prisma 7, PostgreSQL, Socket.io |
| Auth | JWT, bcrypt |
| Frontend | React 19, TypeScript, Vite, Apollo Client, Tailwind CSS |

The focus of this project is the backend. The frontend's UI was generated with an AI tool (Gemini). I built the parts that connect it to the backend (GraphQL queries and mutations, Socket.io, authentication), using AI tools along the way, and later reviewed and fixed the client: shared error and loading states, one shared socket connection, centralized page permissions and session handling.

---

## Features

- **Clinics (tenants):** self-serve sign-up; the person who signs up becomes the clinic admin.
- **Appointments:** create, edit, change status; time-conflict checks for both the staff member and the customer.
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
       │                         ├── getUserFromToken ── Prisma ── PostgreSQL
       └──── Socket.io ──────────┘   (one auth gate)
```

- **One auth gate.** Both the GraphQL context and the Socket.io middleware call `getUserFromToken`. It verifies the token, loads the user from the database, and returns nothing for invalid tokens, deactivated staff and nurse accounts. A rule added there applies to both entry points at once.
- **Identity from the database, not the token.** The token only carries the user's id. Role and tenant are read from the database on every request, so a role change or a deactivation takes effect immediately instead of when the token expires.
- **The server picks the socket room.** After authentication, the server joins the socket to the user's own clinic room. Clients can't choose a room.
- **Typed errors.** Small helpers (`unauthenticated`, `forbidden`, `badInput`) set the GraphQL error code. The frontend reacts to the code: an authentication error ends the session, a permission error shows a message.

---

## Engineering decisions

**Same answer for "not found" and "not yours".**
Records are looked up together with the caller's tenant. If nothing matches, the API returns the same `FORBIDDEN` message whether the record doesn't exist or belongs to another clinic, so ids from other clinics can't be probed.

**Soft delete for customers and staff.**
Past appointments and sales must be kept. Deleting a customer sets `deletedAt`; removing a staff member sets `isActive: false`. Lists, lookups and dashboard counts filter both out.

**Sales aren't editable.**
A sale works like a receipt: a wrong sale is deleted (which restores the stock) and entered again. That keeps the stock logic in two simple, tested places instead of a multi-product update.

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
- Input validation is hand-written in the resolvers; there's no schema validation library yet.
- No automated tests yet.

---

## Roadmap

- [ ] Tenant scoping in one place with a Prisma Client Extension, replacing hand-written `tenantId` filters
- [ ] Remove the remaining `any` types from the GraphQL context
- [ ] Input validation with zod; atomic stock updates
- [ ] Tenant isolation and critical-flow tests
- [ ] 14-day trial and suspension for clinics
- [ ] Docker, CI (lint, test, build) and deployment
- [ ] Demo account with seed data
