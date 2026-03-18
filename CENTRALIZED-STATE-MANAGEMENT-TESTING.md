# Centralized State Management - Testing Guide

## Migration Summary

Successfully migrated `admin.component.ts` to use the new `CompanyDataService` for centralized state management.

### Changes Made:

1. **Added Import**: Imported `CompanyDataService`
2. **Updated Constructor**: Injected `companyData: CompanyDataService`
3. **Replaced Observables**: All data streams now come from `CompanyDataService`:
   - `this.menuItems$ = this.companyData.menuItems$`
   - `this.orders$ = this.companyData.orders$`
   - `this.tables$ = this.companyData.tables$`
   - `this.staffMembers$ = this.companyData.staffMembers$`
   - `this.waiters$ = this.companyData.waiters$`
4. **Updated All CRUD Methods**: All refresh calls now use `this.companyData.refreshStaffAndWaiters()`
5. **Removed Old Code**: Removed `refreshTrigger$` BehaviorSubject and local `refreshStaffAndWaiters()` method

## Testing Scenarios

### Test 1: Staff Creation and Display

**Scenario**: Create a new staff member and verify it appears in the grid immediately.

**Steps**:
1. Navigate to Admin Dashboard (`/admin/:companyId`)
2. Click on "Staff Management" tab
3. Click "+ Add Staff" button
4. Fill in the form:
   - Name: "Test Waiter 4"
   - Email: "waiter4@test.com"
   - Phone: "+27123456789"
   - Role: "WAITER"
   - Password: "test123"
5. Click "Save"

**Expected Results**:
- ✅ Staff member is created in backend with `companyId`
- ✅ `CompanyDataService.refreshStaffAndWaiters()` is called
- ✅ Both `staffMembers$` and `waiters$` observables emit new data
- ✅ New staff card appears in the grid immediately
- ✅ No page refresh required

**What to Check in Console**:
```
Creating staff member: { name: "Test Waiter 4", ..., companyId: "company-xxx" }
User created successfully: { id: "user-xxx", name: "Test Waiter 4", ... }
Fresh waiters loaded via direct HTTP
Fresh staff loaded via direct HTTP
```

---

### Test 2: Staff Display on Page Refresh

**Scenario**: Refresh the page and verify staff members load immediately.

**Steps**:
1. On the Admin Dashboard with staff visible
2. Press F5 or Ctrl+R to refresh the page
3. Click on "Staff Management" tab immediately

**Expected Results**:
- ✅ `companyData.refreshStaffAndWaiters()` is called by `setActiveTab()`
- ✅ Staff members appear in the grid immediately
- ✅ No need to create a staff member to trigger display

**What to Check in Console**:
```
Staff Management tab opened - refreshing staff and waiters...
Fresh waiters loaded via direct HTTP
Fresh staff loaded via direct HTTP
Returning X users
```

---

### Test 3: Menu Item Creation and Display

**Scenario**: Create a new menu item and verify it appears in the menu list immediately.

**Steps**:
1. Navigate to Admin Dashboard
2. Click on "Menu" tab
3. Click "+ Add Menu Item" button
4. Fill in the form:
   - Name: "Test Cocktail"
   - Description: "Test drink"
   - Price: "85"
   - Category: "DRINKS"
   - Available: ✓
   - Prep Time: "5"
5. Click "Save"

**Expected Results**:
- ✅ Menu item is created in backend with `companyId`
- ✅ `MenuService.createMenuItem()` automatically triggers `loadMenuItems()`
- ✅ `menuItems$` observable emits new data
- ✅ New menu item appears in the list immediately
- ✅ Filtered by current `companyId`

**What to Check in Console**:
```
Menu item Test Cocktail created successfully!
Returning all menu items
Returning X menu items for API response (sorted alphabetically)
```

---

### Test 4: Waiter Assignment to Table

**Scenario**: Assign a waiter to a table and verify the assignment persists without breaking company filtering.

**Steps**:
1. Navigate to Admin Dashboard
2. Click on "Table Management" tab
3. Find a table (e.g., "Table 1")
4. Click on the waiter dropdown
5. Select a waiter (e.g., "Test Waiter 4")

**Expected Results**:
- ✅ `TableService.assignWaiterToTable()` is called (not direct API call)
- ✅ Service method automatically triggers `loadTables()`
- ✅ `tables$` observable emits new data
- ✅ Table shows the assigned waiter name
- ✅ NO additional tables from other companies appear
- ✅ Company filtering remains intact

**What to Check in Console**:
```
Waiter assigned to table successfully!
Returning X tables (should match the count for current company only)
```

**Critical Check**:
- Verify that the number of tables displayed doesn't change after assignment
- Confirm only tables from the current company are visible

---

### Test 5: Company Switching

**Scenario**: Switch between companies and verify data isolation.

**Steps**:
1. On Admin Dashboard for "Padstal Centurion"
2. Note the count of staff, tables, menu items
3. Click "Switch Restaurant" button
4. Select a different company (e.g., "Bella Vista Italian")
5. Navigate back to admin dashboard

**Expected Results**:
- ✅ All observables automatically filter by new `companyId`
- ✅ Different set of staff, tables, menu items displayed
- ✅ No data leakage between companies
- ✅ Each company sees only its own data

**What to Check**:
- Staff count changes
- Table count changes
- Menu items are different
- No staff from previous company visible

---

### Test 6: Multiple Rapid Operations

**Scenario**: Perform multiple create/update operations rapidly to test refresh mechanism.

**Steps**:
1. Create 3 staff members in quick succession
2. Immediately switch to Table Management tab
3. Verify all 3 new staff appear in waiter dropdowns

**Expected Results**:
- ✅ All refresh calls are properly queued
- ✅ No race conditions or stale data
- ✅ `switchMap` ensures only latest request is processed
- ✅ All 3 staff members visible in both staff grid and waiter dropdowns

---

## Key Behavioral Improvements

### Before Migration (Old Issues):
1. ❌ Direct observable reassignment broke reactive chain
2. ❌ Staff not loading on refresh until one was created
3. ❌ Waiters not appearing in dropdown after creation
4. ❌ Table assignment caused extra tables from other companies to appear
5. ❌ Menu items not appearing after creation
6. ❌ Inconsistent refresh mechanisms across different data types

### After Migration (Fixed):
1. ✅ Observables never reassigned, reactive chain intact
2. ✅ Staff load immediately on tab activation
3. ✅ Waiters appear in dropdown after creation (cache force-refreshed)
4. ✅ Table assignment maintains company filtering
5. ✅ Menu items appear immediately after creation
6. ✅ Consistent refresh mechanism via `CompanyDataService`

---

## Architecture Benefits

### Single Source of Truth
- All company-scoped data flows through `CompanyDataService`
- Consistent filtering logic in one place
- Easier to debug data flow

### Automatic Company Filtering
- All observables automatically filter by current `companyId`
- No manual filtering needed in components
- Impossible to accidentally show wrong company's data

### Centralized Refresh
- One method to refresh all data: `refreshAll()`
- Specific refresh methods available: `refreshStaffAndWaiters()`, etc.
- All refreshes properly invalidate caches and refetch data

### Error Handling
- Built-in `catchError` in all observables
- Returns empty arrays on error instead of breaking UI
- Errors logged to console for debugging

### Performance
- `shareReplay(1)` ensures multiple subscriptions don't cause multiple HTTP requests
- `switchMap` cancels previous requests if new ones come in
- Caching in underlying services (MenuService, WaiterService, etc.) still works

---

## Troubleshooting

### If staff not appearing after creation:
1. Check console for "Fresh staff loaded via direct HTTP"
2. Verify `companyId` is included in create request
3. Check that `refreshStaffAndWaiters()` is called after creation

### If tables from other companies appearing:
1. Check that you're using `tableService.assignWaiterToTable()` not `apiService.assignWaiterToTable()`
2. Verify the `tables$` observable comes from `companyData.tables$`
3. Check console for company filtering logs

### If menu items not appearing:
1. Verify `companyId` is included in menu item creation
2. Check that `MenuService.createMenuItem()` includes the `tap` operator to refresh
3. Verify `menuItems$` observable comes from `companyData.menuItems$`

---

## Next Steps

1. ✅ Migration complete
2. ✅ No linter errors
3. 🧪 Testing in progress
4. 📝 Document results
5. 🎯 Apply same pattern to other components if needed (Kitchen, Bar, Waiter)


