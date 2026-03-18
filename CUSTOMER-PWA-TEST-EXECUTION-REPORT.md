# Customer PWA Testing Guide – Test Execution Report

**Date:** 2025-02-04  
**Scope:** Execute Customer PWA Testing Guide and identify integration issues between **Customer**, **Bar**, **Kitchen**, and **Waiter**.

---

## 1. Architecture Summary

| Actor    | Entry / Context | Data source | WebSocket room(s) |
|---------|------------------|-------------|-------------------|
| Customer | `/customer/restaurants` or `/customer/scan-table?company=...&restaurant=...` | Session (companyId, tableId) | Customer joins table/session rooms |
| Waiter  | `/waiter/:companyGuid` (CompanyGuard sets company) | `CompanyDataService.orders$`, `tables$` | `waiters-{companyId}` |
| Kitchen | `/kitchen/:companyGuid` | `CompanyDataService.orders$` (food only) | `kitchen-{companyId}` |
| Bar     | `/bar/:companyGuid` | `CompanyDataService.orders$` (drinks only) | `bar-{companyId}` |

- Customer orders go to **CustomerOrder** (backend `customer-orders`). Backend merges **Order** + **CustomerOrder** in `getAllOrders(companyId)` and emits to company-scoped rooms: `kitchen-{companyId}`, `bar-{companyId}`, `waiters-{companyId}`.
- Staff UIs must have **company context set** (via URL `:companyGuid` and CompanyGuard) so they join the correct rooms and get company-scoped orders.

---

## 2. Issues Found and Fixed

### 2.1 Waiter: New orders not refreshing in list (fixed)

**Symptom:** When a customer placed an order, the waiter view did not update even though the WebSocket event was received.

**Cause:** Waiter component reacted to `onOrderCreated`, `onCustomerOrderCreated`, `onOrderStatusChanged`, etc. by calling `orderService.loadOrders()` and `tableService.loadTables()` **without** `companyId`. The **display** uses `CompanyDataService.orders$` and `tables$`, which only refetch when `companyData.refreshOrders()` / `refreshTables()` are called (they use current company context). So the list never refreshed.

**Fix:** In `waiter.component.ts`, all WebSocket handlers that refreshed orders or tables now call:
- `this.companyData.refreshOrders()` instead of `this.orderService.loadOrders()`
- `this.companyData.refreshTables()` instead of `this.tableService.loadTables()`

Waiter also passes `companyId` when joining the room: `joinRoom(\`waiters-${companyId}\`, 'WAITER', companyId)`.

---

### 2.2 WebSocket gateway: Wrong room name when leaving company (fixed)

**Symptom:** When a client switched company, it might not leave the previous company’s waiters room.

**Cause:** `leaveCompanyRooms()` used room type `'waiter'` (singular), but the backend and frontend use `'waiters'` (plural), so the room name was `waiters-{companyId}`. Leaving `waiter-{companyId}` had no effect.

**Fix:** In `websocket.gateway.ts`, `leaveCompanyRooms()` now uses `'waiters'` in the rooms list so it leaves `waiters-{companyId}`.

---

### 2.3 Kitchen / Bar / Waiter: Not leaving company-specific rooms on destroy (fixed)

**Symptom:** On destroy, components left the legacy room names `'kitchen'`, `'bar'`, `'waiters'`, but they had joined **company-specific** rooms (`kitchen-{companyId}`, `bar-{companyId}`, `waiters-{companyId}`). So they never left the correct room.

**Fix:**
- **Kitchen:** `ngOnDestroy()` now calls `leaveRoom(\`kitchen-${this.companyId}\`)` when `companyId` is set.
- **Bar:** Same for `leaveRoom(\`bar-${this.companyId}\`)`.
- **Waiter:** Same for `leaveRoom(\`waiters-${this.companyId}\`)`.

---

### 2.4 Bar component: SERVED status icon typo (fixed)

**Symptom:** SERVED status showed a broken/incorrect emoji.

**Cause:** In `bar.component.ts`, `getStatusIcon('SERVED')` used `'🍽🇪'` (flag + character) instead of `'🍽️'`.

**Fix:** Replaced with `'🍽️'`.

---

## 3. How to Execute the Customer PWA Testing Guide

### 3.1 Prerequisites

1. **Backend** running (e.g. `http://localhost:3000`).
2. **Frontend** running (e.g. `http://localhost:4200`).
3. **Staff** (waiter, kitchen, bar) opened with **same company** as the customer (e.g. Bella Vista):
   - Waiter: `http://localhost:4200/waiter/11111111-1111-1111-1111-111111111111` (then PIN login).
   - Kitchen: `http://localhost:4200/kitchen/11111111-1111-1111-1111-111111111111`.
   - Bar: `http://localhost:4200/bar/11111111-1111-1111-1111-111111111111`.

### 3.2 Customer flow (from guide)

1. Go to `http://localhost:4200/customer/restaurants`.
2. Select **Bella Vista Italian** → scan-table with company + restaurant in URL.
3. Click **Enter Table Number Manually**, enter table (e.g. `1`), continue.
4. Register (name, email, phone) → **Start Ordering**.
5. Add items (e.g. food + drink) → **Cart** → **Place Order**.

### 3.3 What to verify

| Check | Where | Expected |
|-------|--------|----------|
| Customer order appears in list | Waiter | New order from “Customer Name” at Table X, list refreshes. |
| Food items appear | Kitchen | Order with food items shows in Kitchen; real-time update. |
| Drink items appear | Bar | Order with drink items shows in Bar; real-time update. |
| Company isolation | All | Only Bella Vista orders; no other company’s orders. |
| Status updates | Customer PWA | When kitchen/bar/waiter change status, customer sees update (if implemented). |

### 3.4 Quick checklist (from guide, with integration focus)

- [ ] Restaurant discovery loads; selecting restaurant keeps company in URL.
- [ ] Manual table entry shows tables for that restaurant only.
- [ ] Registration creates session with correct `companyId`.
- [ ] Menu shows only items for selected restaurant.
- [ ] Place order from cart succeeds.
- [ ] **Waiter** sees the new order and notification (customer name, table).
- [ ] **Kitchen** sees the order (food items only) and receives `order_created_kitchen`.
- [ ] **Bar** sees the order (drink items only) and receives `order_created_bar`.
- [ ] Orders list on waiter/kitchen/bar is company-filtered (`GET /api/orders?companyId=...`).
- [ ] Session persists after browser refresh (customer).

---

## 4. Backend / API Checks

- **GET /api/orders?companyId=xxx**  
  Returns both **Order** and **CustomerOrder** for that company (unified list). Customer orders have `isCustomerOrder: true`.

- **Customer order creation**  
  Backend sets `companyId` from `CustomerSession`. Emits:
  - `order_created_kitchen` → `kitchen-{companyId}`
  - `order_created_bar` → `bar-{companyId}`
  - `customer_order_created` → `waiters-{companyId}`

- **Staff** must be on the **same company** (same `companyId` in URL and context) to receive these events and to see the order in their lists.

---

## 5. Waiter-Created Orders: companyId (fixed)

- **Issue:** Backend `createOrder()` did not set `companyId`; the schema requires it, so waiter-created orders could fail.
- **Fix:** `orders.service.ts` now resolves `companyId` from the order’s **table** when not provided in the DTO, and passes it into `prisma.order.create()`. Frontend can still send `companyId` in the create payload if desired.

---

## 6. Files Modified in This Pass

| File | Change |
|------|--------|
| `frontend/src/app/waiter.component.ts` | Use `companyData.refreshOrders()` and `companyData.refreshTables()` in all WebSocket handlers; pass `companyId` in `joinRoom`; leave `waiters-${companyId}` in `ngOnDestroy`. |
| `frontend/src/app/kitchen.component.ts` | Leave `kitchen-${companyId}` in `ngOnDestroy`. |
| `frontend/src/app/bar.component.ts` | Leave `bar-${companyId}` in `ngOnDestroy`; fix SERVED icon to `🍽️`. |
| `backend/src/modules/websocket/websocket.gateway.ts` | In `leaveCompanyRooms()`, use `'waiters'` instead of `'waiter'`. |
| `backend/src/modules/orders/orders.service.ts` | In `createOrder()`, resolve and set `companyId` (from DTO or from table) so waiter-created orders persist correctly. |

---

## 7. Success Indicators (recap from guide)

- **Browser console (customer):** Company context and stored `companyId` in session.
- **Backend logs:** Menu/orders filtered by `companyId`; “Customer order notifications sent” with correct company.
- **Network:** `GET /api/menu?companyId=...`, `GET /api/orders?companyId=...`.
- **Waiter/Kitchen/Bar:** Real-time event logs and list refresh when customer places order (same company).

After the fixes above, executing the Customer PWA Testing Guide should show correct behaviour between customer, bar, kitchen, and waiter for the same company. Use the checklist in §3.4 and the verification table in §3.3 to confirm end-to-end.
