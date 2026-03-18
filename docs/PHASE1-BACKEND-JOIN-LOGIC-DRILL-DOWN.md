# Phase 1: Backend Join Logic — Drill-Down

This document drills into **Backend Join Logic** first (recommended before Frontend Aggregation). It defines APIs, service methods, and data flow that "One Session per Table + Multiple Participants" works end-to-end.

---

## 1. Visualizing the New Lifecycle (Scan → Social Confirmation)

```
[Customer A scans QR]  →  GET /table/:tableId/scan-status
                                ↓
                    hasActiveSession? ──No──→  [Register] → POST /customer-sessions (createSession)
                                │                    ↓
                               Yes            Session + Creator Participant created
                                │                    ↓
                                ↓              Store sessionId + participantId (Creator)
                    "Join Table 5? Sarah and 1 other."
                                ↓
                    [Tap Join]  →  POST /:sessionId/join  { participantId?, phoneNumber?, deviceId? }
                                ↓
                    Idempotent? (existing participant found by id/phone/device)
                        │
                        ├── Yes → Return existing participant (no new guest, no emit)
                        └── No  → Create Participant (e.g. "Blue Bear"), emit participant_joined
                                ↓
                    All devices in room customer-${sessionId} receive participant_joined
                                ↓
                    Creator's PWA: toast/vibration "Blue Bear joined!"
                                ↓
                    [Order / Pay / Waiter closes table]  →  session_ended broadcast
                                ↓
                    Every device in room: CustomerSessionEndHandlerService clears state → /welcome
```

---

## 2. Prisma Schema (Done)

The following changes are already applied in `backend/prisma/schema.prisma`:

| Change | Purpose |
|--------|---------|
| **Participant** model | `id`, `customerSessionId`, `displayName`, `isCreator`, `phoneNumber?`, `deviceId?` (idempotent re-join), relations to CustomerSession, CustomerOrder[], ItemClaim[], PaymentSplit[] |
| **ItemClaim** model | `participantId`, `orderItemId` (CustomerOrderItem), `percentage` (Int, basis points). Unique (participantId, orderItemId). |
| **CustomerSession** | Added `participants Participant[]` |
| **CustomerOrder** | Added `participantId String?`, `participant Participant?` (nullable for backward compat and migration) |
| **CustomerOrderItem** | Added `claims ItemClaim[]` |
| **PaymentSplit** | Added `participantId String?`, `participant Participant?` |

**Index for scan-check:** `@@index([tableId, isActive])` on `CustomerSession` for high-performance lookup when deciding Start vs Join.

**Optional DB-level race guard:** For strict "one active session per table" at the database level, add a **partial unique index** in a migration (Prisma schema does not support partial indexes). Raw SQL example (PostgreSQL):

```sql
CREATE UNIQUE INDEX customer_sessions_one_active_per_table
ON customer_sessions (table_id) WHERE (is_active = true);
```

Then `createSession` can catch unique violation (P2002) and return 409. The implemented approach uses a **serializable transaction** instead: concurrent creates are serialized and the second receives 409 or P2034 (serialization failure), which is mapped to 409.

**Migration:** Run `npx prisma migrate dev --name add_participants_and_claims` from `backend/`. Optional backfill: for existing `CustomerSession` rows, create one `Participant` per session with `displayName = customerName`, `isCreator = true`, and set that `participantId` on all their `CustomerOrder` rows.

---

## 3. Conditional Scan Logic (API Contract)

**Goal:** When the PWA has a `tableId` (and `companyId`) after a scan, it calls one endpoint to decide: **Start new session** vs **Join existing**.

### 2.1 Scan-Check Endpoint

**Option A — GET (idempotent, no body):**

```
GET /customer-sessions/table/:tableId/scan-status?companyId=xxx
```

**Option B — POST (allows future body for location, etc.):**

```
POST /customer-sessions/scan-check
Body: { "tableId": "cuid...", "companyId": "uuid..." }
```

**Response (200):**

```ts
// No active session → frontend shows Register / "Get started"
{
  "hasActiveSession": false,
  "tableId": "cuid...",
  "tableNumber": 5,
  "companyId": "uuid..."
}

// Active session → frontend shows "Join Sarah and 2 others?"
{
  "hasActiveSession": true,
  "sessionId": "cuid...",
  "tableId": "cuid...",
  "tableNumber": 5,
  "companyId": "uuid...",
  "participants": [
    { "id": "part_1", "displayName": "Sarah", "isCreator": true },
    { "id": "part_2", "displayName": "Hungry Hippo", "isCreator": false }
  ]
}
```

**Implementation:** New method in `CustomerSessionsService`, e.g. `getScanStatus(tableId: string, companyId?: string)`:

1. Resolve `tableId` → table (and table.number, companyId if needed).
2. `findFirst({ where: { tableId, isActive: true } })` on `CustomerSession`.
3. If none: return `{ hasActiveSession: false, tableId, tableNumber, companyId }`.
4. If found: load `participants` for that session (id, displayName, isCreator); return `{ hasActiveSession: true, sessionId, tableId, tableNumber, companyId, participants }`.

---

## 4. Create Session (First Person) — Updated Behaviour

**Existing:** `POST /customer-sessions` with body `{ tableId, customerName, phoneNumber, ... }`.

**New behaviour (non-breaking):**

1. **Race-condition fix:** Run in a **serializable transaction**. Inside: `findFirst({ where: { tableId, isActive: true } })`; if exists → **409 Conflict** ("Table already has an active session. Join instead?"). Else create Session + first Participant. If the DB returns P2034 (serialization failure) from a concurrent create, map to 409 so the client can gracefully redirect to the Join flow.
2. Create **CustomerSession** as today (customerName, phoneNumber, tableId, companyId, etc.).
3. Create **Participant** with `customerSessionId`, `displayName = customerName`, `isCreator: true`.
4. Return session **including** `participants: [{ id, displayName, isCreator }]` so the PWA can store the creator’s `participantId`.

**Response shape (extended):** Session object with `participants` array (at least the new creator). Frontend stores `session.id` and `session.participants[0].id` (creator) for subsequent orders and "Mine" view.

---

## 5. Join Table (Second+ Person) — New Endpoint

**Endpoint:**

```
POST /customer-sessions/:sessionId/join
Body: { "displayName"?: string, "participantId"?: string, "phoneNumber"?: string, "deviceId"?: string }
```

**Idempotency:** If a participant in this session already exists for the given **`participantId`**, **`phoneNumber`** (normalized), or **`deviceId`**, the backend returns that existing participant (no new guest, no `participant_joined` emit). So:
- **participantId:** After refresh, PWA sends stored participantId → same participant returned.
- **phoneNumber:** If the user is logged in / entered phone, same phone in same session → same participant (no "Blue Bear 2").
- **deviceId:** Client-generated fingerprint; same device re-joining → same participant.

This prevents ghost participants from cluttering the Waiter seat view.

**Behaviour:**

1. Load `CustomerSession` by `sessionId`; ensure `isActive === true`. If not found or inactive → 404.
2. **If `body.participantId` is present** and matches a participant in this session → return that participant (idempotent).
3. **If `body.phoneNumber` is present** and a participant in this session has that (normalized) phone → return that participant (idempotent).
4. **If `body.deviceId` is present** and a participant in this session has that deviceId → return that participant (idempotent).
5. Otherwise: count existing participants; assign display name: if `body.displayName` is provided use it, else use **color + animal** (e.g. "Blue Bear", "Green Goat") from a short fixed list; if exhausted use `"Guest " + (count + 1)`.
6. Create **Participant** with `customerSessionId`, `displayName`, `isCreator: false`, and optional `phoneNumber` / `deviceId` from body (so future re-join by phone/device is idempotent).
7. **Social presence:** Emit **`participant_joined`** to room `customer-${sessionId}`.
8. Return `{ participant, sessionId }`.

**Response (201):**

```ts
{
  "participant": {
    "id": "cuid...",
    "displayName": "Hungry Hippo",
    "isCreator": false,
    "customerSessionId": "cuid..."
  },
  "sessionId": "cuid..."
}
```

**PWA persistence:** The PWA must persist **both `sessionId` and `participantId`** (e.g. in the session service and/or localStorage) so that on browser refresh or accidental tab closure the user can restore state and call join with `participantId` for idempotent re-join. Join WebSocket room `customer-${sessionId}` so "Table" feed and "Mine" filter work.

---

## 6. Get Session — Include Participants

**Existing:** `GET /customer-sessions/:id` returns session with orders and items.

**Addition:** Include `participants: { id, displayName, isCreator }` in the response so the PWA and staff can show names and seat grouping. No breaking change if clients ignore the new field.

---

## 7. Order Creation — Attach participantId

When the PWA creates an order, it must send the **current participantId** (the person placing this order).

**Existing:** `POST /customer-orders` with `customerSessionId`, `tableId`, items, etc.

**New (optional body field):** `participantId: string`. If present, backend sets `CustomerOrder.participantId = participantId`. **Fallback:** If absent (legacy client or migration), backend defaults to the **Creator** participant for that session (single participant with `isCreator: true`). So legacy orders and post-migration data still attribute to a participant and the Waiter UI does not break.

---

## 8. End Session — Creator vs. Host

**Behaviour:** `endSession(sessionId)` and "Clear & Close Table" act on the **entire session**, not just the creator. The backend sets `CustomerSession.isActive = false` and broadcasts **`session_ended`** to the room `customer-${sessionId}`.

**All devices in that room** (Creator and every joiner) receive the event. The **CustomerSessionEndHandlerService** on each device should clear local state (sessionId, participantId) and redirect to `/welcome`. So if Sarah (creator) leaves or her phone dies, the session continues until payment or waiter close; when the session ends, every participant’s device is cleaned up the same way. No special "host" vs "guest" handling in endSession.

---

## 9. Summary: Backend Checklist

| Item | Action |
|------|--------|
| Schema | ✅ Participant, ItemClaim; CustomerOrder.participantId; PaymentSplit.participantId; CustomerSession.participants; CustomerOrderItem.claims |
| Scan-check | New `getScanStatus(tableId, companyId)` + route `GET /table/:tableId/scan-status` or `POST /scan-check` |
| Create session | Enforce one active session per table (409 if exists); create Session + first Participant (isCreator: true); return session with participants |
| Join | New `POST /:sessionId/join`; idempotent when `body.participantId` sent and valid → return existing; else create Participant (smart name), emit `participant_joined`, return participant + sessionId |
| Get session | Include `participants` in response |
| Create order | Accept optional `participantId` and set on CustomerOrder |
| Migration | Run Prisma migrate; optional backfill for existing sessions |

---

## 10. Suggested Implementation Order

1. **Prisma:** Migrate and (optional) backfill script for existing data.
2. **CustomerSessionsService:**  
   - `getScanStatus(tableId, companyId)`  
   - Update `createSession` (one session per table + create Participant)  
   - `joinSession(sessionId, displayName?)`
3. **CustomerSessionsController:**  
   - `GET table/:tableId/scan-status` (or POST scan-check)  
   - `POST :sessionId/join`
4. **CustomerOrdersService:** In `createOrder`, set `participantId` from body when provided.
5. **GetSession:** Include participants in `getSession()` (and any DTOs).

After this, the frontend can:
- After scan → call scan-status → either show Register (then createSession) or "Join Sarah and 2 others?" (then join).
- Store `participantId` and send it when creating orders.
- Subscribe to **`participant_joined`** in the customer room for social presence (toast / vibration when someone joins).
- Use participants in aggregation and seat-grouped views (Phase 1 Frontend Aggregation).

---

## 11. Architectural Refinements (Real-World)

| Refinement | Technical implementation | Business value |
|------------|--------------------------|----------------|
| **Race on first scan** | Serializable transaction in `createSession`; check active session for table then create; on 409 or P2034 return "Table already has an active session. Join instead?" | When 4 people scan at once, only one becomes Creator; others get 409 and can tap "Join" without duplicate sessions. |
| **Participant "ping"** | On `POST /:sessionId/join` success, emit **`participant_joined`** to room `customer-${sessionId}` with `{ sessionId, participant: { id, displayName, isCreator } }`. | Creator sees "John has joined the table!" — confirms social dining and makes the system feel alive. |
| **Smart Guest naming** | Auto-assign Adjective + Animal (e.g. "Hungry Hippo", "Cheerful Cat") from a fixed list by joiner index; fallback `Guest N` when list exhausted. | Waiter seat grouping stays functional even when guests never edit names; no confusion from three "Guest" entries. |
| **Scan-check** | Response includes `tableNumber` (and `tableId`, `companyId`). | PWA can show "Join Table 5" so the user confirms they scanned the right table. |
| **Create order fallback** | If `participantId` is null, default to the session’s Creator participant. | Supports legacy orders and migration without breaking Waiter/Kitchen UI. |
| **Prisma index** | `@@index([tableId, isActive])` on CustomerSession. | High-performance lookup for scan-check during busy service. |

---

## 12. Staff View Refinement (Kitchen vs. Waiter)

With `participantId` on orders, staff UIs are a **data-transformation task**. Kitchen/Bar don’t need participant semantics for production; Waiter does for delivery.

| View | Transformation | Staff benefit |
|------|----------------|----------------|
| **Kitchen / Bar** | `orders$.pipe(map(aggregateByTableAndItem))` — group by `tableId` + `menuItemId`, sum quantities; optional sub-notes by participant per line. | **"2x Classic Burger"** (e.g. "1x Sarah, 1x Blue Bear") instead of two cards. |
| **Waiter** | `orders$.pipe(map(groupByParticipant))` — group orders by `participantId` under each `tableId`. | Seat grouping: "Blue Bear → [Burger, Wine]; Sarah → [Salad]." |

**Smart names:** Backend uses **color + animal** (e.g. "Blue Bear", "Green Goat") so the list is short, distinct, and the Waiter UI can use color-coded seat icons for faster "who is who" at a glance.

---

## 13. Final Summary Checklist

| Component | Requirement | Status |
|-----------|-------------|--------|
| **Scan-Check** | Response includes `tableNumber` so the user can confirm they scanned the right table ("Join Table 5?"). | ✅ `getScanStatus` returns `tableNumber`. |
| **Join endpoint** | **Idempotent** by `participantId`, `phoneNumber`, or `deviceId`; return existing participant to avoid ghost participants. | ✅ Implemented; optional `phoneNumber` and `deviceId` on Participant and in join body. |
| **LocalStorage / PWA** | Persist **sessionId** and **participantId** (and optionally send phone/deviceId on join) so refresh or tab closure can restore state. | 📋 PWA: store both; send `participantId` (or phone/deviceId) on join when restoring. |
| **Race on first scan** | Serializable transaction + 409 so only one Creator when multiple people tap "Start" at once. | ✅ Implemented in `createSession`. |
| **Participant ping** | Emit `participant_joined` to `customer-${sessionId}` when a new participant joins. | ✅ Implemented in `joinSession` (skipped when idempotent return). |
| **Smart Guest naming** | **Color + Animal** (e.g. "Blue Bear", "Green Goat") — short, distinct, Waiter UI can use color-coded seat icons. | ✅ Implemented in `joinSession`. |
| **End session** | Backend broadcasts `session_ended` to room; every device (Creator + joiners) clears state and redirects to /welcome. | ✅ `endSession` + CustomerSessionEndHandlerService. |

---

## 14. Summary of the "Social Dining" Logic

| Feature | Logic | UX result |
|--------|--------|-----------|
| **Join check** | `isActive: true` check on `tableId` in scan-status. | "Join Table 5?" instead of a blank screen. |
| **Social push** | `participant_joined` event to `customer-${sessionId}`. | Vibration / toast: "Blue Bear joined!" |
| **Order attribution** | `participantId` on CustomerOrder. | Waiter knows which seat gets which item. |
| **Payment linkage** | `participantId` on PaymentSplit (schema ready). | Sarah pays only for what she claimed. |
| **Claim logic** | ItemClaim (participantId, orderItemId, percentage in basis points) for shared items. | See §16; avoids "disappearing penny"; Social Cart hierarchy (Mine / Shared / Available). |

---

## 16. The "Claim" Engine: Basis Points (10,000)

Using **integers** for percentages (basis points: 10,000 = 100%) is the correct move to avoid floating-point reconciliation errors ("disappearing penny").

**Example — splitting a $29.99 Pizza three ways:**

| Participant | Basis points | Amount (at checkout) |
|-------------|--------------|----------------------|
| Sarah       | 3,333        | $9.996 → $10.00     |
| John        | 3,333        | $9.996 → $10.00     |
| Guest 3     | 3,334        | $9.998 → $9.99      |
| **Total**   | **10,000**   | **$29.99** (perfect reconciliation) |

**Social Cart hierarchy (PWA):**

| Type | Logic | UX |
|------|--------|-----|
| **Individual** | ItemClaim where `participantId === currentParticipantId` and `percentage === 10000`. | Shown in **"Mine"** view. |
| **Shared** | ItemClaim where `percentage < 10000`. | Shown in **"Table"** feed with a **"Shared"** badge (e.g. "Shared by Sarah"). |
| **Available** | Item has remaining points (e.g. Sarah claimed 50%, other 50% unassigned). | PWA shows **"Claim 50% left?"** so another participant can claim the remainder. |

ItemClaim stores `percentage` as Int (0–10,000). PWA and payment logic use basis points for all split math; round to currency only at display/checkout.

---

## 17. Staff View Refinement (Sub-notes = "Secret Sauce")

The **sub-notes** for Kitchen/Bar prevent staff from being overwhelmed by social features while giving the Waiter exact data for seat service.

| Staff role | Data aggregation | Visual UX |
|------------|-------------------|-----------|
| **Kitchen / Bar** | `tableId` + `menuItemId`; optional by-participant breakdown. | **Large:** "2x Burger" — *Small text:* "1x Sarah, 1x Hippo". |
| **Waiter** | `participantId` grouping under `tableId`. | **Sarah's Section:** Salad, Wine. **Hippo's Section:** Burger. |

---

## 18. Final Implementation Sequence (Actionable)

| Order | Step | Action |
|-------|------|--------|
| 1 | **Backfill existing data** | Ensure every legacy `CustomerSession` has at least one `Participant` with `isCreator: true` (and backfill `participantId` on their `CustomerOrder` rows) so GET session/orders don’t return empty participant arrays. **Script:** `backend/prisma/backfill-participants.ts`; run from backend: `npm run db:backfill-participants`. |
| 2 | **Deploy Join/Scan API** | Scan-status and Join endpoints are live; multiple phones can "see" each other for the first time. |
| 3 | **PWA persistence** | Update the customer session service to store **participantId** alongside **sessionId** (and restore both from localStorage on load); send `participantId` (or phone/deviceId) when calling join so re-join is idempotent. |
| 4 | **Kitchen transformation** | Modify the `orders$` stream in the Staff UI to use the aggregation logic in §12 / §19: `aggregateByTableAndItem` for Kitchen/Bar (with sub-notes), `groupByParticipant` for Waiter. |

---

## 19. Frontend Aggregation Service (Outline)

Once the backend is in place, staff views are a **data-transformation layer** on top of the existing `orders$` stream (which now includes `participantId` and can be joined with session participants).

**Responsibilities:**

1. **Kitchen / Bar — "Master Table Cards"**
   - **Input:** `orders$` (company-scoped orders with items and `participantId`).
   - **Transform:** `aggregateByTableAndItem(orders)` → `Map<tableId, AggregatedTableCard>` where each card has:
     - `tableId`, `tableNumber`, `participantSummaries` (optional: list of displayNames for sub-notes).
     - `lines: { menuItemId, menuItemName, totalQty, byParticipant?: { participantId, displayName, qty }[] }`.
   - **Output:** Kitchen/Bar templates bind to aggregated cards; each card header is "Table 5", body is "2x Classic Burger (1x Sarah, 1x Blue Bear)", etc.

2. **Waiter — Seat grouping**
   - **Input:** Same `orders$` (or orders grouped by table from API).
   - **Transform:** `groupByParticipant(orders)` → per table: `{ tableId, tableNumber, participants: { participantId, displayName, color?, items: OrderItem[] }[] }`.
   - **Output:** Waiter "Table Detail" shows nested list: **Blue Bear (Blue)** → [Burger, Wine]; **Sarah** → [Salad]. Color can be derived from displayName (e.g. "Blue Bear" → blue) or from a small participant-color map.

3. **Implementation sketch**
   - **Service:** e.g. `StaffOrderAggregationService` (or methods on existing `CompanyDataService`):
     - `kitchenCards$ = orders$.pipe(map(aggregateByTableAndItem), map(toKitchenCards))`
     - `waiterTableDetail(tableId)$ = orders$.pipe(map(orders => groupByParticipant(orders.filter(o => o.tableId === tableId))))`
   - **Pure functions:** `aggregateByTableAndItem(orders)`, `groupByParticipant(orders)` so they are testable and don’t depend on NgRx/state shape.
   - Kitchen/Bar components subscribe to `kitchenCards$` / `barCards$` instead of raw `orders$`; Waiter table-detail view subscribes to the grouped stream for the selected table.

**Next step:** Implement `aggregateByTableAndItem` and `groupByParticipant` (and optional color derivation from displayName) in the frontend, and wire Kitchen/Bar/Waiter views to the aggregated streams.
