# Frontend–Backend Integration Analysis

This document lists mismatches and integration issues between the Angular frontend and NestJS backend API: routes, HTTP methods, request/response shapes, and field naming.

---

## 1. API Base URL & Configuration

### 1.1 Analytics service still hardcoded (High)

**Frontend:** `analytics.service.ts`  
**Issue:** Uses `private baseUrl = 'http://localhost:3000/api'` instead of `environment.apiUrl`.

**Impact:** Production builds call localhost; analytics breaks in deployed environments.

**Fix:** Use `private baseUrl = \`${environment.apiUrl}/api\`` (and add `import { environment } from '../../environments/environment'`).

---

### 1.2 ApiService analytics methods and backend contract (Medium)

**Frontend:** `api.service.ts`  
- `getAnalytics()` → GET `/analytics` (optional `companyId` in backend)
- `getRevenueData()` → GET `/analytics/revenue` (no companyId in backend)
- `getTopSellingItems()` → GET `/analytics/top-items` **with no parameters**

**Backend:** `analytics.controller.ts`  
- `getTopItems(companyId, limit?, startDate?, endDate?)` — **companyId is required**.

**Impact:** Any caller using `apiService.getTopSellingItems()` (no args) hits `/analytics/top-items` without `companyId`; backend may 400 or return wrong data.

**Fix:** Either:
- Add `companyId` (and optional params) to `getTopSellingItems(companyId: string, ...)` in api.service and pass them, or
- Deprecate these in ApiService and use `AnalyticsService` (which already passes companyId) everywhere.

---

## 2. Data Shape Mismatches (Backend → Frontend)

### 2.1 Company: `guid` vs `id` (Medium)

**Frontend:** `api.interfaces.ts` – `Company` has both `id` and `guid`.  
**Backend:** Prisma `Company` has only `id` (UUID). No `guid` field.

**Impact:** Responses never include `guid`. Any frontend code that uses `company.guid` (e.g. links, routing) gets `undefined` unless it falls back to `id`.

**Fix (choose one):**
- Backend: in company serialization or DTO, add `guid: company.id` for compatibility, or
- Frontend: remove `guid` from the interface and use `id` everywhere (e.g. `companyGuid` in routes is actually `company.id`).

---

### 2.2 User: `phone` vs `phoneNumber` (Low–Medium)

**Backend:** Prisma `User` has `phone`. Auth `sanitizeUser()` maps it to `phoneNumber` in the auth response.  
**Backend users module:** Returns Prisma user directly, so list/detail endpoints expose `phone`, not `phoneNumber`.

**Frontend:** `api.interfaces.ts` – `User` has `phoneNumber: string`.

**Impact:** Components that use `User` from `/users` (e.g. staff list, user detail) and read `user.phoneNumber` get `undefined`; they must use `user.phone` for backend response.

**Fix (choose one):**
- Backend: in users controller/service, map `phone` → `phoneNumber` in responses, or
- Frontend: in interface and templates, accept both `phone` and `phoneNumber`, or map once when receiving user from API.

---

### 2.3 MenuItem: `prepTime` vs `preparationTime` (Medium)

**Backend:** Prisma `MenuItem` has `preparationTime` (and `imageUrl`). Menu service returns Prisma shape.

**Frontend:** `api.interfaces.ts` – `MenuItem` has `prepTime: number` and no `preparationTime`.

**Impact:** Code that uses `item.prepTime` (e.g. “Ready in X min”) gets `undefined`; backend sends `preparationTime`. Same for any strict typing that expects only `prepTime`.

**Fix (choose one):**
- Backend: add a response DTO or transform that exposes `prepTime: item.preparationTime` (and keep or alias `imageUrl`), or
- Frontend: in interface use `preparationTime` (or both), and in components use `item.preparationTime ?? item.prepTime` until backend is aligned.

---

### 2.4 MenuItem: `prepTimeMin` on create (Low)

**Backend:** `menu.service.ts` – `createMenuItem` accepts `prepTimeMin` and maps to `preparationTime`.

**Frontend:** Likely sends `prepTime` in create/update payloads.

**Impact:** If frontend sends `prepTime`, backend may ignore it (no such key in createDto), so preparation time is not set.

**Fix:** Either backend accepts `prepTime` and maps to `preparationTime`, or frontend sends `prepTimeMin` (and/or backend accepts both).

---

## 3. Auth & Staff Creation

### 3.1 Auth staff/create body (Low)

**Backend:** `auth.controller.ts` – `createStaffMember` DTO: `companyId`, `email`, `name`, `role`, `pin`, `password?`.  
**Backend auth.service:** Also accepts `phoneNumber` and maps to Prisma `phone`.

**Frontend:** Company wizard posts `name`, `email`, `phoneNumber`, `role`, `pin`, `password`, `companyId`.

**Status:** Controller type doesn’t list `phoneNumber`, but service uses it; request works. For clarity, add `phoneNumber?` to the controller DTO.

---

## 4. Customer Sessions

### 4.1 end-previous body (OK)

**Frontend:** `register.component.ts` – POST `/customer-sessions/end-previous` with `{ phoneNumber, newCompanyId }`.  
**Backend:** POST `customer-sessions/end-previous` with same body.

**Status:** Aligned. ApiService uses generic `post('/customer-sessions/end-previous', data)`; no dedicated method but correct.

---

### 4.2 getScanStatus(tableId) (OK)

**Frontend:** GET `customer-sessions/table/${tableId}/scan-status` with optional `companyId` query.  
**Backend:** GET `table/:tableId/scan-status` with optional `companyId` query. `tableId` is the table’s primary key (id).

**Status:** Aligned. Frontend must pass the table’s **id** (e.g. from table lookup by number), not table number; scan-table resolves to `actualTableId` before calling.

---

## 5. Orders

### 5.1 Order total update path (OK)

**Frontend:** PUT `orders/${id}/total` with `{ total }`.  
**Backend:** PUT `orders/:id/total` with `{ total }`.

**Status:** Aligned.

---

### 5.2 Get orders by table path (OK)

**Frontend:** GET `orders/table/${tableId}`.  
**Backend:** GET `orders/table/:tableId`.

**Status:** Aligned.

---

## 6. Inventory

### 6.1 Inventory API base (OK)

**Frontend:** `inventory.service.ts` – `apiUrl = \`${environment.apiUrl}/api/inventory\``.  
**Backend:** Controller prefix `inventory`.

**Status:** Paths and methods (GET/POST/PUT/DELETE for items, movements, suppliers, alerts, reports, adjust) match controller.

---

### 6.2 Alert read route (OK)

**Frontend:** PUT `alerts/${alertId}/read`.  
**Backend:** PUT `alerts/:id/read`.

**Status:** Aligned.

---

## 7. Payments

### 7.1 Payment service base and routes (OK)

**Frontend:** `payment.service.ts` – `apiUrl = \`${environment.apiUrl}/api/payments\``.  
**Backend:** Controller prefix `payments`. Endpoints: intent, checkout, `:id`, company/:companyId, splits/:splitId/status, `:id`/cancel.

**Status:** Paths and methods match.

---

## 8. Waiter Calls

### 8.1 Param name (OK)

**Frontend:** PUT `waiter-calls/${callId}/acknowledge`, PUT `waiter-calls/${callId}/resolve`.  
**Backend:** PUT `:id/acknowledge`, PUT `:id/resolve` with `@Param('id')`.

**Status:** Aligned; `callId` is the call id.

---

## 9. Customer Orders

### 9.1 Session orders path (OK)

**Frontend:** GET `customer-orders/session/${sessionId}`.  
**Backend:** GET `session/:sessionId`.

**Status:** Aligned.

---

## 10. Item Claims

### 10.1 Paths and body (OK)

**Frontend:** GET `item-claims/order-item/${orderItemId}`, POST `claim` / `leave` with `{ orderItemId, participantId }`.  
**Backend:** Same paths and body shape.

**Status:** Aligned.

---

## 11. Users

### 11.1 getWaiters() without companyId (Medium)

**Frontend:** `api.service.ts` – `getWaiters()` → GET `/users/waiters` with no query params.  
**Backend:** GET `users/waiters` with optional `@Query('companyId') companyId`.

**Impact:** Without companyId, backend may return all waiters across companies (if implemented that way) or require companyId. If the intent is company-scoped waiters, frontend should pass companyId.

**Fix:** Add optional (or required) `companyId` to `getWaiters(companyId?: string)` and pass it as query param when calling from company-scoped contexts (waiter UI, admin).

---

## 12. Tables

### 12.1 Route order (OK)

**Backend:** Routes defined as Get(), Get('qr/:qrCode'), Get(':id'). So `/tables/qr/xyz` and `/tables/:id` are distinct.  
**Frontend:** getTableByQRCode uses `tables/qr/${qrCode}`.

**Status:** Aligned.

---

## 13. Companies

### 13.1 Company update method (Fixed)

**Frontend:** Uses PATCH for company update (fixed earlier).  
**Backend:** PATCH `companies/:id`.

**Status:** Aligned.

---

## 14. Summary Table

| Area | Issue | Severity | Recommended fix |
|------|--------|----------|------------------|
| Analytics service | Hardcoded baseUrl | High | Use `environment.apiUrl` |
| ApiService analytics | getTopSellingItems() no companyId | Medium | Add companyId param or use AnalyticsService only |
| Company | Frontend expects `guid`, backend only `id` | Medium | Backend add `guid: id` or frontend use `id` only |
| User | Frontend `phoneNumber`, backend `/users` returns `phone` | Low–Medium | Backend map in response or frontend accept both |
| MenuItem | Frontend `prepTime`, backend `preparationTime` | Medium | Backend DTO/transform or frontend use preparationTime |
| MenuItem create | Frontend may send `prepTime`, backend expects `prepTimeMin` | Low | Align field name on create (prepTime or prepTimeMin) |
| Users getWaiters | No companyId passed | Medium | Pass companyId when in company context |

---

## 15. Recommended Order of Fixes

1. **Analytics service:** Switch to `environment.apiUrl` in analytics.service.ts.
2. **MenuItem:** Resolve `prepTime` / `preparationTime` (backend transform or frontend interface + usage).
3. **Company:** Resolve `guid` (backend add to response or frontend remove and use `id`).
4. **ApiService getTopSellingItems:** Add companyId (and optional params) or document that callers must use AnalyticsService.
5. **User phone/phoneNumber:** Unify in users API response or frontend mapping.
6. **getWaiters(companyId):** Add companyId parameter and use it in company-scoped flows.
7. **Menu create/update:** Align `prepTime` / `prepTimeMin` / `preparationTime` for create and update.

This gives a single reference for frontend–backend contract issues and how to fix them.
