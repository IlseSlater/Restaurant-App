# Menu Item CompanyId Fix

## Issue
When creating new menu items from the admin interface, they were not appearing in the menu item list even though they were successfully created in the backend.

## Root Cause
Similar to the staff creation issue, menu items were being created without a `companyId`, so when the frontend filtered menu items by `companyId`, the newly created items were excluded.

## Files Changed

### Frontend
**File: `frontend/src/app/admin.component.ts`**
- Updated `saveMenuItem()` method to include `companyId: this.companyId` in the `menuData` object when creating new menu items.

**Before:**
```typescript
const menuData = {
  name: this.menuFormData.name,
  description: this.menuFormData.description,
  price: Number(this.menuFormData.price),
  category: this.menuFormData.category,
  isAvailable: this.menuFormData.isAvailable,
  prepTimeMin: Number(this.menuFormData.prepTime)
};
```

**After:**
```typescript
const menuData = {
  name: this.menuFormData.name,
  description: this.menuFormData.description,
  price: Number(this.menuFormData.price),
  category: this.menuFormData.category,
  isAvailable: this.menuFormData.isAvailable,
  prepTimeMin: Number(this.menuFormData.prepTime),
  companyId: this.companyId  // Added
};
```

### Backend
**File: `backend/src/modules/menu/menu.service.ts`**
- Updated the `createMenuItem` method's DTO type definition to accept `companyId`, `isAvailable`, and `prepTimeMin` parameters.

**Before:**
```typescript
async createMenuItem(createDto: {
  name: string;
  description?: string;
  price: number;
  category: string;
  imageUrl?: string;
}) {
  return this.prisma.menu.create({
    data: createDto,
  });
}
```

**After:**
```typescript
async createMenuItem(createDto: {
  name: string;
  description?: string;
  price: number;
  category: string;
  imageUrl?: string;
  companyId?: string;      // Added
  isAvailable?: boolean;   // Added
  prepTimeMin?: number;    // Added
}) {
  return this.prisma.menu.create({
    data: createDto,
  });
}
```

## How It Works Now

1. When you create a menu item in the admin interface, the system includes the current `companyId`.
2. The backend stores this `companyId` with the new menu item.
3. The `menuItems$` observable in the admin component filters menu items by `companyId`, so the newly created menu item will appear in the list.
4. The existing `MenuService.createMenuItem()` method already calls `loadMenuItems()` via the `tap` operator, ensuring the list refreshes after creation.

## Note About Existing Data
Any menu items created before this fix (like "Tequila Friday" from the logs) will not have a `companyId` and therefore won't appear in the filtered list. These items would need to be:
- Manually updated to include the correct `companyId`, or
- Deleted and recreated through the fixed interface

## Related Fixes
This is the same pattern as the fixes for:
- Staff/User creation (`companyId` not being passed)
- Waiter dropdown not updating (caching issue requiring `forceRefreshWaiters()`)
- Table creation (`companyId` not being passed)

All of these followed the same principle: ensure the `companyId` is passed from the frontend and stored in the backend so that multi-company filtering works correctly.

