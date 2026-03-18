# Implementation Status vs Spec

Aligned with **FRONTEND-DARK-CULINARY-SPEC.md** §6 Build Checklist and §9.4 Build Order.

## Done

- **§6.1 Shared infrastructure** – Angular 19 standalone, Material dark theme, ApiService, WebSocketService, StorageService, AuthInterceptor, CompanyContextService, CompanyDataService, ThemeService, HapticService. Guards: CustomerAuth, StaffAuth, Company, Manager.
- **§6.2 Customer PWA** – Routes, CustomerSessionService, CustomerCartService, CustomerOrdersService, CustomerMenuService. Pages: welcome, scan-table, register, menu, cart, orders, bill. Endpoints and WebSocket (`customer-{sessionId}`) wired. Scan-table resolves `tableId` from `GET /tables` by matching table number client-side.
- **§6.3 Staff** – `/staff/login/:companyGuid` (PIN). StaffAuthGuard, CompanyGuard. Waiter: table grid with pulse, waiter calls, table orders, item actions (COLLECTED/SERVED). Kitchen/Bar: 3-column boards, type filtering, `/orders` and item-status APIs, WebSocket, SLA borders, DOM purge.
- **Company Admin** – `/admin/:companyGuid`: layout with nav; overview dashboard (today’s performance from `/analytics/realtime`, inventory low-stock count, quick actions); sub-routes Menu, Tables, Staff, Analytics, Inventory with list/overview views wired to `/menu`, `/tables`, `/users`, `/analytics/overview`, `/inventory/items/company/:id` and low-stock.
- **System Admin** – `/admin/system`: company list (`GET /companies`), “Manage” → `/admin/:companyId`, “Show URLs” modal with Kitchen/Bar/Waiter/Admin URLs and copy button.
- **Manager** – `/manager/:companyGuid`: Command Center shell, escalations feed (CompanyDataService), manager WebSocket room. Pulse heat map and Station Health are placeholders.

## Pending / Optional

- **Manager Command Center** – Flesh out Pulse heat map (tables by SLA), Station Health cards, Escalations actions (Notify Waiter, Claim, Force Clear).
- **Admin Menu/Tables/Staff** – Full CRUD UIs (edit/delete, add item, etc.); currently list/placeholder views.
- **Admin Analytics/Inventory** – Dedicated analytics charts and inventory CRUD; currently overview numbers and “View inventory” link.
- **Scan-table** – Backend `GET /tables` does not accept `number`; frontend filters by table number client-side. Optional: add `?number=` support on backend.

## Build order (reference)

1. Shared infrastructure ✓  
2. Customer entry (scan, register) ✓  
3. Menu & Cart ✓  
4. Real-time orders & staff dashboards ✓  
5. Admin & System Admin ✓  
6. Manager Command Center (partial)
