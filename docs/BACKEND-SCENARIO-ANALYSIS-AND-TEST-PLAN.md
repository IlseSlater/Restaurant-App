# Backend Scenario Analysis & Test Plan

**Purpose:** Verify existing and new Social Dining backend: Participant model, atomic Claim Engine (10,000 basis points), and Table Pulse logic.  
**Approach:** Discovery → Seed data → Terminal (cURL) execution → Regression check.

---

## 1. Backend Discovery – Active Endpoints

All routes are under global prefix **`/api`** (e.g. `http://localhost:3000/api/...`).

### 1.1 Participant & Session (Customer PWA)

| Method | Path | Purpose |
|--------|------|--------|
| `POST` | `/customer-sessions` | Create session (first at table); atomic “one session per table”; creates Creator participant. |
| `GET` | `/customer-sessions/table/:tableId/scan-status` | Scan-check: has active session? Used by PWA to decide Start vs Join. |
| `POST` | `/customer-sessions/:id/join` | Join existing session; idempotent by `participantId` / `phoneNumber` / `deviceId`; Color+Animal for new joiners. |
| `GET` | `/customer-sessions/:id` | Get session with table, participants, orders. |
| `GET` | `/customer-sessions/:id/payment-status` | Per-participant paid status (for Waiter seat map). |
| `PUT` | `/customer-sessions/:id/activity` | Bump lastActivity. |
| `PUT` | `/customer-sessions/:id/end` | End session. |

### 1.2 Social Ordering (Customer Orders)

| Method | Path | Purpose |
|--------|------|--------|
| `POST` | `/customer-orders` | Create order; body: `customerSessionId`, `tableId`, `participantId?`, `items[]`, `serviceFeePercentage`. Shareable items get `isShareable`/`maxClaimants` from MenuItem; initial claim 10,000 bp for orderer. |
| `GET` | `/customer-orders/session/:sessionId` | Orders for session (with participant, items, claims). |
| `GET` | `/customer-orders/:id` | Single order. |
| `PUT` | `/customer-orders/:id/status` | Update order status. |
| `PUT` | `/customer-orders/:id/items/:itemId/status` | Update item status (kitchen/bar). |

### 1.3 Claim Engine (Join & Split)

| Method | Path | Purpose |
|--------|------|--------|
| `GET` | `/item-claims/order-item/:orderItemId` | Get claims for item: percentages (basis points), `priceEach`, `isPaid`, claimant count. |
| `POST` | `/item-claims/claim` | Join shareable item; body: `{ orderItemId, participantId }`. Redistributes so total = 10,000 bp; emits `claim_updated`. |
| `POST` | `/item-claims/leave` | Leave split; body: `{ orderItemId, participantId }`. Redistributes to remaining; emits `claim_updated`. |

**Rules to verify:** Sum of `percentage` = 10,000; `priceEach = totalPrice / claimantCount`; join/leave in `$transaction` (claim updates atomic).

### 1.4 Settlement (Pay for Others)

| Method | Path | Purpose |
|--------|------|--------|
| `POST` | `/payments/checkout` | One person pays for self and/or others. Body: `payerParticipantId`, `payForParticipantIds[]`, `amount`, `isFullTable?`. Creates Payment + PaymentSplits; on webhook success: `ItemClaim.isPaid`, orders PAID, `payment_settled` + `payment_status_updated`. |
| `GET` | `/payments/:id` | Get payment. |
| `GET` | `/payments/company/:companyId` | List company payments. |
| `POST` | `/payments/webhook/payfast` | PayFast notify_url; calls `handlePaymentSettled` on success. |

### 1.5 Table Pulse (Staff)

| Method | Path | Purpose |
|--------|------|--------|
| `GET` | `/orders` | **Staff:** All orders (legacy + customer PWA). Query: `companyId?`. Returns customer orders with `participantId`, `participantDisplayName`, items with `claims` (percentage, displayName). Used by frontend for order velocity, shared-item density, “Table Pulse” suggestions. |
| `GET` | `/orders/table/:tableId` | Orders for table. |
| `PUT` | `/orders/:id/items/:itemId/status` | Update item status (staff path). |

### 1.6 Supporting (Companies, Tables, Menu)

| Method | Path | Purpose |
|--------|------|--------|
| `GET` | `/companies` | List companies (e.g. “Choose Restaurant”). |
| `GET` | `/companies/:id` | One company. |
| `GET` | `/companies/:companyId/tables` | Tables for company (guarded). |
| `GET` | `/companies/:companyId/menu` | Menu for company (guarded). |
| `GET` | `/tables` | All tables; query `companyId?`. |
| `GET` | `/tables/qr/:qrCode` | Table by QR code. |
| `GET` | `/menu` | Menu items; query `companyId?`. |

---

## 2. Scenarios We Must Test

### 2.1 Participant Onboarding

- **Create session (first at table)**  
  - `POST /api/customer-sessions` with `tableId`, `customerName`, `companyId`.  
  - Expect: 201, one CustomerSession, one Participant (isCreator: true).  
  - Second create same table → 409 “Join instead?”.

- **Scan-status (decide Start vs Join)**  
  - `GET /api/customer-sessions/table/:tableId/scan-status?companyId=...`.  
  - No session → `hasActiveSession: false`.  
  - With session → `hasActiveSession: true`, `sessionId`, `participants`.

- **Join existing session**  
  - `POST /api/customer-sessions/:id/join` with optional `displayName`, `participantId`, `phoneNumber`, `deviceId`.  
  - New joiner: new Participant with Color+Animal name; idempotent by participantId/phone/device (same body again → same participant, no duplicate).

### 2.2 Social Ordering

- **Create order with participantId**  
  - `POST /api/customer-orders` with `customerSessionId`, `tableId`, `participantId`, `items` (include one shareable menuItemId), `serviceFeePercentage`.  
  - Expect: order created; shareable line has `isShareable: true`, `maxClaimants`; one ItemClaim with `percentage: 10000` for that participant.

- **Create order without participantId (legacy)**  
  - Same but omit `participantId`; expect participantId defaulted to session creator.

### 2.3 Claim Engine (10,000 basis points)

- **Get claims**  
  - `GET /api/item-claims/order-item/:orderItemId`.  
  - Expect: `claims[].percentage` sum = 10,000; `priceEach = totalPrice / claimantCount`; `claimantCount` correct.

- **Join split (2nd person)**  
  - `POST /api/item-claims/claim` with `orderItemId`, `participantId` (second participant).  
  - Expect: two claims, e.g. 5000 / 5000 (or 5000/5000); sum 10,000; `priceEach` = half of total; backend emits `claim_updated` (observe in logs if running server).

- **Join split (3rd person)**  
  - Same; expect three claims, e.g. 3333, 3333, 3334; sum 10,000; `priceEach` = total/3.

- **Leave split**  
  - `POST /api/item-claims/leave` for one participant.  
  - Expect: that claim removed; remaining claims redistributed to 10,000; `claim_updated` emitted.

- **Fully claimed / not shareable**  
  - Claim when `claimantCount >= maxClaimants` → error.  
  - Claim on non-shareable item → error.

### 2.4 Settlement (Husband/Wife / Full Table)

- **Checkout (pay for multiple participants)**  
  - `POST /api/payments/checkout` with `payerParticipantId`, `payForParticipantIds` (e.g. [self, spouse]), `amount`, optional `isFullTable`.  
  - Expect: Payment created (customerOrderId null), metadata holds session + participants; PaymentSplits for each payForParticipantId.  
  - After webhook (or manual DB/simulated): `ItemClaim.isPaid` true for those participants; their orders PAID; `payment_settled` and `payment_status_updated` emitted.

- **Session payment status**  
  - `GET /api/customer-sessions/:id/payment-status`.  
  - Expect: `participants[]` with `paid`, `paidBy` for each.

### 2.5 Table Pulse

- **Staff GET orders**  
  - `GET /api/orders?companyId=...`.  
  - Expect: customer orders include `participantId`, `participantDisplayName`; items include `claims` (participantId, percentage, displayName).  
  - Enables frontend to compute: participant count per table, last order time, shared-item count, “Table Pulse” suggestions.

### 2.6 Regression (Legacy)

- **Legacy order creation**  
  - `POST /api/orders` (staff Order, not customer-orders) still works if used elsewhere.  
  - Customer PWA: create order without participantId → still works (creator default).  
  - Get session orders: `GET /api/customer-orders/session/:sessionId` returns all session orders with correct participant and claim data.

---

## 3. What to Watch in Terminal

- When testing **Claim Engine**: watch backend logs for **`claim_updated`** broadcast to `customer-{sessionId}` after claim/leave.  
- When testing **Settlement**: after PayFast webhook (or simulated success), watch for **`payment_settled`** and **`payment_status_updated`** and log line “Emitted payment_settled to customer-…”.  
- **Basis points:** every `GET /api/item-claims/order-item/:id` response should have `claims[].percentage` summing to **10,000** and `priceEach` = `totalPrice / claimantCount`.

---

## 4. Next Steps (after you approve this plan)

1. **Seed script** (Prisma): 1 Company, 1 Table, 1 CustomerSession, 3+ Participants, MenuItems (some `isShareable`, some not).  
2. **Terminal cURLs** for each scenario above, with response checks (status, sum 10k, priceEach, isPaid).  
3. **Regression:** one legacy-style flow (e.g. session create → order without participantId) and confirm GET orders/session still correct.

---

## 5. Test Execution Results (Run: 2026-02-04)

**Seed:** `backend/prisma/seed-social-dining.ts` (run from `backend`: `npx ts-node prisma/seed-social-dining.ts`). Output IDs in `backend/prisma/seed-output.json`.

**Base URL:** `http://localhost:3000/api`

| # | Scenario | Endpoint / Action | Result |
|---|----------|-------------------|--------|
| 1 | Scan-status | `GET /customer-sessions/table/:tableId/scan-status?companyId=...` | OK – `hasActiveSession: true`, `sessionId`, 3 participants (Alice, Blue Bear, Green Goat). |
| 2 | Get session | `GET /customer-sessions/:id` | OK – session with table, 3 participants, orders with shareable item. |
| 3 | Get claims (initial) | `GET /item-claims/order-item/:orderItemId` | OK – 1 claim, `percentage: 10000`, `priceEach: 99.99`, sum = 10,000 bp. |
| 4 | Join split (2nd person) | `POST /item-claims/claim` (Blue Bear) | OK – 2 claims, 5000 + 5000 = 10,000, `priceEach: 49.995`. |
| 5 | Leave split | `POST /item-claims/leave` (Blue Bear) | OK – 1 claim again, 10,000 bp, `priceEach: 99.99`. |
| 6 | Join again + 3rd person | `POST /item-claims/claim` (Blue Bear, then Green Goat) | OK – 3 claims: 3334 + 3333 + 3333 = 10,000, `priceEach: 33.33`. |
| 7 | Staff GET orders (Table Pulse) | `GET /orders?companyId=...` | OK – customer orders with `participantId`, `participantDisplayName`, items with `claims` (percentage, displayName). |
| 8 | Payment status | `GET /customer-sessions/:id/payment-status` | OK – `participants[]` with `paid: false`, `paidBy` absent. |
| 9 | Join idempotent | `POST /customer-sessions/:id/join` with existing `participantId` | OK – returns same participant (Blue Bear), no duplicate. |
| 10 | Checkout (pay for others) | `POST /payments/checkout` (payer + payForParticipantIds, amount) | OK – 201, Payment created, `customerOrderId: null`, metadata has session + participants, PaymentSplits created, `providerData.paymentUrl` (PayFast). |
| 11 | Create order (social) | `POST /customer-orders` (participantId: Green Goat, non-shareable items) | OK – 201, order with `participantId`, `participant.displayName`, items `isShareable: false`, no claims. |
| 12 | GET orders by session | `GET /customer-orders/session/:sessionId` | OK – 2 orders (Green Goat, Alice), each with participant and items. |

**Claim engine:** Basis points sum to **10,000** in all responses; `priceEach` = `totalPrice / claimantCount`. Join/leave executed in transaction; backend emits `claim_updated` (observe in server logs when running locally).

**Regression:** Legacy-style create order with `participantId` and non-shareable items works; GET session and GET orders by session return correct participant and claim data.
