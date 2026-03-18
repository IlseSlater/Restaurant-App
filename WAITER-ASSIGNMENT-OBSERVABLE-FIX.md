# Waiter Assignment Observable Fix

## Issue
When assigning a waiter to a table via the dropdown in the Table Management screen, additional tables from other companies were appearing in the list, breaking the company-specific filtering.

## Root Cause
The `assignWaiterToTable` method in `admin.component.ts` was directly reassigning the `tables$` observable:

```typescript
// WRONG - This breaks the reactive chain
this.tables$ = this.tableService.getTables();
```

This direct reassignment:
1. **Broke the company filtering** - The original `tables$` observable was set up with `combineLatest` to filter tables by `companyId`, but this reassignment created a new observable that bypassed that filtering.
2. **Lost the reactive setup** - The original observable was part of a reactive chain that automatically updated when data changed.
3. **Returned unfiltered data** - The new observable returned ALL tables from ALL companies instead of just the current company's tables.

## The Correct Pattern

The `tables$` observable was properly set up in the constructor:

```typescript
this.tables$ = combineLatest([
  this.companyContext.companyId$,
  this.tableService.getTables()
]).pipe(
  map(([companyId, tables]) => {
    if (!companyId) return [];
    return tables.filter(table => table.companyId === companyId);
  })
);
```

This setup ensures:
- Tables are automatically filtered by the current company
- The observable updates reactively when the underlying data changes
- The filtering logic is preserved throughout the component's lifecycle

## Solution

Changed the `assignWaiterToTable` method to use the `TableService` method instead of calling the API directly:

### Before:
```typescript
assignWaiterToTable(tableId: string, event: any) {
  const waiterId = event.target.value;
  if (waiterId) {
    this.loading = true;
    this.error = null;
    
    this.apiService.assignWaiterToTable(tableId, waiterId).subscribe({
      next: () => {
        alert('Waiter assigned to table successfully!');
        this.loading = false;
        
        // Refresh table data to show updated waiter assignment
        this.tables$ = this.tableService.getTables();  // ❌ WRONG!
        console.log('Table data refreshed after waiter assignment');
      },
      error: (error) => {
        console.error('Error assigning waiter:', error);
        this.error = 'Failed to assign waiter';
        this.loading = false;
      }
    });
  }
}
```

### After:
```typescript
assignWaiterToTable(tableId: string, event: any) {
  const waiterId = event.target.value;
  if (waiterId) {
    this.loading = true;
    this.error = null;
    
    this.tableService.assignWaiterToTable(tableId, waiterId).subscribe({
      next: () => {
        alert('Waiter assigned to table successfully!');
        this.loading = false;
        // No need to manually refresh - TableService handles it ✅
      },
      error: (error) => {
        console.error('Error assigning waiter:', error);
        this.error = 'Failed to assign waiter';
        this.loading = false;
      }
    });
  }
}
```

## Why This Works

The `TableService.assignWaiterToTable` method already has the correct pattern:

```typescript
assignWaiterToTable(tableId: string, waiterId: string): Observable<Table> {
  return this.apiService.assignWaiterToTable(tableId, waiterId).pipe(
    tap(() => this.loadTables())  // Refreshes the BehaviorSubject
  );
}
```

When `loadTables()` is called:
1. It fetches fresh data from the API
2. Updates the `tablesSubject` BehaviorSubject with new data
3. The `tables$` observable in `admin.component.ts` automatically receives the update through the `combineLatest` chain
4. The company filtering is automatically applied
5. The UI updates reactively with only the current company's tables

## Key Lessons

1. **Never directly reassign observables** - If you set up an observable with `combineLatest`, `switchMap`, or other reactive operators, don't replace it with a simple assignment.

2. **Use service methods instead of direct API calls** - Services like `TableService`, `MenuService`, and `WaiterService` have proper refresh logic built in using `BehaviorSubject` and `tap` operators.

3. **Let the reactive pattern work** - When services update their `BehaviorSubject`, all subscribed observables automatically update. You don't need to manually trigger refreshes.

4. **Consistency matters** - This same pattern is used throughout the app:
   - `MenuService.createMenuItem()` → calls `loadMenuItems()`
   - `TableService.updateTableStatus()` → calls `loadTables()`
   - `WaiterService` → has `forceRefreshWaiters()` for cache-busting

## Files Changed

**File: `frontend/src/app/admin.component.ts`**
- Changed `this.apiService.assignWaiterToTable(...)` to `this.tableService.assignWaiterToTable(...)`
- Removed the manual observable reassignment: `this.tables$ = this.tableService.getTables()`
- Removed the console.log statement since the refresh is automatic

## Result

Now when a waiter is assigned to a table:
1. The assignment is saved to the backend ✅
2. The TableService refreshes its data ✅
3. The observable chain updates automatically ✅
4. Only tables for the current company are shown ✅
5. The waiter dropdown remains populated ✅
6. No extra tables from other companies appear ✅

