# Hardcoded Values Audit

Values that are hardcoded instead of being read from the database or configuration.

---

## 1. Default company ID / GUID

| Location | Value | Purpose | Should be |
|----------|--------|---------|------------|
| `frontend/src/app/navigation.component.ts` | `DEFAULT_COMPANY_GUID = '00000000-0000-0000-0000-000000000000'` | Staff links (Waiter/Kitchen/Bar) from home | First active company from API, or config |
| `frontend/src/app/app.component.ts` | `defaultCompanyGuid = '00000000-0000-0000-0000-000000000000'` | Toolbar “Waiter” link | Same as above |

**Note:** Seed data may use this UUID. If your seed uses a different company id, these links break. Prefer loading the first company from `/api/companies` or storing a “dashboard default company” in config.

---

## 2. Inventory dashboard – company ID

| Location | Value | Purpose | Should be |
|----------|--------|---------|------------|
| `frontend/src/app/inventory/inventory-dashboard.component.ts` | `companyId = '00000000-0000-0000-0000-000000000000'` in `loadInventorySummary()`, `loadInventoryItems()`, `loadAlerts()` | All inventory API calls | From `CompanyContextService` (current company) |

**Fix:** Inject `CompanyContextService` and use `getCurrentCompanyId()` or `currentCompany$`. Only load inventory when a company is selected (e.g. in admin context).

---

## 3. QR code base URL

| Location | Value | Purpose | Should be |
|----------|--------|---------|------------|
| `frontend/src/app/services/qr-code.service.ts` | `baseUrl = 'http://localhost:4200/customer/scan-table'` | QR code links for tables | `environment` origin + path, or `window.location.origin + '/customer/scan-table'` |

**Fix:** Use `environment` (e.g. `environment.appUrl` or `environment.production ? 'https://...' : window.location.origin`) so production QR codes point to the correct domain.

---

## 4. Initial / fallback UI strings

| Location | Value | Purpose | Should be |
|----------|--------|---------|------------|
| `frontend/src/app/admin.component.ts` | `restaurantName = 'Bella Vista Restaurant'` | Initial title before company loads | `''` or `'Loading...'`; then set from `company.name` (already done in ngOnInit) |
| `frontend/src/app/admin/company-wizard.component.ts` | Placeholder `"e.g., Bella Vista Italian"` | Form hint | Fine as placeholder |

---

## 5. Revenue service – fallback number

| Location | Value | Purpose | Should be |
|----------|--------|---------|------------|
| `frontend/src/app/services/revenue.service.ts` | `2847.50` (initial and in catchError) | Default/fallback revenue | `0` or value from API when company-scoped |

**Note:** Backend `/analytics/revenue` may not be company-scoped; if it is, pass `companyId` and use 0 as fallback.

---

## 6. Mock / fallback data (dead or fallback code paths)

| Location | Value | Purpose | Should be |
|----------|--------|---------|------------|
| `frontend/src/app/services/menu.service.ts` | `loadMockMenuItems()` – 8 items with `companyId: '00000000-...'` | Mock menu (method not called from constructor) | Remove or use only in tests; constructor uses API |
| `frontend/src/app/services/table.service.ts` | `loadMockTables()` – 8 tables with same companyId | Mock tables (method not called) | Same as above |
| `frontend/src/app/services/order.service.ts` | `loadMockOrders()`, `createMockOrderFromCart()` – companyId `'00000000-...'` | Mock/fallback orders | If used, pass real companyId; otherwise remove or restrict to dev |

---

## 7. Debug / test-only code

| Location | Value | Purpose | Should be |
|----------|--------|---------|------------|
| `frontend/src/app/customer-pwa/pages/scan-table.component.ts` | `companyId = urlParams.get('companyId') \|\| 'company-1760451721290'` (Tokyo Sushi Bar ID) | Debug `checkStaffForCompany()` | Use URL param only; remove fallback or use current session company |
| `frontend/src/app/customer-pwa/pages/scan-table.component.ts` | `name: 'Bella Vista Restaurant'` in demo/seed payloads | Test company creation data | Demo only; keep or move to constants |
| `frontend/src/app/staff-login.component.ts` | `email: 'test@bellavista.com'` in `createTestStaff()` | Test staff creation | Dev-only; optional to keep |

---

## 8. Backend

- **Seed data** (`backend/prisma/seed.ts`): Company ids, names, etc. are by design for seeding. Ensure the default GUID used in the frontend matches a company id in seed if you rely on it.
- No other backend hardcoding of company IDs found in application code (only seed).

---

## Summary of recommended fixes

1. **Inventory dashboard** – Use `CompanyContextService` for companyId (high impact).
2. **QR code service** – Use environment or `window.location.origin` for base URL (high for production).
3. **Admin component** – Set initial `restaurantName` to `''` (low).
4. **Revenue service** – Use `0` as fallback and ensure API is company-scoped if needed (medium).
5. **Navigation / App component** – Document that default GUID must match seed, or load first company from API (medium).
6. **Scan-table debug** – Remove or narrow fallback company id (low).
7. **Mock methods** in menu/table/order services – Remove unused mocks or pass companyId from context (low).
