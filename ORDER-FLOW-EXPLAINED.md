# Order Flow Explained (Current Behaviour)

This document explains how the **current** system handles:

1. Customer places order → split to bar and kitchen  
2. Waiter assigned to table gets real-time updates (with kitchen, bar, and customer)  
3. When waiter updates (collects/serves) → kitchen/bar stop seeing the card  
4. Customer sees “waiter on the way”  
5. When food is delivered → what the customer and waiter see  

No code changes are proposed here; this is description only.

---

## 1. Customer places order → balanced to bar and kitchen

**How it works today**

- Customer places order from the PWA cart. The backend creates a **CustomerOrder** and, in both **customer-orders.service** and **orders.service**, uses **`categorizeOrderItems()`** to split line items by **menu item category**:
  - **Bar:** categories that include (case-insensitive) e.g. `beverage`, `beverages`, `soft drinks`, `beer`, `cocktails`, `wine`, `beers`, `whiskeys`, `vodkas`, `spirits`, `tequilas`, `shots`, `neat`, `brandies`.
  - **Kitchen:** everything else (treated as food).

- After creating the order, the backend:
  - Emits **`order_created_bar`** to the company bar room **only if** there are bar items.
  - Emits **`order_created_kitchen`** to the company kitchen room **only if** there are kitchen items.

So a single order is **logically split**: drinks go to bar, food to kitchen. Mixed orders create events for both rooms. The split is **by item**, not by order; one order can have both bar and kitchen items.

**Summary:** Customer order is balanced to bar and kitchen by **item category**. Bar/kitchen only receive events for items in their category.

---

## 2. Waiter assigned to table + real-time updates (waiter, kitchen, bar, customer)

**Waiter**

- Waiter UI uses **CompanyDataService** (`orders$`, `tables$`) and subscribes to WebSocket events:
  - `order_created`, `customer_order_created` → refreshes orders.
  - `order_status_changed`, `order_modified`, `item_status_updated` → refreshes orders (and tables where relevant).
- So the waiter gets real-time updates when:
  - A new (waiter or customer) order is created.
  - Kitchen/bar change order or item status (e.g. PREPARING, READY).
  - Someone updates item status (e.g. COLLECTED, SERVED).

**Kitchen / Bar**

- Kitchen and Bar UIs join company-specific rooms (`kitchen-{companyId}`, `bar-{companyId}`) and listen for:
  - `order_created_kitchen` / `order_created_bar` (new orders).
  - `order_status_changed`, `item_status_updated`.
- They refresh orders via **CompanyDataService.refreshOrders()**, so they see the same unified order list (Order + CustomerOrder) and filter locally:
  - Kitchen: only orders that **have active food items** (see below).
  - Bar: only orders that **have active drink items** (see below).

**Customer**

- Customer PWA **orders page** subscribes to:
  - `onCustomerOrderStatusUpdated()` → `order_status_updated`.
  - `onOrderStatusChanged()` → `order_status_changed`.
  - `onItemStatusUpdated()` → `item_status_updated`.
- On any of these, it calls **`loadOrders()`** (GET customer orders by session), so the customer sees status changes when:
  - Kitchen/bar/waiter update order or item status.
- **Important:** The backend sends customer-specific updates to the room **`customer-{customerSessionId}`**. The frontend calls **`joinCustomerRoom(sessionId)`**, which emits **`joinRoom`** with the string **`customer-{sessionId}`**. The backend gateway only handles **`join_room`** (with payload `{ room, userType, companyId }`). So **the client never joins the session-based customer room** with the current backend. Real-time updates can still appear because the customer page also polls (e.g. refresh every 5 seconds) and listens to **global** socket events (`order_status_changed`, `item_status_updated`) that are not scoped to that room; so behaviour may be inconsistent (e.g. delayed or dependent on global events).

**Summary:** Waiter, kitchen, and bar get real-time updates over WebSocket and refresh from the same company-scoped data. The waiter sees all orders/tables for the company. The customer is intended to get real-time updates via a session room, but the join event name/payload does not match the backend, so session-based push is currently broken; polling and global events partly compensate.

---

## 3. When waiter gets food/drinks and updates the app → kitchen/bar stop seeing the card

**How it works today**

- Kitchen and Bar **filter** which orders (and which columns) they show using **item status**:
  - **Kitchen:** Only shows orders where **at least one food item** has status **not** in `['COLLECTED', 'SERVED']` (i.e. “active” food items). Same for Pending / Preparing / Ready columns (each column filters by that status **and** “has active food items”).
  - **Bar:** Same idea for **drink items**: only orders with at least one drink item not COLLECTED/SERVED.

- When the **waiter** marks items as **COLLECTED** (e.g. “Collected” from kitchen/bar), the backend updates item status and emits **`item_status_updated`** to waiters, kitchen, bar, and admin. Kitchen and Bar UIs then refresh; when **all** food (or drink) items for that order are COLLECTED or SERVED, **`hasActiveFoodItems(order)`** (or **`hasActiveDrinkItems(order)`**) becomes false, so that **order card disappears** from Kitchen or Bar.

So: **when the waiter updates items to COLLECTED (and later SERVED), kitchen and bar stop showing that order card** once there are no active food/drink items left. This matches the desired behaviour.

**Summary:** Kitchen/Bar only show orders that still have “active” (non-COLLECTED, non-SERVED) items in their department. Waiter marking items as COLLECTED/SERVED causes the card to disappear on kitchen/bar side.

---

## 4. Customer sees “waiter on the way”

**How it works today**

- The **customer orders** page does **not** use a dedicated “waiter on the way” event. It derives messages from **order and item status**:
  - **Item status** is mapped to customer-facing text in **`getItemFriendlyStatus()`**:
    - `READY` → *“Your waiter is collecting your order”*.
    - `COLLECTED` → *“On its way to you”*.
    - `SERVED` → *“Enjoy your meal!”*.
  - **Order-level** message in **`getCustomerFriendlyStatus()`**:
    - When status is READY and there are both drinks and food: *“Waiter Collecting Your Order”*.
    - When READY and only drinks: *“Waiter Bringing Your Drinks”*.
    - When READY and only food: *“Waiter Bringing Your Food”*.

So when the waiter marks items as **COLLECTED**, the customer sees **“On its way to you”** at item level and similar “waiter bringing…” at order level. There is no separate “waiter on her way” event; it is inferred from READY → COLLECTED.

**Summary:** “Waiter on the way” is represented by item status **COLLECTED** (and READY before that). The customer sees this via status text, not a dedicated event.

---

## 5. When food is delivered → what the customer and waiter see (cards or not)

**Customer**

- The customer **orders** page shows **all orders** for the session. It does **not** hide orders when everything is delivered.
  - When **all items** of an order are **SERVED**, the order is shown with:
    - Status class **“Delivered”**.
    - Icon ✅ and text **“Delivered”**.
  - So **cards remain visible** after delivery; they are just labelled “Delivered”. There is no “no cards when delivered” behaviour on the main orders list.
  - The **cart** is separate: after placing an order, the cart is cleared; “unless customer goes to cart” is about starting a new order from the menu/cart, not about hiding delivered orders.

**Waiter**

- The waiter **Recent Orders** list only shows orders that **have at least one non-served item** (**`hasNonServedItems(order)`**). For each order it only lists **`getNonServedItems(order)`**.
  - So when **all** items are **SERVED**, that order **disappears** from the waiter’s “Active Tables” / order cards.
  - To see delivered/history, the waiter would need a “table detail” or “table orders” view (e.g. “look at table specific ordered items”). The current UI focuses on “pending” and “ready to serve”; fully served orders are not shown in the main list.

**Summary**

- **Customer:** Delivered orders **stay visible** as “Delivered” cards. There is no “no cards when delivered” rule on the orders page.
- **Waiter:** Once all items are SERVED, the order **no longer appears** in the main order list; to see past orders they would need a table-specific or history view.

---

## 6. Quick reference

| Your requirement | Current behaviour |
|------------------|-------------------|
| Customer order balanced to bar and kitchen | ✅ By item category; bar/kitchen events only for their items. |
| Waiter gets real-time updates with kitchen, bar, customer | ✅ Waiter gets WS updates and refreshes; customer join to session room is broken (event name/payload), polling/global events used. |
| When waiter updates (collects/serves), kitchen/bar don’t see card | ✅ Kitchen/Bar filter by active food/drink items; card disappears when all their items are COLLECTED/SERVED. |
| Customer sees “waiter on the way” | ✅ Via item status COLLECTED → “On its way to you” (and READY → “Waiter collecting/bringing…”). |
| When delivered, no cards for customer/waiter unless cart/table view | ⚠️ **Waiter:** Yes – served orders disappear from main list. **Customer:** No – delivered orders stay as “Delivered” cards; no “hide when delivered” logic. |
| Customer real-time updates (session room) | ⚠️ Session room join (`joinRoom` vs `join_room`) does not match backend; real-time push to that customer is unreliable. |

If you want to change any of this (e.g. hide delivered orders for the customer, or fix the customer WebSocket room), we can do that in a follow-up step.

---

## Logic-gap fixes applied (post-doc)

1. **WebSocket handshake:** Frontend now emits `join_room` with `{ room: 'customer-' + sessionId, userType: 'customer', companyId }` and `leave_room` with `{ room }`. Customer joins the session room correctly and receives real-time pushes.
2. **Customer delivered cards:** Customer orders list now shows only **active** orders (at least one item not SERVED). When all orders are delivered, the screen shows “All orders delivered” and a “Browse Menu” CTA.
3. **DbContext:** This project uses **NestJS + Prisma**, not .NET. There is no `Program.cs` or `DbContext`; the data “bridge” is Prisma, already registered in the NestJS app module. No equivalent step required.

### Pro-dev follow-ups (implemented)

4. **Reconnect re-join:** `WebSocketService` stores the last customer room (`sessionId`, `companyId`) and, on socket `connect` (including after reconnect), re-joins that room. So spotty 5G or brief disconnects no longer leave the customer without push updates; no reliance on `ngOnInit` re-running.

5. **Ghost order fix:** `activeOrders` now treats **terminal** item statuses as "done": `SERVED`, `CANCELLED`, `REJECTED`, `REFUNDED`. An order disappears from the active list only when every item is in one of these states. So e.g. Beer SERVED + Burger CANCELLED no longer leaves a stuck card.

6. **View order history:** Customer orders page has a **"View order history"** link that toggles a view of **delivered/past orders** (orders where all items are terminal). Lets the main view stay clean while giving the customer a way to check what they were charged. "Back to active orders" returns to the main list.

7. **Current session only:** History (and the whole orders list) is **session-scoped**. Data comes from `getCustomerOrdersBySession(session.id)`, so only orders for this visit are shown. If the customer starts a new visit (new scan/register or new table), they get a new session and history is for that visit only—no mixing with previous days or other tables. The UI hints: "Orders from this visit only … (If you start a new visit, history will be for that visit.)"

---

## Schema alignment: "Session" = CustomerSession

The app’s notion of **session** (one visit, one table, one set of orders) matches the database schema:

- **Entity:** `CustomerSession` (Prisma), table `customer_sessions`.
- **Fields:** `id` (cuid), `companyId`, `tableId`, `customerName`, `phoneNumber`, `sessionStart`, `sessionEnd`, `isActive`, etc. One row = one customer visit at one table.
- **Orders:** `CustomerOrder` has `customerSessionId` (FK to `CustomerSession`). Every PWA order belongs to exactly one session.
- **API:** `GET /customer-orders/session/:sessionId` returns orders where `customerSessionId = sessionId`, i.e. all orders for that **CustomerSession** row.

So "current session only" is not a front-end filter: the backend only ever returns orders for the given session id, and that id is the **CustomerSession** primary key. New visit (new scan/register) → new **CustomerSession** row → new `session.id` in the app → new history. No schema change needed; the design is already one-session-per-visit.

---

## Session end → WebSocket leave_room (no zombie connections)

When a **CustomerSession** is ended in the database (`sessionEnd` set or `isActive` set to false), the backend now triggers WebSocket cleanup so the client stops listening to that table:

1. **Backend:** `CustomerSessionsService` calls `RestaurantWebSocketGateway.notifySessionEnded(sessionId, reason)` from:
   - `endSession(sessionId)` (explicit end)
   - `endSessionOnBillPayment(sessionId, paidBy)` (bill paid)
   - `endPreviousSessionsOnNewScan(phoneNumber, newCompanyId)` (new scan elsewhere; each ended session id)
   - `checkAndExpireInactiveSessions()` (inactivity job; each expired session id)

2. **Gateway:** `notifySessionEnded(sessionId, reason)`:
   - Emits `session_ended` to room `customer-${sessionId}` (payload: `sessionId`, `reason`, `timestamp`).
   - Fetches all sockets in that room and calls `socket.leave(roomName)` so they no longer receive messages for that session (prevents zombie connections after the guest has paid and left).

3. **Frontend:** `CustomerSessionEndHandlerService` (injected in `AppComponent`) subscribes to `onSessionEnded()`. When the event’s `sessionId` matches the current session, it:
   - Calls `leaveCustomerRoom(sessionId)` (and clears the service’s `lastCustomerRoom`).
   - Calls `CustomerSessionService.clearSession()`.
   - Navigates to `/customer/welcome` (optional query `ended=reason`).

So **leave_room is tied to session end in the DB**: no extra listening on a table after the guest has left or the session has been ended or expired.

**Inactivity job and lastActivity:** `checkAndExpireInactiveSessions()` expires sessions where **lastActivity** is older than the threshold (e.g. 2 hours), **not** sessionStart. That way a guest on a long 3-hour dinner is not kicked out while still eating. Session **lastActivity** is updated when they place an order (CustomerOrdersService calls `CustomerSessionsService.updateActivity(sessionId)` after creating an order); it can also be updated by the existing `PUT /customer-sessions/:id/activity` endpoint if the frontend calls it on menu views or other activity.

---

## Table Clear (Waiter Close) — Hybrid Trigger

High-turnover restaurants need a **waiter-initiated “clear table”** so that when guests leave (pay at counter, cash, or simply walk out), the table can be closed in the system. This avoids “ghost tables,” new guests seeing the previous bill when they scan, and keeps **TableSession.sessionEnd** accurate for turn-time analytics.

**Implementation: “Clear & Close Table”**

1. **API:** `POST /tables/:id/clear` (optional query `force=true`).
2. **Backend (`TablesService.clearTable(tableId, force)`):**
   - Finds the active **CustomerSession** for the table.
   - **Safety check:** If there are any items in `PENDING`, `PREPARING`, or `NEW` and `force` is false, returns **409 Conflict** with a message like “There are still active items for this table. Clear anyway?”
   - Calls **`CustomerSessionsService.endSession(sessionId)`**, which sets `sessionEnd`, flips `isActive`, and triggers **`notifySessionEnded`** → customer PWA is kicked off, Bar/Kitchen stop showing that session.
   - Updates the **Table** to `status: 'AVAILABLE'` and broadcasts the table update over WebSocket.
3. **Frontend (Waiter Table Detail):** A **“🧹 Clear & Close Table”** button calls the API. On 409, the waiter sees a confirmation; if they confirm, the request is retried with `force=true`. After success, tables and orders lists are refreshed.

**Why this is the recommended approach:** Payment (or timeout) can remain the primary trigger for ending a session; the waiter “Clear & Close” acts as a **manual override** for pay-at-table, cash, or walk-out cases, keeping table hygiene and ensuring the next scan starts a fresh **CustomerSession**.
