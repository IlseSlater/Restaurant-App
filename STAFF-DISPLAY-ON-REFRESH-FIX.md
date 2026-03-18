# Staff Display on Screen Refresh Fix

## Issue
When refreshing the admin screen or switching to the Staff Management tab, staff members were not displaying in the grid, even though they were being loaded in the console (as shown by the waiter service logs).

## Root Cause
The `setActiveTab` method was only calling `refreshStaffAndWaiters()` when switching to the 'tables' tab, but **not** when switching to the 'staff' tab. This meant:

1. On initial page load/refresh, if you landed on the Staff Management tab, the staff observable would not be triggered to fetch fresh data.
2. When switching from another tab to the Staff Management tab, the staff list would not be refreshed.
3. The observable was set up correctly with `switchMap` and `refreshTrigger$`, but the trigger was never being incremented when the staff tab was activated.

## Solution

Updated `setActiveTab` method in `frontend/src/app/admin.component.ts` to call `refreshStaffAndWaiters()` for **both** the 'staff' and 'tables' tabs:

### Before:
```typescript
setActiveTab(tab: string) {
  this.activeTab = tab;
  
  // Force refresh waiters when opening Table Management tab
  if (tab === 'tables') {
    console.log('Table Management tab opened - refreshing waiters...');
    this.refreshStaffAndWaiters();
  }
}
```

### After:
```typescript
setActiveTab(tab: string) {
  this.activeTab = tab;
  
  // Force refresh staff and waiters when opening relevant tabs
  if (tab === 'tables' || tab === 'staff') {
    console.log(`${tab === 'tables' ? 'Table Management' : 'Staff Management'} tab opened - refreshing staff and waiters...`);
    this.refreshStaffAndWaiters();
  }
}
```

## How it Works Now

1. **On Page Refresh**: When the page loads and the default tab (or current tab) is displayed, if it's either 'staff' or 'tables', the `refreshStaffAndWaiters()` method is called.

2. **On Tab Switch**: When switching to either the Staff Management or Table Management tab, the refresh is triggered automatically.

3. **Reactive Chain**: The refresh increments `refreshTrigger$`, which causes the `staffMembers$` and `waiters$` observables to refetch data via `switchMap`, ensuring the latest data is displayed.

## Files Changed

- `frontend/src/app/admin.component.ts` - Updated `setActiveTab` method to refresh data for both 'staff' and 'tables' tabs

## Related Issues

This fix complements the previous fixes:
- `STAFF-AND-WAITER-REFRESH-FIX.md` - Implemented the reactive refresh mechanism
- `STAFF-CREATION-COMPANYID-FIX.md` - Fixed staff not appearing due to missing `companyId`
- `WAITER-ASSIGNMENT-OBSERVABLE-FIX.md` - Fixed table list not being filtered after waiter assignment

## Testing

1. ✅ Refresh the admin page while on the Staff Management tab - staff should display immediately
2. ✅ Switch from another tab to Staff Management - staff should load
3. ✅ Create a new staff member - they should appear in the grid
4. ✅ Switch to Table Management tab - waiters should be available in the dropdown

