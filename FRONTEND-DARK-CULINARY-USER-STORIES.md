## Frontend Scenario & Interaction Story – Dark Culinary PWA

This file describes **screen-by-screen flows**, **buttons**, and **icon behaviours** for the Restaurant App’s Modern Dark Culinary frontend, across:

- Customer PWA (`/customer/*`)
- Staff: Waiter, Kitchen, Bar
- Admin & System Admin

The goal is to make every interaction explicit enough that design, frontend implementation, and QA can all align without ambiguity.

---

## 1. Customer PWA – Screen Flows & Interactions

### 1.1 Welcome Screen – `/customer/welcome`

**Purpose**: Entry point; explain the service, route customer into scan/enter-table flow.

**Layout & Components**

- **App bar (top, transparent over gradient)**
  - Title: **“Welcome to [Restaurant Name]”** (from company context if known via query; otherwise generic).
  - Right icon: minimalist **info icon** (`i`/`info`) opening an “About” sheet.

- **Hero section**
  - Background: dark gradient (ink → charcoal) with faint blurred culinary imagery (herbs, flames) using glassmorphism overlay.
  - Headline text: “Order from your table. No queues. No pressure.”

- **Feature cards (3–4)**
  - Each card is a glassmorphism tile with:
    - Icon left (outline style, neon accent):
      - Menu: `restaurant_menu`
      - Speed: `bolt`
      - Payment: `credit_card`
      - Service: `support_agent`
    - Title + one-line description.

- **Primary actions (bottom, sticky)**
  - **Button 1 (primary, large, full-width)**  
    - Label: **“Scan QR Code”**  
    - Icon: `qr_code_scanner`
    - Action: navigate to `/customer/scan-table` with `mode=scan`.
  - **Button 2 (secondary, ghost)**  
    - Label: **“Enter Table Number”**  
    - Icon: `dialpad`
    - Action: navigate to `/customer/scan-table` with `mode=manual`.

**Behaviour**

- If the URL already contains `?c={companyGuid}&t={tableNumber}`, the screen auto-shows a “Continue to your table?” bottom sheet:
  - Message: “We detected Table {t} at [Company].”
  - Buttons: **“Confirm table”** (go to Register) / **“Change table”** (go to Scan Table).

---

### 1.2 Scan Table Screen – `/customer/scan-table`

**Purpose**: Capture table and company context via QR or manual entry.

**Layout & Components**

- **Header**
  - Title: “Find your table”.
  - Subtext: “Scan the code on your table stand or enter the table number.”

- **QR scanner pane (center)**
  - Glassmorphism frame with animated border (neon green).
  - Icon overlay (when camera not allowed): large `qr_code_scanner`.
  - Microcopy: “Align the QR code within the frame.”

- **Buttons & controls**
  - **Button: “Allow Camera Access”** (if permission not yet granted)
    - Icon: `camera_alt`
    - On click: request browser camera permission.
  - **Text link / secondary button: “Enter table number instead”**
    - Icon: `dialpad`
    - Toggles manual entry panel.

- **Manual entry panel**
  - Input: **Table number** (numeric, large input).
  - Dropdown: (Optional) “Restaurant” if the customer arrives via generic `/customer` without company param. Otherwise hidden, and `companyGuid` is inferred from QR or URL.
  - **Quick-select grid**:
    - Pills for common tables: `1, 2, 3, 4, 5, 6...`
    - Each pill is a glass chip; selected state is accent green.
  - **Primary button: “Continue”**
    - Icon: `arrow_forward`
    - Disabled until a valid table number is chosen.

**Behaviour**

- **QR success**:
  - Parse QR URL: extract `c={companyGuid}`, `t={tableNumber}`.
  - Call `/tables/qr-data/:companyId/:tableId` for validation or skip direct call and POST session on Register.
  - Navigate to `/customer/register?c={companyGuid}&t={tableNumber}`.
  - Trigger a short confirmation animation on the scanner frame.
  - Optionally trigger a 10–20ms vibration “thump” via the Vibration API on supported devices to make the scan feel tactile.

- **Manual success**:
  - Validate table exists via `GET /tables?companyId=...` or `GET /tables/:id` (implementation decision).
  - On OK: navigate to Register with same params.
  - On error: show inline error chip: “We can’t find that table. Please check the number or ask a waiter.”

---

### 1.3 Register Screen – `/customer/register`

**Purpose**: Create a `CustomerSession`.

**Layout & Components**

- **Form card (glassmorphism)**
  - Heading: “Tell us who’s ordering”.
  - Fields:
    - `Name` (required) – icon: `person`
    - `Phone number` (optional) – icon: `phone_iphone`
    - `Dietary preferences` (multi-select chips) – icons: `spa`, `no_food`, etc.
    - `Allergies` (multiline text) – icon: `warning_amber`
    - `Terms & privacy` (checkbox) – icon inline: `gavel`
  - **Checkbox**: “I agree to the terms and privacy policy.”

- **Buttons**
  - Primary: **“Start ordering”**
    - Icon: `restaurant`
    - Enabled only when required fields + T&Cs are valid.
  - Secondary text: “Back to table selection” (link back to `/customer/scan-table`).

**Behaviour**

- On submit:
  - Build payload for `POST /customer-sessions`.
  - Show loading overlay on card.
  - On success:
    - Persist `{ sessionId, companyId, tableId }` via `CustomerSessionService`.
    - Join WebSocket room `customer-{sessionId}`.
    - Navigate to `/customer/menu`.
  - On failure:
    - Show error snackbar: icon `error`, message from backend.

---

### 1.4 Menu Screen – `/customer/menu`

**Purpose**: Discover and select items.

**Layout & Components**

- **Top app bar**
  - Left: `arrow_back` (to Welcome or previous).
  - Center: Restaurant name.
  - Right:
    - Icon button: `support_agent` → “Call for Help” bottom sheet.
    - Icon button with badge: `shopping_cart` → navigate to Cart.

- **Category tabs (sticky)**
  - Scrollable chip-style tabs:
    - “All”, “Starters”, “Mains”, “Desserts”, “Drinks”, etc.
  - Active tab underline in neon green.

- **Search bar**
  - Icon: `search`
  - Placeholder: “Search dishes, ingredients, or tags”.

- **Menu item grid/list**
  - Each item card (glass):
    - Thumbnail image (optional).
    - Title & short description.
    - Price in bold.
    - Small availability chip:
      - Icon: `check_circle` (available), `do_not_disturb` (unavailable).
    - Dietary icons row (chips with icons: `spa` for vegan, etc.).
    - Right edge: **“+” FAB** to add one to cart.

- **Bottom bar**
  - If cart not empty:
    - Full-width **cart summary chip**:
      - Left: cart icon + “{N} items”.
      - Right: total and chevron.
      - Tap: navigate to Cart.

**Behaviour**

- Tap card:
  - Opens **Item Detail sheet** (or full page) with:
    - Larger image, full description, modifiers, notes field.
    - Quantity stepper (`-` `1` `+`) and “Add to cart” button.
- Pressing `+` FAB:
  - Adds item (quantity +1) via `CustomerCartService`.
  - Shows small toast bottom-right: icon `check`, “Added to cart”.
  - On capable devices, may trigger a very short vibration pulse to reinforce a premium tactile feel.

- **Loading**
  - While menu data is loading, display skeleton cards:
    - Use the same rounded 16px shape as real cards.
    - Apply a subtle shimmer animation rather than a generic spinner.

---

### 1.5 Cart Screen – `/customer/cart`

**Purpose**: Confirm selection and place order.

**Layout & Components**

- **Top app bar**
  - Left: `arrow_back` to Menu.
  - Center: “Your order”.

- **Cart list**
  - For each line:
    - Item name.
    - Subtitle: notes (if present) + category.
    - Quantity stepper:
      - `remove_circle_outline` (decrement, min 1).
      - Count.
      - `add_circle_outline` (increment).
    - Price on the right.
    - Trash icon `delete_outline` to remove item.

- **Service fee selector**
  - Label: “Service / Tip”.
  - Chip row:
    - `0%`, `10%`, `15%`, `18%`, `20%`.
  - Selected chip gets accent border + check icon.

- **Summary panel (sticky bottom)**
  - Subtotal line.
  - Service fee line.
  - Total line, large.
  - **Primary button: “Place order”**
    - Icon: `send`
    - Disabled when cart empty.

**Behaviour**

- On “Place order”:
  - Construct payload for `POST /customer-orders`.
  - Disable button; show loading spinner inside.
  - On success:
    - Clear cart.
    - Navigate to `/customer/orders` with toast: icon `local_dining`, “Order placed! We’ll notify you when it’s ready.”
  - If the request fails due to network/connectivity:
    - Keep the cart visible in a “Submitting…” state (dimmed items, lock icon on the button).
    - Inform the user that the order will be sent automatically once connection is restored.
    - Queue the order in `CustomerCartService` / Background Sync for retry with exponential backoff.

---

### 1.6 Orders Screen – `/customer/orders`

**Purpose**: Real-time view of order progress.

**Layout & Components**

- **App bar**
  - Title: “Your orders”.
  - Right: toggle icon `history` to switch between **Active** and **History**.

- **Status legend (optional)**
  - Small chips explaining colors:
    - `PENDING` (amber), `PREPARING` (green), `READY` (blue), `SERVED` (green check).

- **Order cards**
  - Each order:
    - Header:
      - Order label: “Order #1234”.
      - Status pill icon:
        - `schedule` for PENDING.
        - `restaurant` for PREPARING.
        - `notifications_active` for READY.
        - `check_circle` for SERVED / DELIVERED.
    - Body:
      - List of items with inline status icons.
      - Timestamp (created, updated).
    - Footer actions:
      - When READY: subtle banner “Your waiter is collecting your order” with `directions_walk`.

**Behaviour**

- **Active tab**:
  - Shows only orders with at least one non-terminal item.
- **History tab**:
  - Shows delivered/terminal orders for the session.
- On WebSocket events `order_status_updated`, `order_status_changed`, `item_status_updated`:
  - Re-fetch via `GET /customer-orders/session/:sessionId`.
- When an escalation-related event (e.g. `manager_call_acknowledged`) applies to this session:
  - Animate the related order card briefly (e.g. stage-progress highlight).
  - If the escalation is about service issues (e.g. delayed order), emphasise the status chip and show a short message such as “Manager is aware of a delay and is on the way.”

---

### 1.7 Bill Screen – `/customer/bill`

**Purpose**: Show final bill and support payment.

**Layout & Components**

- **Header**
  - Title: “Your bill”.
  - Subtitle: Table and party info.

- **Itemized list**
  - Group orders by course or time.
  - Show item name, quantity, price; struck-through lines for refunded/cancelled items with explanatory icon `info`.

- **Summary**
  - Subtotal.
  - Service fee / tip.
  - Total (large).

- **Actions**
  - **Primary button: “Pay bill”**
    - Icon: `credit_card`
    - Starts payment flow (links to payments endpoints).
  - **Secondary button: “Call for help”**
    - Icon: `support_agent`
    - Opens the same bottom sheet as the Menu app bar, with:
      - **“Request Waiter”** – standard assistance (water, cutlery, general questions).
      - **“Speak to Manager”** – escalation path for complaints or urgent issues, styled with `accent.secondary` (saffron) to indicate higher service level.

**Behaviour**

- When the user taps the **support_agent** icon (Menu app bar or Bill “Call for help”):
  - Show a bottom sheet with:
    - Primary option: **Request Waiter** (default).
    - Secondary, visually distinct option: **Speak to Manager** (accent.secondary highlight).
  - “Request Waiter”:
    - Sends `POST /waiter-calls` with standard type (e.g. `'WAITER'`), `tableId`, `customerSessionId`.
    - Shows banner/snackbar: “Waiter notified.”
  - “Speak to Manager”:
    - Sends `POST /waiter-calls` with `type: 'MANAGER'`.
    - Shows persistent status banner: “Manager notified. Someone will be with you shortly.”
    - Applies a subtle saffron glow at the top edge of the PWA to indicate an active escalation until it is acknowledged.

- After successful payment:
  - Backend will trigger `session_ended`.
  - UI displays full-screen success state:
    - Icon: large `celebration`.
    - Text: “Payment received. Thank you!”
  - Button: “Back to welcome” → `/customer/welcome` (session cleared).

---

## 2. Waiter Interface – `/waiter/:companyGuid`

### 2.1 Waiter Login – `/staff/login/:companyGuid`

**Components**

- Toggle tabs:
  - “PIN login” (default) with fields:
    - Name or staff code.
    - 4–6 digit PIN (masked numeric).
  - “Email login” with email + password.
- Buttons:
  - Primary: **“Sign in”**
  - Secondary link: “Forgot PIN?” (points to admin/staff flow, informational only).

**Behaviour**

- On PIN submit:
  - Call `POST /auth/pin-login`.
  - On success → store JWT, redirect to `/waiter/:companyGuid`.

### 2.2 Waiter Dashboard

**Layout**

- **Top bar**
  - Company name and role: “Bella Vista – Waiter”.
  - Icon: `logout` for sign-out.

- **Tabs / navigation chips**
  - “Active tables”
  - “Ready to serve”
  - “Waiter calls”

- **Active tables grid**
  - Card per table:
    - Table number in large text.
    - Status chip: `AVAILABLE`, `SEATED`, `WAITING`, `PAYING`.
    - Smaller icons:
      - Orders pending: `receipt_long` with count.
      - Calls: `support_agent` with badge.
    - Button row:
      - **“View orders”** → opens table detail drawer.
      - **“Clear table”** → calls `POST /tables/:id/clear` (with confirmation modal).

- **Table detail drawer**
  - Shows orders and items similar to kitchen view.
  - Buttons:
    - “Mark as collected” / “Mark as served” per item via `PUT /orders/:id/items/:itemId/status` or `PUT /customer-orders/:id/items/:itemId/status`.

**Behaviour**

- Subscribes to WebSockets:
  - `customer_order_created`, `order_status_changed`, `item_status_updated`, `waiter_call_created`.
  - Updates lists via `CompanyDataService.refreshOrders()`/tables.
- Shows “time since last interaction” per table (based on session `lastActivity` and orders):
  - If a table is idle beyond a threshold (e.g. seated with no orders, or long after service), its card border shows a slow pulsing `status.warning` glow (“Table pulse”).
  - Supports future `table_idle` events pushed over WebSocket to proactively prompt waiter check-ins.

---

## 3. Kitchen Interface – `/kitchen/:companyGuid`

**Layout**

- Three-column board (mobile scrollable horizontally or as stacked sections):
  - Column 1: **Pending**
  - Column 2: **Preparing**
  - Column 3: **Ready**

- Each order card:
  - Table number + order number.
  - List of **food items only**.
  - Badge for item count.
  - Time since placed (icon `schedule`).
  - Action buttons:
    - “Start prep” → move to Preparing (`PUT /orders/:id/status/kitchen` or `PUT /customer-orders/:id/status/kitchen`).
    - “Mark ready” → `READY`.

**Behaviour**

- Orders appear only if there are active food items (non-COLLECTED/SERVED).
- Once waiter marks all items as COLLECTED/SERVED, cards disappear from kitchen board.
- Each card surfaces elapsed time in its current stage:
  - If an order remains **Pending** beyond a service threshold (e.g. 10 minutes), the card border shifts from neutral glass to a subtle pulsing `status.error` to highlight triage priority.
- Terminal orders/items (COLLECTED/SERVED/etc.) stay visible only briefly (e.g. 5 minutes) before being removed from the DOM to keep the dashboard fast on tablets.

---

## 4. Bar Interface – `/bar/:companyGuid`

**Similar to Kitchen**, but:

- Filters by drink items.
- Status actions explicitly labelled “Start pouring” / “Drinks ready”.
- Icons skewed towards beverage imagery (`local_bar`, `wine_bar`, `emoji_food_beverage`).

**Behaviour**

- Same SLA-based timing and triage behaviour as Kitchen:
  - Long-waiting drink orders surface with a pulsing `status.error` border once they exceed the Pending SLA.
  - Terminal drink cards are purged from the DOM after a short retention window to maintain performance.

---

## 5. Manager Interface – `/manager/:companyGuid`

### 5.1 The “Pulse” Dashboard (Command Center)

**Purpose**: Give managers a **bird’s-eye view of bottlenecks and exceptions**, not routine traffic.

**Layout & Components**

- **Top bar**
  - Title: “Command Center”.
  - Subtext: Company name.
  - Right icons:
    - `notifications` for escalation count.
    - `logout` for sign-out.

- **Floor Pulse heat map**
  - Grid or map of tables with colour based on SLA health:
    - **Green**: All good (no long waits, no active escalations).
    - **Yellow**: At least one order Pending > 15 minutes.
    - **Pulsing Red**:
      - Customer has requested a manager.
      - Or at least one order > 25 minutes in a critical stage (Pending/Preparing).
  - Tap on a table card:
    - Opens a side panel with:
      - Current session info.
      - Active orders and statuses.
      - Recent waiter calls (including manager calls).
     - Provides a **“Force Clear”** action (privileged):
       - Ends the active customer session and resets the table when the manager confirms that guests have left, even if the digital flow was not completed correctly.

- **Station Health cards**
  - Three compact cards (Kitchen, Bar, Waiters) showing:
    - “Kitchen: 18 active mains, avg prep 22m”.
    - “Bar: 9 active drinks, avg 8m”.
    - “Waiters: 3 tables flagged, 2 waiter calls open”.
  - Each card has:
    - Mini sparkline for recent load over time.
    - Colour tint: neutral → warning as SLA is approached.

### 5.2 The “Escalations” Feed

**Purpose**: Real-time list of “firefights” that need management attention.

**Components**

- **Feed list**
  - Each entry is a card with:
    - Icon:
      - `priority_high` for stalled order.
      - `support_agent` with badge for manager call.
    - Title:
      - “Manager requested – Table 12”.
      - “Order #402 stalled – Table 5”.
    - Subtitle:
      - Reason, duration (e.g. “Preparing for 30 minutes”).
      - Time since escalation created.
    - Coloured border:
      - Saffron (accent.secondary) for manager calls.
      - Red (status.error) for severe SLA breaches.

- **Action buttons on each card**
  - **“Notify Waiter”**:
    - Triggers a staff notification for the assigned waiter (implementation via WebSocket / future endpoint).
  - **“Claim”**:
    - Marks the escalation as being handled by this manager.
    - Sends an acknowledgment update so:
      - Waiter UI reflects that manager is engaged.
      - Customer PWA banner updates to “Manager is on the way.”

**Behaviour**

- The Manager dashboard subscribes to:
  - `manager_call_created` (or waiter-calls with `type: 'MANAGER'`).
  - `manager_call_acknowledged` when a manager claims an escalation.
  - Stalled-order detection events (either from backend timers or front-end-calculated thresholds).
- On a new manager call:
  - The corresponding table becomes pulsing red on the heat map.
  - A new saffron-highlighted entry appears at the top of the Escalations feed.
  - Manager device may use patterned haptic feedback:
    - Two short pulses for lower-severity alerts.
    - One longer pulse for manager-level escalations.
- When a manager taps **“Claim”** on an escalation:
  - The card clearly indicates who claimed it (e.g. “Claimed by [Manager Name]”).
  - A `manager_call_acknowledged` event is emitted so:
    - The customer PWA banner updates from “Manager notified” to “Manager is on the way.”
    - Waiter/dashboards can visually de-emphasise the escalation, knowing management is handling it.

---

## 6. Admin Interface – `/admin/:companyGuid`

---

## 5. Admin Interface – `/admin/:companyGuid`

### 5.1 Overview Dashboard

**Panels**

- **Today’s performance**
  - Revenue (from `/analytics/overview` or `/analytics`).
  - Active tables, active sessions.

- **Inventory snapshot**
  - Low stock count from `/inventory/items/company/:companyId/low-stock`.
  - Button: “View inventory”.

- **Menu & staff quick actions**
  - Buttons:
    - “Manage menu”
    - “Manage tables”
    - “Manage staff”

### 5.2 Menu Management

**Layout**

- Search bar, category filters.
- Table/list of items with:
  - Name, category, price, availability toggle.
  - Edit (pencil icon) and Delete (trash icon).
- “Add item” FAB (icon `add`).

**Behaviour**

- CRUD via `/menu` endpoints, inventory optionally updated as needed.

---

## 7. System Admin – `/admin/system`

**Layout**

- Card grid of companies:
  - Name, slug, status, location snippet.
  - Buttons:
    - “Manage” → `/admin/:companyGuid`.
    - “Show URLs” → modal listing:
      - Kitchen, Bar, Waiter, Admin URLs.
      - Each with **copy** icon `content_copy`.

**Behaviour**

- Uses `/companies` and `/companies/:id`.
- May also use `/companies/:companyId/{tables,menu,orders,users}` for overview stats.

---

## 8. How All Interfaces Work Together

1. **Company & URLs**
   - System admin uses `/admin/system` to create companies via `/companies`.
   - The app generates staff URLs with embedded `companyGuid`.
2. **Staff entry**
   - Staff access their role-specific URLs; `CompanyGuard` loads company context, `StaffAuthGuard` enforces JWT-based auth using `/auth/login` or `/auth/pin-login`.
3. **Customer journey**
   - Customer lands on `/customer/welcome`, uses Scan Table → Register → Menu → Cart → Orders → Bill.
   - `POST /customer-sessions` and `POST /customer-orders` persist state; WebSocket events keep the PWA updated.
4. **Operational views**
   - Waiter, Kitchen, and Bar dashboards subscribe to real-time events and `/orders`, `/customer-orders`, `/waiter-calls`:
     - Kitchen/Bar focus on prep and ready states per department.
     - Waiter coordinates collection, service, calls, and table clearing.
5. **Manager oversight**
   - Manager Command Center (`/manager/:companyGuid`) focuses on:
     - SLA health of tables (via floor Pulse).
     - Station load (Kitchen/Bar/Waiters).
     - Escalations from waiter calls of type `MANAGER` and stalled orders.
   - Manager actions (Claim, Notify Waiter) feed back into waiter UIs and customer banners.
6. **Payment & closure**
   - Customer pays via `/payments/*` endpoints from the Bill screen.
   - Backend finalizes with `POST /customer-sessions/:id/end-with-payment`, emits `session_ended`, and frontends clear session and mark tables available via `/tables/:id/clear`.
7. **Admin oversight**
   - Company admin monitors analytics, adjusts menu, tables, staff, and inventory using `/analytics`, `/menu`, `/inventory`, `/users`, and `/tables`.

Together, these flows create a **coherent multi-tenant restaurant system**: system admin configures tenants, staff operate within company-specific interfaces, customers order and pay through the dark culinary PWA, and all roles stay synchronized through the shared API and WebSocket events.

