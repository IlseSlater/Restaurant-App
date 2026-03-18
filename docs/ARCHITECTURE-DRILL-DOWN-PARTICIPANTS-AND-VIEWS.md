# Architecture Drill-Down: Participants, Staff Views & Social Dining

This document provides a **deep analysis of the current system** (user, architecture, process) and then **answers the architectural drill-down questions** needed to implement the proposed "Participant + Aggregated/Seat Views + Claims + Social Feed" change without breaking the existing Prisma schema.

---

## Part 1: Current System Analysis

### 1.1 User Perspective

| Actor | Current flow | What they see |
|-------|--------------|----------------|
| **Customer (PWA)** | Scan QR → Register (name, phone, dietary, allergies) → **One new CustomerSession per scan**. No "join existing table" flow. Each device gets its own session if they both register. | Menu, cart, orders for **their session only**. Bill and order history are session-scoped (`getCustomerOrdersBySession(sessionId)`). |
| **Waiter** | Log in by company → See "My Tables" and "Recent Orders". Orders come from **CompanyDataService.orders$** (all company orders: legacy `Order` + **CustomerOrder** transformed to same shape). | Table cards with status; order list **grouped by table**, each order shows **one customerName** (from `customerSession.customerName`). Items listed per order, **no grouping by "who at the table"** — effectively one name per order. |
| **Kitchen / Bar** | Same orders stream. Filter by food vs drink; status buckets (Pending / Preparing / Ready). | **Per-order cards**: "Table 5" + **order-level** items (e.g. "Caesar Salad x1, Burger x2"). **Not** aggregated across orders (e.g. not "Table 5: 2x Burger" from two different orders). One order = one session = one name in notes. |
| **Payment** | Bill page loads session's orders; **Split Bill** = N people, N amounts (equal or custom), **payer name + amount** per split. No item-level or percentage split in UI; PaymentSplit has `customerSessionId`, `payerName`, `amount`. | Single bill or split-by-amount; no "Sarah pays 50% of Pizza" as a first-class concept. |

**Summary (user):** One scan = one session = one "customer" name. No multi-user "participant" concept. Kitchen/Bar see **order-level** items (with one name per order); Waiter sees the same data with table grouping but **no seat/participant grouping**. Payment splits are by **amount and payer name**, not by participant or by item/claim.

---

### 1.2 Architecture Perspective

**Data model (Prisma):**

- **CustomerSession:** One row per "visit" — `customerName`, `phoneNumber`, `tableId`, `companyId`, `isActive`, etc. **No participant or seat concept.** Multiple people can each create a session at the same table (no "one active session per table" constraint), so you can have multiple sessions (and thus multiple "customers") for the same table.
- **CustomerOrder:** `customerSessionId`, `tableId`, totals. One order belongs to **one** CustomerSession.
- **CustomerOrderItem:** `customerOrderId`, `menuItemId`, `quantity`, `price`, `status`. **No participantId, no claim or percentage.**
- **Payment / PaymentSplit:** Payment links to `customerOrderId` (or legacy `orderId`). PaymentSplit has `customerSessionId`, `payerName`, `amount`. So splits are **session + amount**, not "participant" or "item claim."

**Staff data flow:**

- **Orders** for Kitchen/Bar/Waiter come from **OrdersService.getOrders(companyId)** (backend). That method:
  - Fetches legacy `Order` (waiter-created) and **CustomerOrder** (PWA) for the company.
  - **Transforms** CustomerOrder into the same shape as Order: `customerName` from `order.customerSession?.customerName`, `notes: "Customer Order - {customerName}"`, `items` with `menuItem`, `status`, etc. So staff UIs see a **unified** list; each order has a single `customerName`.
- **Kitchen/Bar** templates: one card per **order**; header "Table X", then items listed (e.g. `getOrderItemsText(order)` = comma-separated "Item xQty"). So if two sessions at Table 5 each order a burger, Kitchen sees **two cards** (Table 5 + different names/notes), not one aggregated "Table 5: 2x Burger".
- **Waiter** template: orders grouped by **table** (`getPendingOrdersList()`), then per order, items listed with status. Again **no grouping by participant/seat**; the only "who" is the order’s `customerName`.

**WebSocket:**

- **item_status_updated** payload (backend): `orderId`, `itemId`, `status`, `tableId`, `timestamp`. **No participantId.** Customer room is `customer-${sessionId}`; one session = one room, so all items for that session are "mine" for that device. There is no "table feed" vs "my items" distinction today.

**Payment:**

- Bill is per **CustomerOrder** (or full session bill). Split creates **Payment** + **PaymentSplit** rows (amount, payerName, optional customerSessionId/email/phone). No partial payment **per participant** or **per item claim** stored as such; PARTIALLY_PAID exists on Payment but the logic is "split amounts" not "Sarah paid 50% of item X".

**Summary (architecture):** Session = single customer identity. Orders and items have **no participant or claim**. Staff see orders with one name per order; Kitchen/Bar are **not** aggregated by table (they’re per order). WebSocket has no participant scoping. Payment splits are amount + payer, not participant- or claim-based.

---

### 1.3 Process Perspective

- **Session start:** Scan → Register → `createSession(tableId, customerName, phoneNumber, …)` → new CustomerSession. If a second person scans the same table and registers, they create **another** CustomerSession (same tableId). So "table" can have multiple active sessions.
- **Order creation:** Cart submit → `createOrder({ customerSessionId, tableId, items, … })` → one CustomerOrder with items. No participantId on order or items.
- **Staff:** Kitchen/Bar/Waiter refresh or get pushed updates; they act on **order/item** (status transitions). No "participant" in any step.
- **Session end:** Waiter "Clear & Close Table", or payment, or inactivity → `endSession(sessionId)` → `notifySessionEnded` → customer PWA leaves room and clears session. No multi-participant "table close" logic.

**Summary (process):** End-to-end flow is **session-centric and order-centric**; there is no participant lifecycle, no "join table" flow, and no claim or percentage at item level.

---

## Part 2: How the Proposed Change Maps to Current State

| Proposal | Current state | Gap |
|----------|----------------|-----|
| **Kitchen/Bar aggregated** | One card per order; items listed per order. | Need to **aggregate** items by (table, menuItem) across orders for the same table (and optionally same session group). Backend or frontend aggregation; if we add participants, aggregation key might be (table, menuItem) only for Kitchen/Bar. |
| **Waiter seat grouping** | Orders grouped by table; items per order; one name per order. | Need **participantId** (or equivalent) on orders/items and a **Participant** (or SessionParticipant) concept so the Waiter UI can group items by participant ("Burger for Sarah"). |
| **"Mine" vs "Table" view (PWA)** | Single session = single customer; no table feed. | Need **participant** identity per device and a **table/session feed** (all orders for the session) with **participantId** on items so the PWA can filter "my items" vs "table" and show "Shared by Sarah". |
| **Percentage item splitting (Claims)** | No item-level ownership or split. PaymentSplit = amount + payer. | Need **claims** (e.g. ParticipantClaims: itemId, participantId, percentage). PWA computes "remaining to be paid" and total = Sum(fully owned) + Sum(pro-rata). No float in DB: store integer percentage or basis points. |
| **WebSocket + Social Feed** | item_status_updated has orderId, itemId, status, tableId. No participantId. | Add **participantId** to payload; PWA filters: my item → push/haptic, other’s item → silent table view update. |

**Schema impact (minimal for first phase):** To avoid big-bang Prisma changes, you can introduce **Participant** (or SessionParticipant) and optional **participantId** on CustomerOrderItem and **Claims** (e.g. ItemClaim: itemId, participantId, percentageInteger). CustomerSession stays; "participant" is a child of session. Payment/PaymentSplit can later link to participantId when you implement "Sarah paid 50% of Pizza".

---

## Part 3: Answers to Architectural Drill-Down Questions

### Q1. Participant onboarding: When a second person scans the QR, should they manually type their name or be auto-assigned "Guest 2"?

**Recommendation: Default to low-friction auto-assign, with optional name edit.**

- **Current behaviour:** Every scan that goes through Register creates a **new** CustomerSession (name, phone required). So today there is no "second person at same table" as a joined participant — they’re a second session. To support "one table, many participants", you need a **join-table** flow (e.g. "Table 5 already has an active session — Join as a guest?").
- **For onboarding:**  
  - **Option A — Auto "Guest 2", "Guest 3":** Minimal friction; no form. Assign a displayName and store it with the participant. Waiter still sees "Guest 2" until they or the table renames.  
  - **Option B — Always type name:** Clear identity, but more steps and drop-off.  
  - **Option C — Hybrid (recommended):** On "Join table", auto-assign "Guest 2" (or next N) and **allow editing** in the app (e.g. profile or table view). So: join is one tap; name can be set immediately or later.  
- **Implementation note:** If you keep "one active session per table" and add participants **inside** that session, the "first" scanner creates the session (and is participant 1); the second scanner "joins" and gets participant 2 (auto "Guest 2" or editable). If you instead keep "multiple sessions per table", then "participant" might be a view over "sessions at same table" — but then aggregation and "table feed" become session-grouped, which is more complex. **Recommend one session per table + participants inside it** for a clean model.

**Answer:** Prefer **auto-assign "Guest 2" (and so on)** with **optional in-app name edit** to keep join frictionless while still allowing "Burger for Sarah" once they set the name.

---

### Q2. The "Lead" participant: Does the first person who scanned have the power to "Lock" the session or "Approve" the final bill, or is everyone equal?

**Recommendation: Keep everyone equal by default; add optional "lead" capabilities later if needed.**

- **Current behaviour:** There is no "lead" or "owner"; the only special case is who created the session (one customerName). No lock or bill-approval concept.
- **Options:**  
  - **Everyone equal:** Any participant can add orders, see bill, pay (or trigger split). Matches casual/fast dining and avoids "who has the phone" bottlenecks.  
  - **Lead can lock/approve:** First participant (or explicit "table host") can lock ordering and/or approve the final bill before payment. Useful for corporate or formal dining; adds product and UX complexity (who is lead, what can they do, what happens when they leave).  
- **Pragmatic approach:**  
  - **Phase 1:** No lead. Everyone equal; session ends when waiter closes table or (when you support it) when bill is paid.  
  - **Phase 2 (optional):** Add a `leadParticipantId` (or `sessionOwnerId`) on CustomerSession and capabilities like "Lock ordering" / "Approve bill" in the UI, with clear rules (e.g. only lead can approve; if lead leaves, transfer to next or allow any).  

**Answer:** **Everyone equal** for the first version. Introduce an optional **"Lead"** (first scanner or designated host) with **Lock / Approve bill** only if you have a clear use case (e.g. fine dining or corporate); otherwise keep the model simple.

---

### Q3. Payment processing: If Sarah pays 50% of the Pizza, do we create a Partial Payment record linked to her ParticipantID immediately, or wait until the whole table is ready to close?

**Recommendation: Record intent at payment time; settle at table close.**

- **Current behaviour:** Payment is tied to **CustomerOrder** (or legacy Order). PaymentSplit is **amount + payer** (payerName, optional customerSessionId). There is no item-level or percentage-based payment record; no participantId on PaymentSplit.
- **Claims model (your proposal):** Sarah claims 50% of Pizza, John 50%. PWA shows "remaining to be paid" and pro-rata totals. The open design choice is **when** to create money movement records.
- **Option A — Immediate partial payment record:** When Sarah pays her share (e.g. 50% of Pizza + her full items), create a **Payment** (or PaymentSplit) linked to **participantId** (and optionally to item/claim). Pros: clear audit trail and "Sarah has paid." Cons: many small records; table might still be ordering; refunds/splits more complex until table closes.  
- **Option B — Defer until table close:** Participants claim percentages and optionally "mark intent to pay" in the app; **one** payment flow when the table is ready (e.g. "Pay my share" or "Pay full bill"). Create Payment + PaymentSplits (by participant and amount) at that time. Pros: single settlement moment; simpler reconciliation. Cons: no "Sarah paid early" state unless you add a separate "intent" or "reservation" (e.g. PaymentIntent per participant).  
- **Hybrid (recommended):**  
  - **Store claims** (participantId, itemId, percentage) as data only; no payment rows until someone actually pays.  
  - When **any** participant initiates "Pay my share", create **one** Payment for the **session/table** with amount = that participant’s calculated share (from claims + full items). Link that Payment (or PaymentSplit) to **participantId** (and customerSessionId for backward compatibility). So you get a **partial payment record per participant at the time they pay**, not per item.  
  - When the **whole table is ready to close** (e.g. all shares paid or one person pays remainder), run your existing session-close logic (endSession, etc.). So: **create Partial Payment (or PaymentSplit) linked to ParticipantID when that participant pays their share**; don’t create a new Payment for every item/claim — one payment event per "Sarah pays her portion."  

**Answer:** **Create a partial payment record (Payment or PaymentSplit) linked to participantId when that participant actually pays their share** (calculated from claims + full items). Don’t create a payment row per claim; one payment event per participant pay action. Wait until the table is "ready to close" only for **session end** (and any final reconciliation), not for recording that "Sarah has paid."

---

## Part 4: Summary Table

| Topic | Current state | Recommended direction |
|-------|----------------|------------------------|
| **Participant onboarding** | No participants; each scan = new session. | Add "Join table" flow; auto-assign "Guest 2" with optional name edit. |
| **Lead participant** | None. | Everyone equal in v1; optional lead (lock/approve) later. |
| **Partial payment** | Splits by amount + payer name; no participant. | When a participant pays their share, create Payment/PaymentSplit linked to participantId; one payment event per participant pay. |
| **Kitchen/Bar** | Per-order cards; one name per order. | Aggregate by (table, menuItem) for display: "Table 5: 2x Classic Burger." |
| **Waiter** | Table grouping; items per order. | Seat grouping: items grouped by participant so waiter can say "Burger for Sarah?" |
| **PWA** | Single session = single customer. | Participant + "Mine" vs "Table" view; claims for shared items; WebSocket payload includes participantId for "my item" vs silent update. |

This gives you a clear baseline of the current system and concrete answers for the three drill-down questions so you can design schema and APIs (Participant, optional lead, claims, payment linkage) without breaking existing Prisma models.

---

## Phase 1 Implementation Roadmap (References)

- **Backend Join Logic drill-down:** See **[PHASE1-BACKEND-JOIN-LOGIC-DRILL-DOWN.md](./PHASE1-BACKEND-JOIN-LOGIC-DRILL-DOWN.md)** for conditional scan (scan-status), create-session (one session per table + first Participant), join-session (Guest N), and order `participantId`. Prisma schema changes (Participant, ItemClaim, CustomerOrder.participantId, PaymentSplit.participantId) are applied there.
- **Frontend Aggregation (Kitchen/Bar + Waiter seat grouping):** Implemented via **StaffOrderAggregationService**; Kitchen and Bar use aggregated "Master Cards"; Waiter uses seat map (groupByParticipant). See **Part 5** below.

---

## Part 5: Staff Lens Alignment (Finalized)

With the Bar component brought into the aggregated model, all production staff (Kitchen and Bar) share one operational language, while the Waiter keeps a granular "Seat Map" for delivery.

### 5.1 Unified Production Logic (Kitchen & Bar)

Both production views follow the **"Master Card"** pattern: one card per table with aggregated lines (e.g. "4x Fries", "3x Beer"). This reduces visual noise and prevents order fragmentation during peak hours.

| Concept | Rule | Effect |
|--------|------|--------|
| **Aggregation Rule** | (Table + MenuItem + Status) = One Line | Kitchen/Bar see "I need 4 Pints," not "1 Pint" four times. |
| **Action Rule** | "Start Preparing" on a Master Card triggers a **batch update** for all underlying orders. | If Sarah and Blue Bear both ordered a Beer, the Bar tender pours them together; service stays synchronized. |
| **Safety Valve** | Cancel button is shown only on **single-order** cards. | Prevents accidental mass-cancellation of different guests' items from one tap. |

### 5.2 Bar Component (Pending View)

The Bar Pending view mirrors the Kitchen's efficiency:

| UI Element | Logic | UX Value |
|------------|--------|----------|
| Line quantity | `SUM(item.quantity)` across all table orders | "I need 4 Pints," not four separate lines. |
| Participant sub-notes | `getByParticipantText(line)` | "Who gets what" is visible but secondary to production. |
| Batch status | `startPreparingForCard(card)` | Moves all table drinks to the next stage in one tap. |

### 5.3 Service Lens (Waiter)

While Kitchen and Bar focus on **what to make**, the Waiter focuses on **where it goes**.

- **Logic:** `orders$.pipe(map(groupByParticipant))` → one table = list of participants, each with their items.
- **Visuals:** Derived colors from Color+Animal names (§11), e.g. Blue icon for Blue Bear; hex colors on seat sections.
- **Integration:** When Bar/Kitchen mark a Master Card as Ready, the Waiter's seat map shows those items as deliverable, **grouped by the person who will consume them**. Claim Logic (§16) will add `claimPct` for shared items (e.g. "Nachos (50%)" under each participant).

### 5.4 Final System Verification

| Phase | Goal | Status |
|-------|------|--------|
| **Backend** | One session per table + multiple participants. | ✅ Complete |
| **Idempotency** | Prevent "ghost participants" on refresh/re-scan (phone/device fingerprint). | ✅ Complete |
| **Aggregation** | Kitchen & Bar "Master Cards" (table-level production). | ✅ Complete |
| **Seat grouping** | Waiter "Seat Map" (participant-level delivery). | ✅ Complete |
| **Claim Logic** | Basis points (10,000) for shared items; schema and UI shape ready. | ✅ Schema ready |
| **Social Table Feed** | Customers see live scroll "Sarah just ordered Red Wine!" on Menu. | ✅ Implemented |
| **Pay for Others** | One payer covers self and/or others; `payment_settled` notifies covered participants. | ✅ Implemented |
| **Waiter seat map PAID** | Seat map shows PAID / "Paid by X" for settled participants. | ✅ Implemented |

### 5.5 Pay for Others / Global Table Settlement

- **Checkout payload (PWA):** `POST /payments/checkout` with `payerParticipantId`, `payForParticipantIds`, `amount`, `isFullTable?`. Enables "Husband pays for Wife" or "Pay for entire table."
- **Backend on success (e.g. PayFast webhook PAID):** Mark ItemClaims for covered participants as `isPaid`; mark their CustomerOrders as PAID; create/update PaymentSplits with `participantId` for reporting; emit `payment_settled` to `customer-${sessionId}` with `payerDisplayName`, `coveredParticipantIds`, `remainingTableTotal`.
- **PWA:** Bill page shows "Who are you paying for?" (participant checkboxes) and "Pay for entire table"; on `payment_settled`, if current participant is in `coveredParticipantIds`, show "X paid on your behalf!", set outstanding to 0, optional haptic, replace Pay with "Session Summary."
- **Waiter (future):** Seat map can show PAID / "Paid by X" per participant when payment data is exposed in orders/session API.

---

## Social Table Feed (Phase 2) – Implemented

- **Goal:** Users see what others at the table are ordering in real time (e.g. "Sarah just ordered Red Wine!", "Blue Bear ordered Classic Burger").
- **Backend:** On customer order create, emit `table_feed_item` to `customer-${sessionId}` with `participantDisplayName`, `participantId`, `orderId`, `summary` (item names), `timestamp`. Order include adds `participant` for display name.
- **PWA:** `SocialTableFeedService` subscribes to `onTableFeedItem()`, keeps last 20 items (newest first), marks `isMe` when `participantId` matches current user. Menu page shows "Live from your table" with a scroll of entries; "You" vs participant name, "ordered X", and relative time (e.g. "just now", "2m ago").
- **UX:** Section appears on the Menu when there is at least one feed item; encourages more orders by making table activity visible.
