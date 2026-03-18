# Customer Menu CompanyId Issue - Analysis & Solution

## The Problem

You correctly identified that the customer menu is displaying without a `companyId` in the route, and you're wondering how it's pulling the correct menu.

**Current Situation:** It's **NOT pulling the correct menu** - it's pulling **ALL menu items from ALL companies**!

## Root Cause Analysis

### How It Currently Works (Incorrectly):

1. **Customer scans QR code** → Creates session with `companyId`
   - Session stored in `CustomerSessionService` includes `companyId`
   - Session example: `{ id: 'session-xxx', companyId: 'company-123', tableId: 'table-1', ... }`

2. **Customer navigates to menu** (`/customer/menu`)
   - Route has NO `companyId` parameter
   - Component loads session from `CustomerSessionService`
   - Session contains the `companyId`

3. **Menu loads items** (Line 923 in `menu.component.ts`):
   ```typescript
   this.apiService.getMenuItems().subscribe({
     next: (items) => {
       this.menuItems = items;  // ❌ ALL items from ALL companies!
   ```

4. **Backend returns ALL menu items**:
   ```typescript
   // backend/src/modules/menu/menu.service.ts
   async getMenuItems() {
     return this.prisma.menu.findMany();  // ❌ No filtering!
   }
   ```

### The Issue:

- Customer at **Restaurant A** sees menu items from **Restaurant B, C, D, etc.**
- No company-specific filtering happens
- If you have 5 restaurants with 20 items each, customer sees all 100 items!

## Why This Hasn't Caused Major Issues (Yet):

1. **Test Environment**: You might only have one restaurant with menu items
2. **Data Isolation by Creation**: If each restaurant's menu was created with its `companyId`, the frontend could filter client-side
3. **Lucky Timing**: The issue manifests when multiple restaurants have overlapping menu items

## The Correct Solution

There are **three possible approaches**:

### Option 1: Filter on Backend (RECOMMENDED) ✅

**Change the API to accept companyId and filter server-side:**

#### Backend Changes:

**Update `menu.service.ts`:**
```typescript
async getMenuItems(companyId?: string): Promise<MenuItem[]> {
  const whereClause = companyId ? { companyId } : {};
  
  return this.prisma.menu.findMany({
    where: whereClause,
    orderBy: { name: 'asc' }
  });
}
```

**Update `menu.controller.ts`:**
```typescript
@Get()
@ApiOperation({ summary: 'Get all menu items' })
async getMenuItems(@Query('companyId') companyId?: string) {
  return this.menuService.getMenuItems(companyId);
}
```

#### Frontend Changes:

**Update `menu.component.ts`:**
```typescript
loadMenu() {
  this.loading = true;
  const session = this.sessionService.getSession();
  
  if (!session) {
    this.router.navigate(['/customer/welcome']);
    return;
  }

  // Pass companyId to API
  this.apiService.getMenuItems(session.companyId).subscribe({
    next: (items) => {
      this.menuItems = items.map(item => ({
        ...item,
        price: parseFloat(item.price.toString())
      }));
      
      // Extract unique categories
      const uniqueCategories = [...new Set(items.map((item: any) => item.category))];
      this.categories = ['All', ...uniqueCategories.sort()];
      
      this.filterMenu();
      this.loading = false;
    },
    error: (error) => {
      console.error('Error loading menu:', error);
      this.loading = false;
    }
  });
}
```

**Update `api.service.ts`:**
```typescript
getMenuItems(companyId?: string): Observable<MenuItem[]> {
  const params = companyId ? { companyId } : {};
  return this.http.get<MenuItem[]>(`${this.apiUrl}/menu`, { params });
}
```

**Benefits:**
- ✅ Reduces data transfer (only sends relevant items)
- ✅ Enforces security at API level
- ✅ Consistent with admin dashboard filtering pattern
- ✅ Scalable (works with 1000s of restaurants)

---

### Option 2: Filter on Frontend ⚠️

**Keep backend as-is, filter in component:**

```typescript
loadMenu() {
  this.loading = true;
  const session = this.sessionService.getSession();
  
  if (!session) {
    this.router.navigate(['/customer/welcome']);
    return;
  }

  this.apiService.getMenuItems().subscribe({
    next: (items) => {
      // Filter by companyId client-side
      const companyItems = items.filter(item => item.companyId === session.companyId);
      
      this.menuItems = companyItems.map(item => ({
        ...item,
        price: parseFloat(item.price.toString())
      }));
      
      // Rest of the code...
    }
  });
}
```

**Drawbacks:**
- ❌ Sends ALL menu items to every customer (wasted bandwidth)
- ❌ Security: Customer can see other restaurants' items in network tab
- ❌ Poor performance with many restaurants
- ❌ Not scalable

---

### Option 3: Use CompanyContextService (Alternative) 🔄

**Leverage the existing `CompanyContextService` pattern:**

If customer PWA had company context like admin does, you could use the centralized state management approach. However, this requires:
- Customer PWA to have `CompanyContextService` injected
- Routes to include `/:companyGuid` parameter
- More significant refactoring

**Not recommended for customer PWA** because:
- Customers shouldn't have multi-company context
- QR code flow already provides companyId via session
- Would complicate the simple customer UX

---

## Recommended Implementation Steps

### Step 1: Update Backend

1. Modify `MenuService.getMenuItems()` to accept optional `companyId`
2. Update `MenuController` to accept `companyId` query parameter
3. Add filtering logic in service

### Step 2: Update Frontend API Service

1. Modify `ApiService.getMenuItems()` to accept optional `companyId`
2. Pass as query parameter

### Step 3: Update Customer Menu Component

1. Get `companyId` from session
2. Pass to `apiService.getMenuItems(companyId)`

### Step 4: Test

1. Create menu items for multiple restaurants
2. Scan QR for Restaurant A → Should see ONLY Restaurant A's menu
3. Scan QR for Restaurant B → Should see ONLY Restaurant B's menu
4. Check network tab → API should send filtered results

---

## Security Implications

### Current State (Insecure):
```
GET /api/menu
Response: [
  { id: '1', name: 'Burger', companyId: 'restaurant-a', ... },
  { id: '2', name: 'Pizza', companyId: 'restaurant-b', ... },
  { id: '3', name: 'Sushi', companyId: 'restaurant-c', ... }
]
```

Customer at Restaurant A can see:
- Restaurant B's menu items
- Restaurant C's menu items
- All pricing information
- All item IDs (could place orders for wrong restaurant!)

### Secure State (With Filtering):
```
GET /api/menu?companyId=restaurant-a
Response: [
  { id: '1', name: 'Burger', companyId: 'restaurant-a', ... }
]
```

Customer at Restaurant A can ONLY see Restaurant A's items.

---

## Why This Matters More As You Scale

### With 1 Restaurant:
- No problem (only 1 company's items exist)
- Frontend filtering would work fine

### With 5 Restaurants:
- Customer downloads 5× the necessary data
- Privacy concern (seeing competitor menus)
- Slower load times

### With 50 Restaurants:
- **Unacceptable performance** (1000+ menu items downloaded)
- **Major privacy issue** (exposing all restaurant menus)
- **Security risk** (customer could manipulate requests to order from wrong restaurant)

---

## Existing Pattern in Your Codebase

You're **already doing this correctly** for the admin dashboard!

**In `admin.component.ts` (lines 122-135):**
```typescript
this.menuItems$ = this.companyData.menuItems$;
// Which filters by companyId
```

**In `CompanyDataService`:**
```typescript
this.menuItems$ = combineLatest([
  this.companyContext.companyId$,
  this.menuService.getMenuItems()
]).pipe(
  map(([companyId, menuItems]) => {
    if (!companyId) return [];
    return menuItems.filter(item => item.companyId === companyId);
  })
);
```

**Just need to apply the same pattern to customer menu!**

---

## Summary

**Current State:** ❌ Customer menu shows ALL items from ALL restaurants

**Root Cause:** No `companyId` filtering when loading menu

**Solution:** Pass `session.companyId` to `apiService.getMenuItems(companyId)` and filter on backend

**Priority:** **HIGH** - This is a data leakage and performance issue that will get worse as you add more restaurants

**Effort:** **LOW** - ~30 minutes to implement (3 file changes)

---

## Quick Fix Code

If you want the quick fix right now, here's the exact code:

### 1. Update `frontend/src/app/services/api.service.ts`:

```typescript
getMenuItems(companyId?: string): Observable<MenuItem[]> {
  const url = `${this.apiUrl}/menu`;
  const params = companyId ? { companyId } : {};
  return this.http.get<MenuItem[]>(url, { params });
}
```

### 2. Update `frontend/src/app/customer-pwa/pages/menu.component.ts` line 921-942:

```typescript
loadMenu() {
  this.loading = true;
  const session = this.sessionService.getSession();
  
  if (!session || !session.companyId) {
    this.router.navigate(['/customer/welcome']);
    return;
  }

  // Filter by companyId
  this.apiService.getMenuItems(session.companyId).subscribe({
    next: (items) => {
      this.menuItems = items.map(item => ({
        ...item,
        price: parseFloat(item.price.toString())
      }));
      
      // Extract unique categories
      const uniqueCategories = [...new Set(items.map((item: any) => item.category))];
      this.categories = ['All', ...uniqueCategories.sort()];
      
      this.filterMenu();
      this.loading = false;
    },
    error: (error) => {
      console.error('Error loading menu:', error);
      this.loading = false;
    }
  });
}
```

### 3. Update `backend/src/modules/menu/menu.service.ts`:

```typescript
async getMenuItems(companyId?: string): Promise<any[]> {
  const whereClause: any = companyId ? { companyId } : {};
  
  const items = await this.prisma.menu.findMany({
    where: whereClause,
    orderBy: { name: 'asc' }
  });
  
  console.log(`Returning ${items.length} menu items${companyId ? ` for company ${companyId}` : ''}`);
  return items;
}
```

### 4. Update `backend/src/modules/menu/menu.controller.ts`:

```typescript
@Get()
@ApiOperation({ summary: 'Get all menu items' })
@ApiQuery({ name: 'companyId', required: false, description: 'Filter by company ID' })
async getMenuItems(@Query('companyId') companyId?: string) {
  return this.menuService.getMenuItems(companyId);
}
```

Done! Now customer menu will only show items from their restaurant.


