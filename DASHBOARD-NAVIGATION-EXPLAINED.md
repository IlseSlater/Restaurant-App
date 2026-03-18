# How the Current Dashboard Card Navigation Works

## What the dashboard does

The **navigation component** (home page at `/`) shows five cards:

| Card | Button label | Click handler | Route navigated to |
|------|----------------|----------------|---------------------|
| Customer Interface | "Enter as Customer" | `navigateTo('/customer')` | `/customer` |
| Waiter Dashboard | "Enter as Waiter" | `navigateTo('/waiter')` | `/waiter` |
| Kitchen Interface | "Enter Kitchen" | `navigateTo('/kitchen')` | `/kitchen` |
| Bar Interface | "Enter Bar" | `navigateTo('/bar')` | `/bar` |
| Admin Panel | "Enter as Admin" | `navigateTo('/admin')` | `/admin` |

So each card simply calls `router.navigate([route])` with the path shown above. There is no company selection or role-specific logic on the dashboard.

---

## Why Waiter, Kitchen, and Bar send you to the Admin page

In **`app.routes.ts`** there are two kinds of routes for staff:

### 1. Real staff routes (require company and auth)

- **Waiter:** `path: 'waiter/:companyGuid'` → loads WaiterComponent (with StaffAuthGuard + CompanyGuard)
- **Kitchen:** `path: 'kitchen/:companyGuid'` → loads KitchenComponent
- **Bar:** `path: 'bar/:companyGuid'` → loads BarComponent

So the **actual** Waiter, Kitchen, and Bar UIs are only available at URLs that include a **company GUID**, for example:

- `http://localhost:4200/waiter/11111111-1111-1111-1111-111111111111`
- `http://localhost:4200/kitchen/11111111-1111-1111-1111-111111111111`
- `http://localhost:4200/bar/11111111-1111-1111-1111-111111111111`

### 2. “Legacy” routes (no company GUID)

Below the admin section, the app defines:

```ts
{ path: 'waiter',  redirectTo: 'admin/system', pathMatch: 'full' },
{ path: 'kitchen', redirectTo: 'admin/system', pathMatch: 'full' },
{ path: 'bar',     redirectTo: 'admin/system', pathMatch: 'full' }
```

So:

- **`/waiter`** (no GUID) → redirects to **`/admin/system`**
- **`/kitchen`** (no GUID) → redirects to **`/admin/system`**
- **`/bar`** (no GUID) → redirects to **`/admin/system`**

The dashboard cards use exactly these paths: `/waiter`, `/kitchen`, `/bar`. So when you click “Enter as Waiter”, “Enter Kitchen”, or “Enter Bar”, the app navigates to that path, the router matches the legacy route, and **redirects you to the Admin (System Admin) page**. So the behaviour you see (always ending on the admin page) is exactly what the current route configuration does.

---

## Summary

| You click | Dashboard navigates to | What the router does | Where you end up |
|-----------|------------------------|----------------------|-------------------|
| Enter as Customer | `/customer` | Matches `customer` (has children); default child is `phone-login` | Customer flow (e.g. phone-login / restaurants) |
| Enter as Waiter | `/waiter` | Matches legacy `waiter` → **redirectTo admin/system** | **Admin (System) page** |
| Enter Kitchen | `/kitchen` | Matches legacy `kitchen` → **redirectTo admin/system** | **Admin (System) page** |
| Enter Bar | `/bar` | Matches legacy `bar` → **redirectTo admin/system** | **Admin (System) page** |
| Enter as Admin | `/admin` | Matches `admin`; default child is `system` | Admin (System) page |

So: **the buttons on the Waiter, Kitchen, and Bar cards do not take you to those interfaces because the routes for `/waiter`, `/kitchen`, and `/bar` (without a company GUID) are defined only as redirects to the admin system page.** To actually use Waiter/Kitchen/Bar, you must use URLs that include a company GUID (and then pass staff login for that company).

---

## Intended staff flow (today)

1. Go to **Admin** → **System Admin**.
2. Pick a company and get its **staff URLs** (e.g. “Copy waiter URL” / “Copy kitchen URL” / “Copy bar URL”), which look like `/waiter/{companyGuid}`, etc.
3. Open that URL (or use it from the dashboard if we change the dashboard to use it).
4. You are sent to **Staff login** for that company (`/staff/login/:companyGuid`); after PIN login you are taken to the corresponding interface (currently the code defaults post-login to Kitchen unless `returnUrl` is set).

So the dashboard cards do **not** implement this flow; they only navigate to paths that, for Waiter/Kitchen/Bar, are configured as redirects to admin.

---

## What needs to change (for your request)

To make the Waiter, Kitchen, and Bar **cards** take you to the real interfaces:

1. **Either** send the user to a **staff entry/company selection** step, then to **staff login** with the chosen company and a **returnUrl** to the correct role (`/waiter/:companyGuid`, `/kitchen/:companyGuid`, or `/bar/:companyGuid`),  
2. **Or** (for a simple demo) use a **default company GUID** and link each card to:
   - `staff/login/{defaultCompanyGuid}?returnUrl=/waiter/{defaultCompanyGuid}` for Waiter,
   - and the same pattern for Kitchen and Bar.

Then, after PIN login, the existing `returnUrl` logic in staff login will send the user to the correct Waiter/Kitchen/Bar page.

I can next propose exact route and navigation changes (and, if you want, the full flow and API checks for customer → bar/kitchen → waiter updates and card visibility) so the dashboard buttons match the behaviour you want.
