## Restaurant App Frontend – Dark Culinary PWA Spec

This document defines how to build a **new frontend from scratch** for the existing Restaurant App backend, using a **Modern Dark Culinary** design system and Angular 17+ PWA. It focuses on:

- **API integration** with existing endpoints
- **Frontend architecture** (routes, services, state, WebSockets)
- **Design system** for a premium, low-contrast dark UI
- **User stories** that this frontend must satisfy

---

## 1. Context & Goals

- **Multi-tenant restaurant platform**: each restaurant is a `Company` identified by a GUID in URLs for staff, and via QR/URL query params for customers.
- **Backends already implemented**: NestJS modules and Prisma schema are complete for:
  - Core domains: `companies`, `users`, `tables`, `menu`, `orders`, `payments`, `analytics`, `inventory`, `item-claims`, `websocket`
  - Customer PWA: `customer-sessions`, `customer-orders`, `waiter-calls`
- **We are rebuilding the frontend**:
  - Angular 17+ standalone, Angular Material, PWA
  - Customer, Waiter, Kitchen, Bar, Admin interfaces
  - New visual language: **Modern Dark Culinary** (carbon/ink, neon accents, glassmorphism)

**Objectives**:

- Provide a **complete endpoint catalog** with how the frontend should integrate.
- Specify the **frontend layers, routes, and services**.
- Define the **dark culinary design system** to guide all UI work.
- Capture **user stories** aligned with current backend behaviour.

---

## 2. Technical Foundations

- **Framework**: Angular 17+ (standalone components, `@angular/router`)
- **UI**: Angular Material with custom dark theme & density
- **State**:
  - Company-scoped admin/staff state via `CompanyContext` + `CompanyData` pattern
  - Customer PWA state via `CustomerSessionService` + `CustomerCartService`
- **Network**:
  - REST API base: `http://localhost:3000/api`
  - WebSockets: NestJS gateway (Socket.IO) with company and session rooms
- **Auth**:
  - Staff: JWT + company GUID in URL
  - Customer: session-based (no login), via `CustomerSession`

---

## 3. API Endpoint Catalog & Integration Rules

### 3.1 Global Conventions

- **Base URL**: `API_BASE = {env.API_BASE_URL || 'http://localhost:3000/api'}`
- **Headers**:
  - `Content-Type: application/json`
  - Staff requests include `Authorization: Bearer {jwt}` via HTTP interceptor.
- **Company scoping**:
  - Staff interfaces always include `companyId` (from `CompanyContext`) either:
    - as query param (e.g. `?companyId=...`) or
    - in request body when creating entities.
  - Customer PWA passes `companyId` and `tableId` inferred from QR/URL.
- **Error handling**:
  - All API calls surface backend error messages in snackbars/toasts.
  - Validation errors should be bound into form error states.

> NOTE: Paths are written without explicit versioning; adjust if an `/api` prefix is already configured at Nest module level. All examples assume `/api/{resource}`.

---

### 3.2 Auth & Users

**Endpoints**

- `POST /auth/login`
  - Body: `{ email: string, password: string }`.
  - Returns: `{ accessToken, user: { id, role, companyId? } }`.
  - Frontend:
    - `AuthService.login(credentials)` → stores token & user in `StorageService`.

- `POST /auth/pin-login`
  - Staff PIN login per testing guide.
  - Used at `/staff/login/:companyGuid`.

- `POST /auth/register`
  - Customer registration (email + name + optional phone), if exposed in the PWA.

- `POST /auth/staff/create`
  - Staff creation helper (mainly admin/system-admin flows).

- `GET /auth/profile`
  - Get current user profile (JWT required).

- `GET /users?companyId=...`
  - Staff/admin list, optionally filtered by company.

- `GET /users/waiters?companyId=...`
  - Convenience endpoint for waiter lists.

- `POST /users`
- `PUT /users/:id`
- `DELETE /users/:id`

**Frontend integration**

- Implement `AuthService` with:
  - `loginWithPin(companyGuid, pin)`
  - `loginWithEmail(companyGuid, email, password)`
  - `logout()`
  - Expose `currentUser$`.
- Implement `StaffAuthGuard`:
  - Checks token + user role.
  - Redirects to `/staff/login/:companyGuid` if unauthenticated.
- Use `CompanyContextService` to validate that `user.companyId === route.companyGuid` unless `SYSTEM_ADMIN`.

---

### 3.3 Companies & Multi-Tenancy

**Endpoints**

- `GET /companies` – for system admin list.
- `POST /companies` – create company (wizard step 1).
- `PUT /companies/:id` – update company details.
- `GET /companies/:id` – fetch specific company.

**Frontend integration**

- **System Admin routes**:
  - `/admin/system` – list companies & show staff URLs from GUID.
- **Company URLs**:
  - `/kitchen/:companyGuid`
  - `/bar/:companyGuid`
  - `/waiter/:companyGuid`
  - `/admin/:companyGuid`
- `CompanyGuard`:
  - Reads `companyGuid` route param.
  - Calls `GET /companies/{companyGuid}`.
  - Ensures company is active; sets `CompanyContextService.currentCompany$`.
  - On failure → redirect to `/admin/system`.

---

### 3.4 Tables & QR Flow

**Endpoints**

- `GET /tables?companyId=...` – list tables for company.
- `GET /tables/:id` – get table by id.
- `GET /tables/qr/:qrCode` – get table by QR code.
- `POST /tables` – create table.
- `PUT /tables/:id` – update (status, assigned waiter, etc.).
- `PUT /tables/:id/status` – update only status.
- `PUT /tables/:id/assign` – assign waiter to table.
- `POST /tables/:id/clear?force=bool` – clear & close table (ends session, frees table).
- `GET /tables/qr-data/{companyId}` – QR data for all company tables.
- `GET /tables/qr-data/{companyId}/{tableId}` – QR data for a single table.

**Frontend integration**

- Admin & Waiter use `CompanyDataService.tables$` for table lists.
- System admin generates QR data & prints PDF; customer scans URL like:
  - `/customer/scan-table?c={companyGuid}&t={tableNumber}`
- Customer PWA scan flow:
  - Read `c` (=company GUID) & `t` (=table number).
  - Validate table via `GET /tables?companyId=...` or dedicated validation endpoint.

---

### 3.5 Menu & Inventory

**Menu endpoints**

- `GET /menu?companyId=...`
- `GET /menu/categories`
- `POST /menu`
- `PUT /menu/:id`
- `DELETE /menu/:id`

**Inventory endpoints**

- `POST /inventory/items`
  - Create inventory item (admin-only).
- `GET /inventory/items/company/:companyId`
  - List inventory items for a company, with optional filters:
    - `type`, `status`, `category`, `lowStock`.
- `GET /inventory/items/:id`
  - Single inventory item.
- `PUT /inventory/items/:id`
  - Update inventory item (including stock levels).
- `DELETE /inventory/items/:id`
  - Remove item.
- `POST /inventory/items/:id/adjust`
  - Stock adjustment for a single item (creates a movement record).
- `GET /inventory/items/company/:companyId/low-stock`
  - Convenience endpoint for low-stock lists.
- `GET /inventory/summary/company/:companyId`
  - Summary metrics (counts, stock value, categories, etc.).

> For most admin UI use-cases, prefer `GET /inventory/items/company/:companyId` and `GET /inventory/summary/company/:companyId`.

**Frontend integration**

- Admin:
  - Uses `CompanyDataService.menuItems$` and `inventory$` (if exposed).
  - Menu management screens: CRUD for items, categories, prices, prep times.
- Customer:
  - `CustomerMenuService` uses `GET /menu?companyId` and local filtering/paging.
  - Show availability and disable add-to-cart when out of stock.

---

### 3.6 Orders (Staff + System)

**Endpoints**

- `GET /orders?companyId=...` – list all company orders.
- `GET /orders/:id`
- `POST /orders` – waiter-created orders (non-customer PWA).
- `PUT /orders/:id/status` – update high-level order status.
- `PUT /orders/:id/status/kitchen` – kitchen-specific status for food items.
- `PUT /orders/:id/status/bar` – bar-specific status for drink items.
- `PUT /orders/:id/items/:itemId/status` – per-item status updates.
- `GET /orders/table/:tableId` – orders by table.

**Frontend integration**

- Waiter/Kitchen/Bar dashboards use `CompanyDataService.orders$`.
- Use WebSocket events (see §3.10) to trigger `CompanyDataService.refreshOrders()`.
- UI ensures:
  - Filtering by active kitchen/bar items.
  - Waiter list hides fully served orders (active-only).

---

### 3.7 Customer Sessions (Customer PWA)

**Endpoints** (from implementation docs and backend started guides)

- `POST /customer-sessions`
  - Create a session for `{ companyId, tableId, customerName, phoneNumber?, dietaryPreferences[], allergies[] }`.
- `GET /customer-sessions/:id`
- `PUT /customer-sessions/:id/activity`
  - Update `lastActivity`.
- `PUT /customer-sessions/:id/end`
- `GET /customer-sessions/table/:tableId`
- `POST /customer-sessions/:sessionId/end-with-payment`
  - End with payment metadata (`paidBy`, `billPaidAt`, etc.).
- `POST /customer-sessions/:sessionId/validate-location`
  - Validate device location vs table expected location.
- `POST /customer-sessions/end-previous`
  - End previous sessions for same phone number when starting new one.

**Frontend integration**

- `CustomerSessionService`:
  - `startSession(companyGuid, tableNumber, registrationForm)`
    - Creates `CustomerSession` via `POST /customer-sessions`.
    - Stores `{ sessionId, companyId, tableId }` in localStorage.
  - `updateActivity()` calls `PUT /customer-sessions/:id/activity`.
  - `endSession(reason)` → `PUT /customer-sessions/:id/end` or `/end-with-payment`.
  - Exposes `currentSession$`.
- `CustomerAuthGuard`:
  - Applied to `/customer/menu`, `/customer/cart`, `/customer/orders`, `/customer/bill`.
  - Redirects to `/customer/welcome` if no active session.

---

### 3.8 Customer Orders (Customer PWA)

**Endpoints**

- `POST /customer-orders`
  - Body: `{ customerSessionId, tableId, serviceFeePercentage, items: [{ menuItemId, quantity, price, specialInstructions? }] }`.
  - Backend:
    - Splits items into bar vs kitchen by category.
    - Emits `order_created_bar` / `order_created_kitchen` events.
- `GET /customer-orders/session/:sessionId`
  - Returns all orders for a session (active + historical as per flags).
- `GET /customer-orders/:id`
- `PUT /customer-orders/:id/status`
- `PUT /customer-orders/:id/status/bar`
- `PUT /customer-orders/:id/status/kitchen`
- `PUT /customer-orders/:id/items/:itemId/status`

**Frontend integration**

- `CustomerCartService`:
  - Manages cart items locally (and optionally sync with backend draft state).
  - On checkout:
    - Reads `CustomerSessionService.currentSession`.
    - Builds `POST /customer-orders` payload.
    - Clears cart on success.
- `CustomerOrdersService`:
  - `getOrdersBySession(sessionId)` → shows active & history views.
  - Used by `/customer/orders` & `/customer/bill`.
  - Subscribes to WebSocket `order_status_updated`, `order_status_changed`, `item_status_updated` events to refresh.

---

### 3.9 Waiter Calls

**Endpoints**

- `POST /waiter-calls`
- `PUT /waiter-calls/:id/acknowledge`
- `PUT /waiter-calls/:id/resolve`
- `GET /waiter-calls/table/:tableId`
- `GET /waiter-calls/pending?companyId=...&type=...` (optional filters by company and call type, e.g. `'MANAGER'` for escalations)

**Frontend integration**

- Customer:
  - A contextual “Call for Help” bottom sheet in menu/bill:
    - **Request Waiter** – standard help (water, cutlery, questions).
    - **Speak to Manager** – escalation for complaints/urgent issues.
  - Both map to `POST /waiter-calls` with `tableId` and `customerSessionId`, differentiated via a `type` field (e.g. `'WAITER'` vs `'MANAGER'`) in the payload/model.
  - After “Speak to Manager”:
    - The PWA goes into a **request pending** state with a persistent banner.
    - When the manager acknowledges/claims the call (see below), a `manager_call_acknowledged` event updates the banner to “Manager is on the way”, and may briefly shift the theme into a subtle “High Alert” saffron glow.
- Waiter:
  - Waiter dashboard panel subscribes to `waiter_call_created`, `waiter_call_acknowledged`, `waiter_call_resolved`.
  - Uses `GET /waiter-calls/pending` for initial load.
  - Exposes actions to acknowledge/resolve via respective PUTs.

- Manager:
  - Manager Command Center (`/manager/:companyGuid`) subscribes specifically to escalations:
    - An `escalations$` stream in `CompanyDataService` filters waiter calls where `type === 'MANAGER'` (or equivalent).
      - This stream is driven primarily by **WebSocket deltas**, not heavy polling:
        - Backend emits only new/updated escalations into the `manager-{companyId}` room.
        - Frontend applies those changes to a small in-memory map for O(1) lookup/render.
  - WebSocket layer emits dedicated events for manager flows:
    - `manager_call_created` – new manager-level escalation.
    - `manager_call_acknowledged` – manager has claimed/accepted the escalation.
  - Manager actions (Claim, Notify Waiter) update the underlying `waiter-calls` records and drive the above events.

---

### 3.10 Payments

**Endpoints**

- `POST /payments/intent`
  - Create payment intent for a bill or portion of a bill.
- `POST /payments/checkout`
  - Generic checkout flow (pay for self/others or whole table).
- `GET /payments/:id`
  - Fetch payment by id.
- `GET /payments/company/:companyId`
  - Payments for a company, optionally filtered by status.
- `PUT /payments/splits/:splitId/status`
  - Update split payment status.
- `PUT /payments/:id/cancel`
  - Cancel a payment.
- `POST /payments/webhook/payfast`
  - Provider webhook (backend-to-backend, not called from frontend).
- `POST /payments/bill/:customerOrderId`
  - Create a bill payment for a specific customer order (single-payment flow).
- `POST /payments/bill/:customerOrderId/split`
  - Create multiple split payments for a customer order.

Related session lifecycle endpoint:

- `POST /customer-sessions/:id/end-with-payment`
  - Marks session as ended with payment metadata and triggers WebSocket cleanup.

**Frontend integration**

- Bill screen:
  - Computes local totals using `CustomerOrdersService`.
  - Initiates payment via `POST /payments/bill/:customerOrderId` or a combination of `POST /payments/intent` / `POST /payments/checkout`, depending on the flow chosen.
  - On success:
    - Calls `POST /customer-sessions/:id/end-with-payment`.
    - Waits for `session_ended` WebSocket event, then clears local session and navigates back to `/customer/welcome`.

---

### 3.11 Analytics & Inventory Insights

**Analytics endpoints**

- `GET /analytics/overview?companyId=...`
- `GET /analytics/realtime?companyId=...`
- `GET /analytics/top-items?companyId=...&limit=5&startDate=...&endDate=...`
- `GET /analytics?companyId=...` – legacy overview fallback.
- `GET /analytics/revenue` – legacy revenue endpoint.

---

### 3.13 Manager Command Center (Manager PWA)

The Manager interface focuses on **bottleneck and escalation management**, not routine operations.

**Route**

- `/manager/:companyGuid`
  - Guards: `StaffAuthGuard`, `CompanyGuard`, `ManagerGuard` (allows `MANAGER` and `SYSTEM_ADMIN` roles).

**Data sources**

- Primarily **WebSocket delta streams** targeting the manager:
  - `manager_call_created`, `manager_call_acknowledged`
  - Triage/stalled-order events (e.g. `order_sla_breached`) emitted only for exceptions.
- Occasional REST calls for drill-downs:
  - `GET /orders?companyId=...` (with filters) for deeper inspection.
  - `GET /customer-orders/session/:sessionId` (per-session deep dive).
  - `GET /waiter-calls/pending` (fallback/initial snapshot, filtered by `type`).
  - `GET /analytics/overview?companyId=...` for station load metrics.

**Frontend integration**

- `CompanyDataService`:
  - Add an `escalations$` observable:
    - Derived from waiter-calls where `type === 'MANAGER'`.
    - Backed by a small local map keyed by `waiterCallId` to make updates O(1) when delta events arrive.
  - Optionally expose a “SLA health” stream summarizing long-pending/preparing orders per table and per station.
- `ManagerGuard`:
  - Ensures only users with `MANAGER` or `SYSTEM_ADMIN` role can access `/manager/:companyGuid`.

**Frontend integration**

- Company admin dashboard charts:
  - Use overview + top-selling data to display sales, active tables, etc.
  - Display on dark cards per design system.

---

### 3.12 WebSocket Events & Rooms

**Rooms**

- Company rooms:
  - `kitchen-{companyId}`
  - `bar-{companyId}`
  - `waiter-{companyId}`
  - `manager-{companyId}`
- Customer rooms:
  - `customer-{sessionId}`

**Key events**

- To bar: `order_created_bar`
- To kitchen: `order_created_kitchen`
- To waiter:
  - `customer_order_created`
  - `order_status_changed`
  - `item_status_updated`
  - `waiter_call_created`
  - `waiter_call_acknowledged`
  - `waiter_call_resolved`
- To manager:
  - `manager_call_created` (when a customer selects “Speak to Manager”)
  - `manager_call_acknowledged` (when a manager explicitly claims/acknowledges an escalation)
- To customer:
  - `order_status_updated`
  - `waiter_call_acknowledged`
  - `waiter_call_resolved`
  - `manager_call_acknowledged` (for escalations)
  - `session_ended`

**Frontend integration**

- `WebSocketService`:
  - Connects with JWT for staff, anonymous for customer.
  - Joins company rooms after `CompanyContext` is resolved.
  - Joins/leaves `customer-{sessionId}` when session starts/ends.
  - Exposes `onOrderStatusChanged()`, `onItemStatusUpdated()`, `onCustomerOrderStatusUpdated()`, `onWaiterCall*()`, `onSessionEnded()`.
- Handlers:
  - Staff dashboards call `CompanyDataService.refreshOrders()` / `refreshTables()` on events.
  - Customer PWA:
    - Orders page reloads orders on any relevant event.
    - Session end handler clears state and navigates to welcome.

---

## 4. Frontend Architecture Blueprint

### 4.1 Route Map (High-Level)

- **Customer PWA**
  - `/customer/welcome`
  - `/customer/scan-table`
  - `/customer/register`
  - `/customer/menu`
  - `/customer/cart`
  - `/customer/orders`
  - `/customer/bill`
  - Guards: `CustomerAuthGuard` on menu/cart/orders/bill.

- **Staff**
  - `/staff/login/:companyGuid`
  - `/waiter/:companyGuid`
  - `/kitchen/:companyGuid`
  - `/bar/:companyGuid`
  - `/admin/:companyGuid`
  - Guards: `StaffAuthGuard`, `CompanyGuard`.

- **Manager**
  - `/manager/:companyGuid`
  - Guards: `StaffAuthGuard`, `CompanyGuard`, `ManagerGuard` (MANAGER or SYSTEM_ADMIN roles).

- **System Admin**
  - `/admin/system`

### 4.2 Core Services

- `ApiService`
  - Thin wrapper around `HttpClient` for all REST endpoints.
  - Configurable `API_BASE_URL`.

- `CompanyContextService`
  - Holds `currentCompany$`, `companyId$`, `companyGuid$`.
  - Derived from URL and `/companies` endpoint.

- `CompanyDataService`
  - Centralized state for tables, menu, orders, staff.
  - Uses combineLatest with `companyId$` + `refreshTrigger$`.

- `CustomerSessionService`
  - Holds and persists `CustomerSession` metadata.

- `CustomerCartService`
  - Local cart state + computed totals.

- `WebSocketService`
  - Wraps Socket.IO client.

---

## 5. Modern Dark Culinary Design System

The goal is a **premium, low-contrast dark culinary UI** with:
- Carbon/ink backgrounds instead of pure black.
- Glassmorphism surfaces.
- Vibrant accent colors (neon) used sparingly.
- High legibility and performance on mobile hardware.

### 5.1 Color Tokens

- **Base surfaces**
  - `bg.canvas`: `#050608` (near-black, slightly warm)
  - `bg.elevated`: `#101218`
  - `bg.glass`: `rgba(22, 24, 32, 0.85)` (used with blur)
  - `border.subtle`: `rgba(255, 255, 255, 0.06)`

- **Text**
  - `text.primary`: `#F4F5F7`
  - `text.secondary`: `#A7B0C0`
  - `text.muted`: `#6D7482`
  - `text.inverse`: `#050608`

- **Accents (culinary neon)**
  - `accent.primary`: `#88FFB6` (neon herb green)
  - `accent.secondary`: `#FFB86C` (warm saffron)
  - `accent.tertiary`: `#FF6EC7` (magenta for highlights only)

- **Semantic**
  - `status.success`: `#4ADE80`
  - `status.warning`: `#FACC15`
  - `status.error`: `#FB7185`
  - `status.info`: `#38BDF8`

- **Status mappings**
  - Order `PENDING`: `accent.secondary`
  - Order `PREPARING`: `accent.primary`
  - Order `READY`: `#38BDF8`
  - Order `SERVED` / `DELIVERED`: `#4ADE80`

**Severity ladder (for escalations and SLA breaches)**

- **Normal**: base dark surfaces + accents as defined above.
- **Warning** (approaching SLA or idle table):
  - Use `status.warning` for subtle borders, text chips, and table pulses.
- **High alert / Manager escalation**:
  - Use a saffron/salmon range (mix of `accent.secondary` and `status.error`) for:
    - Manager-call banners.
    - Manager Escalations feed cards.
    - Thin “alert rails” at the top of the customer PWA during an active manager request.
- **Critical** (hard SLA breach):
  - Use `status.error` for pulsing card borders in Kitchen/Bar/Manager views to indicate overdue orders requiring triage.

### 5.2 Typography

- Font family: `Inter` or `SF Pro` (fallback to `system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`).
- Sizes (mobile-first):
  - `display`: 28–32px, weight 600.
  - `title`: 22–24px, weight 600.
  - `heading`: 18–20px, weight 600.
  - `body`: 14–16px, weight 400–500.
  - `caption`: 12–13px, weight 400.
- Line height: 1.4–1.5 for body, 1.2–1.3 for headings.

### 5.3 Layout & Components

- **Card surfaces**
  - Use glassmorphism: dark translucent background, 1px subtle border, `backdrop-filter: blur(16px)` where performant.
  - Rounded corners 12–16px.
  - Elevation via soft drop-shadow: `0 24px 40px rgba(0, 0, 0, 0.55)`.

- **Navigation**
  - Customer PWA:
    - Bottom navigation bar with 3–4 key actions (Menu, Orders, Bill, Help).
    - Floating cart chip/button anchored bottom-right.
  - Staff:
    - Top app bar with company name and role.
    - Secondary filter chips for statuses (Pending, Preparing, Ready).

- **Controls**
  - Primary buttons: filled with `accent.primary`, text in `text.inverse`.
  - Secondary: outlined with `accent.secondary`.
  - Icon buttons: 44px tappable area minimum.

### 5.4 Motion & Micro-Interactions

- Duration: 150–220ms for most transitions; 250–320ms for dialogs.
- Easing: `cubic-bezier(0.22, 0.61, 0.36, 1)` (standard material easing).
- Use:
  - Slide/fade on route transitions.
  - Scale+fade for toasts & snackbars.
  - Subtle shimmer loader for skeleton states on dark backgrounds.

### 5.5 Accessibility

- Target at least **WCAG AA** contrast for primary actions and text.
- Avoid neon-on-neon: neon accents sit on dark surfaces with white text or vice versa.
- Provide:
  - Focus outlines with high-contrast ring (e.g. `#FACC15`).
  - Large tap targets.
  - Reduced motion preference respected via `prefers-reduced-motion`.

---

## 6. Build Checklist – Frontend from Scratch

### 6.1 Shared Infrastructure

- [ ] Set up Angular workspace with standalone components & routing.
- [ ] Configure Angular Material with custom dark culinary theme.
- [ ] Implement `ApiService` with `API_BASE_URL` and HTTP interceptor for JWT.
- [ ] Implement `WebSocketService` (Socket.IO) with reconnection and room join.
- [ ] Implement `StorageService` (localStorage wrappers).

### 6.2 Customer PWA

- [ ] Routes `/customer/*` with `CustomerAuthGuard`.
- [ ] `CustomerSessionService` + `CustomerCartService`.
- [ ] Pages:
  - [ ] `welcome` – entry + explainer.
  - [ ] `scan-table` – QR UI + manual entry.
  - [ ] `register` – name, phone, dietary, allergies, T&Cs.
  - [ ] `menu` – browsable, filterable catalog.
  - [ ] `cart` – quantities, service fee selection, place order.
  - [ ] `orders` – real-time status, history toggle.
  - [ ] `bill` – final bill, payment CTA, waiter call.
- [ ] Wire up endpoints: `customer-sessions`, `customer-orders`, `waiter-calls`, `menu`, `tables`.
- [ ] Wire up WebSocket events + session end handling.

### 6.3 Staff & Admin

- [ ] `/staff/login/:companyGuid` with PIN + email/password modes.
- [ ] Guards: `StaffAuthGuard`, `CompanyGuard`.
- [ ] `CompanyContextService` and `CompanyDataService`.
- [ ] Waiter:
  - [ ] Table list with status.
  - [ ] Active orders per table; actions to mark items `COLLECTED` / `SERVED`.
  - [ ] Pending waiter calls banner.
- [ ] Kitchen / Bar:
  - [ ] Column view of orders filtered to respective item types.
  - [ ] Real-time cards for new orders, auto-hiding when all items are collected/served.
- [ ] Company Admin:
  - [ ] Menu management, tables, staff, analytics.
- [ ] System Admin:
  - [ ] `/admin/system` – company list, GUID-based URLs.

---

## 7. User Stories

### 7.1 Customer PWA

- **As a diner**, I want to **scan a QR code or enter my table number** so that I can start ordering without asking staff for a menu.
- **As a diner**, I want to **register with my name and optionally my phone and dietary needs** so the restaurant can personalize my experience and handle allergies safely.
- **As a diner**, I want to **browse a visually rich dark menu with categories, images, and availability badges** so I can confidently choose what to order.
- **As a diner**, I want to **add items to a cart, adjust quantities, and see a running total including service fee** so I know exactly what I’ll pay.
- **As a diner**, I want to **see my order status update in real time** (preparing, ready, on the way, delivered) without refreshing, so I feel in control.
- **As a diner**, I want to **view a clear, itemized bill and pay from my phone** so I can leave quickly without waiting for paper slips.
- **As a diner**, I want to **call a waiter from the app** and see that my call was acknowledged so I know help is coming.
- **As a diner**, I want the **experience to feel premium and calm** with a refined dark culinary theme, so using the PWA feels like part of the restaurant’s brand.

### 7.2 Waiter

- **As a waiter**, I want to **log in using my company-specific URL and PIN** so I only see data for my restaurant.
- **As a waiter**, I want to **see all active tables and their status on a dark dashboard** so I can quickly understand where I’m needed.
- **As a waiter**, I want to **receive real-time notifications for new orders, waiter calls, and ready items** so I can respond immediately.
- **As a waiter**, I want to **mark items as collected and served** so that kitchen/bar dashboards stay clean and accurate.
- **As a waiter**, I want to **clear and close tables when guests leave** so new guests always start with a fresh session.

### 7.3 Kitchen & Bar

- **As a kitchen chef**, I want to **see only food items that are pending/preparing/ready** so I’m not distracted by completed work.
- **As a bartender**, I want to **see only drink items that are relevant to the bar** so I can focus on my station.
- **As kitchen/bar staff**, I want **clear visual cues on a dark background** indicating urgency and status so I can triage at a glance.

### 7.4 Admin & System Admin

- **As a company admin**, I want to **manage menu, tables, staff, and analytics** within a single, branded admin dashboard.
- **As a system admin**, I want to **create companies and share staff URLs with embedded GUIDs** so each restaurant can onboard quickly.
- **As a system admin**, I want to **see analytics per company** so I can monitor performance across the multi-tenant fleet.

### 7.5 Manager

- **As a manager**, I want a **Command Center view** where I see only exceptions (stalled orders, escalations, problem tables) so I can focus my attention where it matters.
- **As a manager**, I want a **floor “Pulse” heat map** where tables are coloured by SLA health (green/yellow/pulsing red) so I can instantly see where customers may be unhappy.
- **As a manager**, I want to see **station load cards** (Kitchen, Bar, Waiter) showing current load and average prep times so I can spot bottlenecks.
- **As a manager**, I want a real-time **“Escalations” feed** (manager calls, stalled orders) with one-tap actions (Notify Waiter, Claim) so I can coordinate recovery quickly.
- **As a manager**, I want to be **alerted when a customer requests a manager** from the PWA and to acknowledge that explicitly so the customer receives a “Manager is on the way” confirmation.

---

## 8. Acceptance Criteria (High-Level)

- **API integration**
  - All endpoints listed in §3 are reachable and correctly wired into services.
  - Company scoping is respected across staff/admin features.
  - Customer sessions and orders behave as per `ORDER-FLOW-EXPLAINED.md`.

- **Design system**
  - Global theme matches the **Modern Dark Culinary** tokens.
  - All primary experiences (customer + staff dashboards) use dark surfaces with glassmorphism and neon accents sparingly.
  - UI meets basic accessibility requirements (contrast, focus states, tap targets).

- **Flows**
  - Customer can complete the full journey: welcome → scan/register → menu → cart → place order → track orders → bill → pay/end session.
  - Waiter, kitchen, and bar dashboards update in real time when orders and statuses change.
  - System admin can create companies and distribute functional GUID-based URLs.

---

## 9. Architectural Implementation Strategy (Lead Frontend / Full-Stack View)

This section captures concrete implementation decisions to realize the **Modern Dark Culinary** and multi-tenant requirements in production.

### 9.1 Theme, Branding & Multi-Tenant Configuration

- **CSS Custom Properties at module root**
  - Define all design tokens (colors, radii, elevations) as CSS variables on the customer-PWA host (and optionally staff/admin shells), e.g.:
    - `--bg-canvas`, `--bg-elevated`, `--accent-primary`, `--accent-secondary`, `--accent-tertiary`, `--status-pending`, etc.
  - Use Angular services (e.g. a `ThemeService`) to set these on `document.documentElement` or a scoped host element.

- **Company-driven branding**
  - `CompanyGuard` is responsible not only for validating `companyGuid`, but also for:
    - Fetching company setup (logo, primary accent colors, branding options) via `/companies/:id` or a dedicated branding endpoint.
    - Passing that configuration into a dedicated `ThemeService`.
    - Updating CSS variables dynamically at runtime so:
      - The same Angular PWA reflects each restaurant’s “brand skin”.
      - Customer PWA and staff UIs can share core tokens but customize accents.

- **Brand injection & dynamic accents**
  - `ThemeService` will expose a method like `applyCompanyTheme(config)` that:
    - Sets base tokens, e.g. `--accent-primary` to the admin-selected “culinary neon”.
    - Computes derivative tokens (semi-transparent borders, inner glows) for glassmorphism:
      - e.g. `--accent-primary-soft`, `--accent-border`, `--accent-glow`.
    - Allows real-time theme changes from the Admin panel without redeploying the PWA.

- **Carbon foundation**
  - Use `#050608` as `bg.canvas` to visually “blend” with device bezels on OLED devices, signalling a high-end, “expensive” experience.

### 9.2 Component Design, Glassmorphism & Performance

- **Selective glassmorphism**
  - Apply `backdrop-filter: blur(16px)` **only** to key surfaces (hero cards, primary panels, floating cart chip).
  - For lower-end devices or when motion/transparency reductions are preferred, fall back to solid `bg.elevated` with a subtle border.

- **Elevation strategy**
  - Reserve the heavier shadow (`0 24px 40px rgba(0, 0, 0, 0.55)`) for:
    - Floating cart chip/button.
    - High-focus modals / sheets (e.g. payment, waiter call).
  - Use lighter elevations or border-only for routine cards to keep scroll performance at 60fps.

- **UX refinement: skeletons and “pre-order haptics”**
  - Use skeleton loaders that match card geometry (rounded 16px rectangles with shimmer) on:
    - Menu grid.
    - Orders list.
    - Dashboard cards.
  - For key actions (successful QR scan, “Add to cart”), optionally use the Vibration API on supported devices:
    - Short 10–20ms vibration to simulate a “thump”.
    - Guarded behind a capability + user-preference check.

### 9.3 Real-Time Logic & Status Mapping

- **WebSocket scoping enforcement**
  - `WebSocketService` must:
    - Automatically join `customer-{sessionId}` when a `CustomerSession` starts and leave on session end.
    - Join company-level rooms (`waiter-{companyId}`, `kitchen-{companyId}`, `bar-{companyId}`) after `CompanyContextService` resolves.
  - Re-join logic is tied to socket reconnect events so brief network losses do not break live updates.

- **Status → visual mapping**
  - Implement a shared Angular **`StatusPipe`** (or utility) used by all dashboards to map backend statuses to:
    - Consistent labels (“Pending”, “Preparing”, “Ready”, “On the way”, “Delivered”).
    - Consistent color tokens:
      - `PENDING` → `accent.secondary`
      - `PREPARING` → `accent.primary`
      - `READY` → `status.info`
      - `SERVED` / terminal → `status.success`
  - This pipe is applied in:
    - Customer Orders/Bill.
    - Waiter, Kitchen, Bar boards.
     - Manager Command Center (for table and station SLA health).

- **Atomic status updates & stage animations**
  - When `order_status_changed` or related events arrive for a specific order:
    - Emit a targeted UI animation on that order card (e.g. progress bar tick, subtle glow) instead of only changing text.
  - Waiter dashboard should include “time since last interaction” for each table (from session `lastActivity`/orders), with:
    - A subtle pulsing `status.warning` border when idle beyond a threshold.
    - Optionally, server-driven `table_idle` events to prompt waiter check-ins.

### 9.4 Recommended Build Order (Full-Stack)

1. **Shared infrastructure**
   - Implement `ApiService`, `StorageService`, `CompanyContextService`, and `WebSocketService`.
   - Wire `CompanyGuard` and `StaffAuthGuard` for GUID-based routing and JWT enforcement.
2. **Customer entry flows**
   - Build `/customer/scan-table` and `/customer/register` with full `CustomerSessionService` integration.
   - Confirm sessions work end-to-end against the real backend.
3. **Hero Menu & Cart**
   - Implement `/customer/menu` and `/customer/cart` with the full dark culinary visual spec:
     - Chef’s specials and key CTAs highlighted using `accent.secondary` (`#FFB86C`) to create “saffron” highlights.
4. **Real-time orders & staff dashboards**
   - Implement `/customer/orders`, `/customer/bill`, then Waiter/Kitchen/Bar using WebSocket patterns and `StatusPipe`.
5. **Admin & System Admin**
   - Finish admin dashboards (analytics, menu, inventory) and system admin company management.
6. **Manager Command Center**
   - Implement `/manager/:companyGuid` once escalations and SLA metrics are available, focusing on:
     - Pulse dashboard (floor heat map + station health).
     - Real-time escalations feed wired to `escalations$` and manager-specific WebSocket events.

### 9.5 Accessibility & UX Polish

- **Micro-interactions**
  - All primary interactions (button presses, chips, nav items) use:
    - 150–220ms transitions.
    - Subtle `transform: scale(0.98)` on press, then ease back, to emulate native tactile feedback.

- **Legibility and low-light optimization**
  - Use the **Inter** font stack with:
    - Line-height 1.4–1.5 for body content.
    - Sufficient letter-spacing on smaller captions.
  - Ensure contrast of primary and secondary text vs `bg.elevated` meets WCAG AA, optimized for dim restaurant environments where glare and low brightness are common.

- **High-contrast / low-light mode**
  - Respect OS-level high-contrast preferences and provide an in-app toggle that:
    - Boosts contrast on text and critical UI outlines.
    - Swaps neon accents for higher-visibility variants when necessary.
  - Ensure this mode still adheres to the Modern Dark Culinary palette, but with even clearer affordances for low-light environments.

### 9.6 Offline & Resilience Infrastructure

- **Offline-first cart**
  - Move `CustomerCartService` backing store to a persistent layer (IndexedDB or `localStorage` via `StorageService`).
  - When `POST /customer-orders` fails due to connectivity:
    - Keep items visually in a “Submitting…” locked state.
    - Queue the request and retry with exponential backoff.
    - Use Background Sync (where available) to flush queued orders when the network returns.

- **Kitchen/Bar DOM hygiene**
  - In Kitchen and Bar interfaces, automatically purge DOM entries for items/orders that have been in a terminal state (COLLECTED/SERVED/etc.) for more than a defined window (e.g. 5 minutes) to keep dashboards performant on tablet hardware.

### 9.7 Manager Operational Controls & Haptics

- **Dead-session / force-clear**
  - Manager interface should expose a **“Force Clear”** action for problematic tables/sessions (e.g. customers left without properly ending the session):
    - Calls into a backend endpoint that safely ends the active `CustomerSession` and resets the table (conceptually equivalent to a privileged `/tables/:id/clear?force=true` + session cleanup).
    - Ensures floor Pulse no longer shows the table as red when the physical table is actually empty.

- **Patterned haptic triage on manager devices**
  - For manager devices that support vibration/haptics:
    - **Waiter-level alerts** (non-manager escalations) use a short double-pulse pattern.
    - **Manager-level escalations** use a single, longer pulse pattern.
  - This allows managers to distinguish the type/severity of an alert without constantly looking at the screen, aligning with the “Command Center” mental model.

These implementation notes should be treated as **non-optional architectural constraints**, ensuring that any future work on the frontend maintains both the multi-tenant robustness and the Modern Dark Culinary “Neo-Bistro” aesthetic.

