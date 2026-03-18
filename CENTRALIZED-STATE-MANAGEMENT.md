# Centralized State Management Service

## Overview

The `CompanyDataService` is a centralized state management solution that solves the recurring issues with data not loading/refreshing properly in the admin component. It provides:

- ✅ **Consistent company filtering** across all data streams
- ✅ **Proper refresh mechanisms** without breaking reactive chains
- ✅ **Single source of truth** for all company data
- ✅ **Automatic cache invalidation** when data changes
- ✅ **Error handling and fallback** patterns

## Architecture

### The Problem It Solves

Previously, the admin component had these issues:

1. **Observable Reassignment**: Direct reassignment like `this.staffMembers$ = this.apiService.getUsers()` broke the reactive chain and company filtering
2. **Inconsistent Refresh**: Different parts of the code refreshed data differently
3. **Missing companyId**: Data created without `companyId` wouldn't appear
4. **Cache Issues**: Services cached data that wasn't invalidated properly

### The Solution

The `CompanyDataService` uses a **central refresh trigger** pattern:

```typescript
private refreshTrigger$ = new BehaviorSubject<number>(0);

// All data streams use combineLatest with refreshTrigger$
this.staffMembers$ = combineLatest([
  this.companyContext.companyId$,
  this.refreshTrigger$
]).pipe(
  switchMap(([companyId, _trigger]) => {
    // Fetch fresh data when trigger changes
    return this.apiService.getUsers().pipe(
      map(users => users.filter(user => user.companyId === companyId))
    );
  }),
  shareReplay(1) // Share among multiple subscribers
);
```

When data changes, we increment the trigger:

```typescript
this.refreshTrigger$.next(this.refreshTrigger$.value + 1);
```

This causes all data streams to refetch automatically, while maintaining their reactive chains.

## Usage

### Basic Usage in Components

Instead of injecting multiple services, inject only `CompanyDataService`:

```typescript
import { CompanyDataService } from './services/company-data.service';

@Component({...})
export class AdminComponent {
  // Subscribe to data streams
  staffMembers$ = this.companyData.staffMembers$;
  waiters$ = this.companyData.waiters$;
  tables$ = this.companyData.tables$;
  menuItems$ = this.companyData.menuItems$;
  orders$ = this.companyData.orders$;

  constructor(private companyData: CompanyDataService) {}
}
```

### Creating Data

Use the service's create methods that include automatic refresh:

```typescript
// Create staff member
this.companyData.createStaffMember({
  name: 'John Doe',
  email: 'john@example.com',
  phoneNumber: '0123456789',
  role: 'WAITER',
  password: 'default123'
}).subscribe({
  next: (user) => {
    console.log('Staff created:', user);
    // Data automatically refreshes!
  },
  error: (err) => console.error('Error:', err)
});

// Create table
this.companyData.createTable({
  number: 1,
  seats: 4,
  status: 'AVAILABLE'
}).subscribe({
  next: (table) => {
    console.log('Table created:', table);
    // Data automatically refreshes!
  }
});

// Create menu item
this.companyData.createMenuItem({
  name: 'Pizza Margherita',
  description: 'Classic Italian pizza',
  price: 12.99,
  category: 'FOOD',
  isAvailable: true,
  prepTimeMin: 15
}).subscribe({
  next: (item) => {
    console.log('Menu item created:', item);
    // Data automatically refreshes!
  }
});
```

### Updating Data

```typescript
// Update staff member
this.companyData.updateStaffMember(userId, {
  name: 'Jane Doe Updated',
  role: 'MANAGER'
}).subscribe({
  next: (user) => console.log('Updated:', user)
});

// Update table
this.companyData.updateTable(tableId, {
  status: 'OCCUPIED'
}).subscribe({
  next: (table) => console.log('Updated:', table)
});

// Assign waiter to table
this.companyData.assignWaiterToTable(tableId, waiterId).subscribe({
  next: (table) => console.log('Waiter assigned:', table)
});
```

### Deleting Data

```typescript
// Delete staff member
this.companyData.deleteStaffMember(userId).subscribe({
  next: () => console.log('Staff deleted')
});

// Delete menu item
this.companyData.deleteMenuItem(itemId).subscribe({
  next: () => console.log('Menu item deleted')
});
```

### Manual Refresh

For operations done outside the service:

```typescript
// Refresh everything
this.companyData.refreshAll();

// Refresh specific data
this.companyData.refreshStaffAndWaiters();
this.companyData.refreshTables();
this.companyData.refreshMenu();
this.companyData.refreshOrders();
```

## Migration Guide

### Before (Admin Component - Old Pattern)

```typescript
export class AdminComponent {
  staffMembers$: Observable<User[]>;
  
  constructor(
    private apiService: ApiService,
    private waiterService: WaiterService,
    private companyContext: CompanyContextService
  ) {
    // Setup observable
    this.staffMembers$ = combineLatest([
      this.companyContext.companyId$,
      this.refreshTrigger$
    ]).pipe(
      switchMap(([companyId]) => {
        return this.apiService.getUsers().pipe(
          map(users => users.filter(user => user.companyId === companyId))
        );
      })
    );
  }
  
  createStaffMember() {
    const userData = { ...this.formData, companyId: this.companyId };
    this.apiService.createUser(userData).subscribe({
      next: (user) => {
        // Manual refresh
        this.waiterService.forceRefreshWaiters();
        this.refreshTrigger$.next(this.refreshTrigger$.value + 1);
      }
    });
  }
}
```

### After (Admin Component - New Pattern)

```typescript
export class AdminComponent {
  // Just reference the service streams
  staffMembers$ = this.companyData.staffMembers$;
  waiters$ = this.companyData.waiters$;
  
  constructor(private companyData: CompanyDataService) {}
  
  createStaffMember() {
    // Automatic companyId injection and refresh!
    this.companyData.createStaffMember(this.formData).subscribe({
      next: (user) => {
        console.log('Created:', user);
        // No manual refresh needed!
      }
    });
  }
}
```

## Benefits

1. **Eliminates Observable Reassignment Issues**: No more `this.staffMembers$ = ...` that breaks filtering
2. **Automatic companyId Injection**: Service always includes current `companyId`
3. **Consistent Refresh Pattern**: All mutations trigger the same refresh mechanism
4. **Type Safety**: All methods properly typed with interfaces
5. **Error Handling**: Built-in error handling with fallbacks
6. **Performance**: Uses `shareReplay(1)` to avoid duplicate API calls
7. **Centralized Logic**: One place to manage all company data

## Data Streams Available

| Stream | Description | Filtered By Company |
|--------|-------------|---------------------|
| `staffMembers$` | All users for the company | ✅ |
| `waiters$` | Users with WAITER role | ✅ |
| `tables$` | All tables for the company | ✅ |
| `menuItems$` | All menu items for the company | ✅ |
| `orders$` | All orders for the company | ✅ |

## Methods Available

### Data Streams
- `staffMembers$`: Observable<User[]>
- `waiters$`: Observable<User[]>
- `tables$`: Observable<Table[]>
- `menuItems$`: Observable<MenuItem[]>
- `orders$`: Observable<Order[]>

### Staff Operations
- `createStaffMember(staffData)`: Observable<User>
- `updateStaffMember(userId, updates)`: Observable<User>
- `deleteStaffMember(userId)`: Observable<void>

### Table Operations
- `createTable(tableData)`: Observable<Table>
- `updateTable(tableId, updates)`: Observable<Table>
- `assignWaiterToTable(tableId, waiterId)`: Observable<Table>

### Menu Operations
- `createMenuItem(menuData)`: Observable<MenuItem>
- `updateMenuItem(itemId, updates)`: Observable<MenuItem>
- `deleteMenuItem(itemId)`: Observable<void>

### Refresh Operations
- `refreshAll()`: void
- `refreshStaffAndWaiters()`: void
- `refreshTables()`: void
- `refreshMenu()`: void
- `refreshOrders()`: void
- `clearAllData()`: void

### Utility
- `getCurrentCompanyId()`: string | null

## Best Practices

### ✅ DO

```typescript
// Use the service's create methods
this.companyData.createStaffMember(data).subscribe(...);

// Subscribe to the service's observables
this.staffMembers$ = this.companyData.staffMembers$;

// Use async pipe in template
<div *ngFor="let staff of staffMembers$ | async">
```

### ❌ DON'T

```typescript
// Don't reassign observables
this.staffMembers$ = this.apiService.getUsers(); // BREAKS FILTERING!

// Don't forget companyId
this.apiService.createUser({ name: 'John' }); // NO COMPANYID!

// Don't manually construct observables
this.staffMembers$ = this.apiService.getUsers().pipe(
  map(users => users.filter(...))
); // BREAKS REFRESH TRIGGER!
```

## Testing

The service can be easily mocked for testing:

```typescript
const mockCompanyDataService = {
  staffMembers$: of([mockUser1, mockUser2]),
  createStaffMember: jasmine.createSpy().and.returnValue(of(mockUser1)),
  refreshAll: jasmine.createSpy()
};

TestBed.configureTestingModule({
  providers: [
    { provide: CompanyDataService, useValue: mockCompanyDataService }
  ]
});
```

## Future Enhancements

Potential improvements:

1. **Optimistic Updates**: Update UI immediately, rollback on error
2. **Offline Support**: Queue operations when offline
3. **Real-time Updates**: Integrate WebSocket events to trigger refreshes
4. **Fine-grained Updates**: Update single items instead of refetching all
5. **Query Params**: Support filtering, sorting, pagination
6. **Cache TTL**: Automatic cache expiration after time period

## Troubleshooting

### Issue: Data not showing after creation

**Solution**: Ensure you're using the service's create methods, not direct API calls:

```typescript
// ❌ Wrong
this.apiService.createUser(data).subscribe(...);

// ✅ Correct
this.companyData.createStaffMember(data).subscribe(...);
```

### Issue: Data showing from wrong company

**Solution**: The service automatically filters by current `companyId`. Check that `CompanyContextService` has the correct company set:

```typescript
console.log('Current company:', this.companyData.getCurrentCompanyId());
```

### Issue: Need to manually refresh

**Solution**: Use the appropriate refresh method:

```typescript
// After external operations
this.companyData.refreshAll();

// Or specific refresh
this.companyData.refreshStaffAndWaiters();
```

## Related Files

- `frontend/src/app/services/company-data.service.ts` - Main service
- `frontend/src/app/services/company-context.service.ts` - Company context
- `frontend/src/app/services/api.service.ts` - HTTP API calls
- `frontend/src/app/services/waiter.service.ts` - Waiter-specific operations
- `frontend/src/app/services/table.service.ts` - Table-specific operations
- `frontend/src/app/services/menu.service.ts` - Menu-specific operations
- `frontend/src/app/services/order.service.ts` - Order-specific operations

## Conclusion

The `CompanyDataService` provides a robust, consistent pattern for managing all company-scoped data. By using this service, you eliminate the common pitfalls of observable reassignment, missing companyIds, and inconsistent refresh patterns.

All new components should use this service as the primary data source for company-related data.

