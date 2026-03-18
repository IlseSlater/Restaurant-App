---
name: restaurant-app-specialist
description: Acts as a specialist in every aspect of the Restaurant App MVP—frontend (Angular PWA, customer/waiter/admin), backend (NestJS, Prisma, PostgreSQL), multi-tenant company scoping, order flow, WebSockets, and project conventions. Use when working on this codebase, modifying frontend or backend, debugging flows, or when the user asks about the Restaurant App, PWA, customer/waiter/admin, orders, menu, tables, or company setup.
---

# Restaurant App MVP – Project Specialist

Apply this skill when working on the Restaurant App codebase. It encodes project structure, conventions, and domain knowledge so changes stay consistent with architecture and existing patterns.

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Angular 17+ (standalone components), Angular Material, PWA (service worker) |
| **Backend** | NestJS, TypeScript |
| **Database** | PostgreSQL, Prisma ORM |
| **Real-time** | WebSocket (NestJS gateway), company-scoped rooms |
| **Auth** | JWT; staff PIN or email/password; customer phone/session |

## Project Layout

```
Restaurant App/
├── frontend/src/app/          # Angular app
│   ├── admin/                 # Admin (system + company-scoped)
│   ├── customer-pwa/          # Customer PWA (pages, guards, services)
│   ├── waiter/, kitchen, bar  # Staff UIs
│   ├── guards/                # StaffAuthGuard, CompanyGuard
│   ├── services/              # ApiService, CompanyContextService, CompanyDataService, etc.
│   ├── interfaces/            # api.interfaces.ts (User, Order, MenuItem, Company, Table…)
│   └── app.routes.ts          # Lazy-loaded routes
├── backend/src/
│   ├── modules/               # Feature modules (auth, companies, menu, orders, tables, users, …)
│   │   ├── prisma/            # PrismaService
│   │   ├── websocket/         # WebSocket gateway
│   │   ├── customer-orders/    # Customer PWA orders
│   │   └── customer-sessions/ # Customer sessions
│   └── guards/                # company-auth, roles
├── backend/prisma/schema.prisma  # Company, User, Table, MenuItem, Order, CustomerSession, …
├── scripts/                   # setup-database.js, seed-database.js
└── docs + root *.md           # TESTING-GUIDE, DEVELOPMENT, ORDER-FLOW-EXPLAINED, etc.
```

**Commands:** From repo root: `npm run dev` (frontend + backend), `npm run dev:frontend`, `npm run dev:backend`, `npm run setup:db`, `npm run seed:db`. Frontend: `http://localhost:4200`, Backend/API: `http://localhost:3000`, Swagger: `http://localhost:3000/api`.

## Multi-Tenant (Company) Model

- **Every tenant is a Company.** Staff URLs include company GUID: `/waiter/:companyGuid`, `/kitchen/:companyGuid`, `/bar/:companyGuid`, `/admin/:companyGuid`. Customer gets company context from QR/query params.
- **Backend:** All list endpoints accept `companyId` (query or from auth). Data is filtered by company in services (see COMPANY-SCOPED-FILTERING-IMPLEMENTATION.md). Never return another company’s data.
- **Frontend:** `CompanyContextService` holds current company (from URL or storage); `CompanyGuard` loads company by GUID and redirects if invalid. `CompanyDataService` is the single source for admin/waiter data (tables, menu, orders, staff) and uses a refresh-trigger pattern; always pass `companyId` when calling API and use the service’s streams instead of reassigning observables.
- **Creating entities:** Always set `companyId` from current company context (staff: from `CompanyContextService`/route; customer: from session/company in context).

## Routing and Guards

- **Customer PWA:** `/customer` → children: `phone-login`, `welcome`, `restaurants`, `scan-table`, `register`, `menu`, `cart`, `orders`, `bill`. `CustomerAuthGuard` protects menu, cart, orders, bill.
- **Staff:** `StaffAuthGuard` then `CompanyGuard` on `/waiter/:companyGuid`, `/kitchen/:companyGuid`, `/bar/:companyGuid`; `CompanyGuard` on `/admin/:companyGuid`. Staff login: `/staff/login/:companyGuid`.
- **Admin:** `/admin` → `system` (system admin), `company/new` (wizard), `:companyGuid` (company admin). System admin has no company in URL.

## Order and Real-Time Flow

- **Customer order** creates a CustomerOrder; items are split by category: **bar** (beverage, beer, wine, cocktails, etc.) vs **kitchen** (food). Backend emits `order_created_bar` and/or `order_created_kitchen` to company rooms.
- **Waiter** sees all company orders/tables via `CompanyDataService` and WebSocket (`order_created`, `customer_order_created`, `order_status_changed`, `item_status_updated`).
- **Kitchen/Bar** join `kitchen-{companyId}` / `bar-{companyId}`; they show only orders that have active food/drink items (filter out items in COLLECTED/SERVED). When waiter marks items COLLECTED/SERVED, cards disappear once no active items remain.
- **Customer** order status: backend can target `customer-{sessionId}`; frontend also refreshes/polls. Prefer fixing session-room join if real-time is required (see ORDER-FLOW-EXPLAINED.md).

## Key Frontend Conventions

- **Interfaces:** Use `app/interfaces/api.interfaces.ts` (User, Company, Table, MenuItem, Order, OrderItem, CustomerSession, etc.). Some fields differ slightly from backend (e.g. `prepTime` vs `preparationTime`); comment there explains mapping.
- **API calls:** Go through `ApiService`; pass `companyId` where applicable. Use `CompanyDataService` for admin/waiter lists and its `refresh*()` after mutations.
- **State:** Company context in `CompanyContextService`; company-scoped data and refresh in `CompanyDataService`. Customer PWA has `CustomerSessionService`, `CustomerCartService`, and session/order handlers.
- **Auth:** Staff: JWT + company in URL; store token (e.g. localStorage). Customer: phone login and session; guards enforce session for protected customer routes.

## Key Backend Conventions

- **Modules:** One NestJS module per domain (auth, companies, menu, orders, tables, users, customer-orders, customer-sessions, payments, websocket, etc.). Use Prisma for DB; inject `PrismaService`.
- **Guards:** Company and role guards protect routes; validate companyId and ensure list endpoints filter by company.
- **IDs:** Company `id` is UUID (used as GUID in URLs). Other entities use cuid. Use `companyId` on Table, MenuItem, Order, User, etc., and filter by it in all list/get operations.

## Where to Look for More

- **This skill’s detail:** [reference.md](reference.md) (paths, events, Prisma models, scripts)
- **Setup & dev:** README.md, SETUP.md, DEVELOPMENT.md
- **Testing:** TESTING-GUIDE.md (company wizard, staff PIN, customer PWA, etc.)
- **State & company data:** CENTRALIZED-STATE-MANAGEMENT.md, COMPANY-SCOPED-FILTERING-IMPLEMENTATION.md
- **URLs & guards:** GUID-URL-SYSTEM-IMPLEMENTATION-COMPLETE.md
- **Order/real-time behaviour:** ORDER-FLOW-EXPLAINED.md
- **Schema:** `backend/prisma/schema.prisma`

When changing behaviour, prefer existing services and patterns (e.g. CompanyDataService refresh, company-scoped API calls, WebSocket room names). When adding features, ensure company scoping and correct guards/routes.
