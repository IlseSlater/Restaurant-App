# Restaurant App – Reference

Detailed reference for the project specialist skill. Use when you need exact paths, event names, or API patterns.

## Frontend – Key Paths

| Purpose | Path |
|--------|------|
| Routes | `frontend/src/app/app.routes.ts` |
| API interfaces | `frontend/src/app/interfaces/api.interfaces.ts` |
| Company context | `frontend/src/app/services/company-context.service.ts` |
| Company-scoped data (admin/waiter) | `frontend/src/app/services/company-data.service.ts` |
| HTTP API | `frontend/src/app/services/api.service.ts` |
| Auth | `frontend/src/app/services/auth.service.ts` |
| Staff auth guard | `frontend/src/app/guards/staff-auth.guard.ts` |
| Company guard | `frontend/src/app/guards/company.guard.ts` |
| Customer auth guard | `frontend/src/app/customer-pwa/guards/customer-auth.guard.ts` |
| Customer session/cart | `frontend/src/app/customer-pwa/services/customer-session.service.ts`, `customer-cart.service.ts` |
| WebSocket (staff) | `frontend/src/app/services/websocket.service.ts`, `company-websocket.service.ts` |
| Environments | `frontend/src/environments/environment.ts`, `environment.prod.ts` |

## Backend – Key Paths

| Purpose | Path |
|--------|------|
| App module | `backend/src/app.module.ts` |
| Prisma schema | `backend/prisma/schema.prisma` |
| Prisma service | `backend/src/modules/prisma/prisma.service.ts` |
| Auth | `backend/src/modules/auth/` |
| Companies | `backend/src/modules/companies/` |
| Menu | `backend/src/modules/menu/` |
| Orders (waiter) | `backend/src/modules/orders/` |
| Customer orders | `backend/src/modules/customer-orders/` |
| Customer sessions | `backend/src/modules/customer-sessions/` |
| Tables | `backend/src/modules/tables/` |
| Users | `backend/src/modules/users/` |
| WebSocket gateway | `backend/src/modules/websocket/websocket.gateway.ts` |
| Payments | `backend/src/modules/payments/` |
| Company guard | `backend/src/guards/company-auth.guard.ts`, `backend/src/modules/auth/company.guard.ts` |

## Prisma Models (core)

- **Company** – id (UUID), name, slug, timezone, currency, location, etc.
- **User** – companyId (nullable for SYSTEM_ADMIN), email, name, phone, password, pin, role (UserRole), isActive.
- **Table** – companyId, number, qrCode, status (TableStatus), waiterId.
- **MenuItem** – companyId, name, description, price, category, isAvailable, preparationTime, isShareable, maxClaimants.
- **Order** / **OrderItem** – waiter orders; link to table, status, items.
- **CustomerSession** – companyId, tableId, customer identifier (e.g. phone), status.
- **CustomerOrder** / **CustomerOrderItem** – customer PWA orders; link to CustomerSession.
- **WaiterCall**, **Payment**, **InventoryItem**, etc. – all company-scoped where applicable.

## WebSocket Events (backend → frontend)

- `order_created`, `customer_order_created` – new orders
- `order_created_kitchen`, `order_created_bar` – split by category to kitchen/bar rooms
- `order_status_changed`, `order_modified`, `item_status_updated` – status updates
- Rooms: `kitchen-{companyId}`, `bar-{companyId}`, `waiter-{companyId}`, `customer-{customerSessionId}` (session room for customer updates)

## CompanyDataService – Refresh Pattern

- Streams: `staffMembers$`, `waiters$`, `tables$`, `menuItems$`, `orders$` (and others).
- All depend on `companyId$` and an internal `refreshTrigger$`. Do not reassign these observables in components.
- After create/update/delete, call the appropriate `refresh*()` (e.g. `refreshOrders()`) so all subscribers refetch.

## API Query Conventions

- List endpoints typically accept `?companyId=...`. Frontend should pass current company id from `CompanyContextService.companyId$` or equivalent.
- Examples: `GET /menu?companyId=...`, `GET /tables?companyId=...`, `GET /orders?companyId=...`, `GET /users?companyId=...`.

## Customer PWA Flow (high level)

1. Phone login or register → session created
2. Restaurants / scan table → company and table context
3. Menu → cart → place order (CustomerOrder)
4. Orders page → status updates; Bill → payment
5. Guards ensure session exists for menu, cart, orders, bill

## NPM Scripts (root)

- `npm run install:all` – install root, frontend, backend
- `npm run dev` – run frontend and backend
- `npm run dev:frontend` – frontend only
- `npm run dev:backend` – backend only
- `npm run build` – build frontend and backend
- `npm run setup:db` – run scripts/setup-database.js
- `npm run seed:db` – run scripts/seed-database.js
