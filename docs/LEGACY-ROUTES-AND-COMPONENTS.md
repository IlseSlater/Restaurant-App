# Legacy Routes and Components

This document lists routes and components kept for backward compatibility or planned removal. Use the main app routes (customer PWA, staff with `:companyGuid`, admin) for new flows.

## Legacy Routes

| Route | Purpose | Current behavior |
|-------|---------|------------------|
| `/customer-old` | Old customer/restaurant flow | Loads `RestaurantComponent`. Use `/customer/*` (customer PWA) instead. |
| `/waiter` (no GUID) | Old waiter entry | Redirects to `/admin/system`. Use `/waiter/:companyGuid` after staff login. |
| `/kitchen` (no GUID) | Old kitchen entry | Redirects to `/admin/system`. Use `/kitchen/:companyGuid` after staff login. |
| `/bar` (no GUID) | Old bar entry | Redirects to `/admin/system`. Use `/bar/:companyGuid` after staff login. |

## Legacy / Alternate Components

| Component | Location | Notes |
|-----------|----------|--------|
| `RestaurantComponent` | `restaurant.component.ts` | Serves `/customer-old`. Replaced by customer PWA under `/customer/*`. |
| `NavigationComponent` | `navigation.component.ts` | Root route `''`; entry/landing. |
| `customer.component.ts` / `customer-new.component.ts` | `customer/` folder | Older customer variants; prefer customer-pwa pages. |
| `waiter/waiter.component.ts` | `waiter/` folder | Duplicate of root `waiter.component.ts`; app routes use root. |

## Preferred Routes (Reference)

- **Customer:** `/customer/welcome`, `/customer/scan-table`, `/customer/register`, `/customer/menu`, `/customer/cart`, `/customer/orders`, `/customer/bill`, etc.
- **Staff login:** `/staff/login/:companyGuid` (then redirect to waiter/kitchen/bar with same GUID).
- **Staff UIs:** `/waiter/:companyGuid`, `/kitchen/:companyGuid`, `/bar/:companyGuid`.
- **Admin:** `/admin/system`, `/admin/company/new`, `/admin/:companyGuid`.

## Cleanup Suggestions

1. **Remove `/customer-old`** when no links or QR codes point to it: delete route and consider removing or archiving `RestaurantComponent`.
2. **Keep** `/waiter`, `/kitchen`, `/bar` redirects so old bookmarks without GUID land on system admin.
3. **Consolidate** waiter component: ensure only one `waiter.component` is used (root); remove or repurpose `waiter/waiter.component.ts` if unused.
