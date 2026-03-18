# Fixes Applied - Phone Numbers & Tables Display

## Date: 2025-10-10

## Issues Fixed

### 1. ✅ Tables Not Displaying (companyId: undefined)
### 2. ✅ Phone Numbers Not Displaying on Staff Cards (phone vs phoneNumber mismatch)

---

## Root Cause Analysis

### Issue 1: Tables with `companyId: undefined`

**Backend Log Evidence:**
```javascript
Created new table: {
  id: 'table-1760088562186',
  number: 1,
  qrCode: 'QR-TABLE-001',
  status: 'AVAILABLE',
  companyId: undefined,  // ❌ PROBLEM
  ...
}
```

**Frontend Log Evidence:**
```javascript
🪑 All tables from service: (12) [{...}]  // ✅ Tables exist
🪑 Filtered tables for company company-1760088056027: []  // ❌ Empty after filter
```

**Root Cause:**
The `TablesController` was not accepting `companyId` in the request body. The DTO only accepted `{ number, qrCode }`, so when the wizard sent `{ number, qrCode, companyId, status }`, the `companyId` was being stripped out by the controller before reaching the service.

**Files:**
- `backend/src/modules/tables/tables.controller.ts` - Line 30

### Issue 2: Phone Numbers Not Displaying

**Backend Log Evidence:**
```javascript
Created new user: {
  id: 'user-1760088581240',
  phoneNumber: '0730238921',  // ✅ Saved correctly
  ...
}
```

**Frontend Evidence:**
- Staff cards showed "No phone number"
- Console showed users with `phone` field, not `phoneNumber`

**Root Cause:**
Field name mismatch between database and frontend:
- **Database field**: `phone` (Prisma schema)
- **Frontend expects**: `phoneNumber` (User interface)
- **API was returning**: `phone` (raw database field)

The frontend was looking for `phoneNumber`, but the API was returning the raw `phone` field from the database without transformation.

**Files:**
- `backend/src/modules/auth/auth.service.ts` - `sanitizeUser()` method
- `backend/src/modules/users/users.service.ts` - All user-returning methods

---

## Fixes Applied

### Fix 1: Table Controller DTO Update

**File:** `backend/src/modules/tables/tables.controller.ts`

**Before:**
```typescript
@Post()
@ApiOperation({ summary: 'Create new table' })
async createTable(@Body() createDto: { number: number; qrCode?: string }) {
  return this.tablesService.createTable(createDto);
}
```

**After:**
```typescript
@Post()
@ApiOperation({ summary: 'Create new table' })
async createTable(@Body() createDto: { number: number; qrCode?: string; companyId?: string; status?: string }) {
  return this.tablesService.createTable(createDto);
}
```

**Result:** Now accepts all fields sent by the wizard, including `companyId`.

---

### Fix 2: Auth Service User Transformation

**File:** `backend/src/modules/auth/auth.service.ts`

**Before:**
```typescript
private sanitizeUser(user: any) {
  const { password, pin, ...sanitized } = user;
  return sanitized;
}
```

**After:**
```typescript
private sanitizeUser(user: any) {
  const { password, pin, phone, ...sanitized } = user;
  return {
    ...sanitized,
    phoneNumber: phone // Map 'phone' field to 'phoneNumber' for frontend
  };
}
```

**Result:** Staff creation now returns `phoneNumber` to the frontend.

---

### Fix 3: Users Service User Transformation

**File:** `backend/src/modules/users/users.service.ts`

**Added transformation method:**
```typescript
private transformUser(user: any) {
  const { password, pin, phone, ...sanitized } = user;
  return {
    ...sanitized,
    phoneNumber: phone // Map 'phone' to 'phoneNumber' for frontend consistency
  };
}
```

**Updated methods:**
```typescript
async getAllUsers() {
  const users = await this.prisma.user.findMany();
  return users.map(user => this.transformUser(user));
}

async getWaiters() {
  const waiters = await this.prisma.user.findMany({
    where: { role: 'WAITER' }
  });
  return waiters.map(user => this.transformUser(user));
}

async getUser(id: string) {
  const user = await this.prisma.user.findUnique({
    where: { id }
  });
  return user ? this.transformUser(user) : null;
}
```

**Result:** All user API endpoints now return `phoneNumber` instead of raw `phone` field.

---

## Expected Behavior After Fixes

### Tables:
1. ✅ Wizard creates tables with `companyId`
2. ✅ Tables are stored with correct `companyId`
3. ✅ Admin dashboard filters tables by `companyId`
4. ✅ Tables display in "Table Management" tab

### Phone Numbers:
1. ✅ Wizard creates staff with `phoneNumber`
2. ✅ Backend stores as `phone` in database
3. ✅ API returns transformed `phoneNumber` to frontend
4. ✅ Staff cards display phone number

---

## Testing Instructions

1. **Clear existing data** (optional - creates clean slate):
   - Delete old companies from `/admin/system`
   - Or restart backend to reset mock data

2. **Create new company:**
   - Go to `/admin/system`
   - Click "Create Company" or "Setup Wizard"
   - Fill in company details
   - Generate 10 tables
   - Add at least 1 staff member **with phone number**
   - Complete wizard

3. **Verify Tables:**
   - Open browser console (F12)
   - Go to admin dashboard
   - Navigate to "Table Management" tab
   - **Expected:** See all 10 tables
   - **Console logs:** Should show:
     - `Created new table:` with `companyId: "company-xxx"`
     - `Filtered tables for company...` with array of 10 tables

4. **Verify Phone Numbers:**
   - Go to "Staff Management" tab
   - **Expected:** Phone number displays under staff name
   - **Console logs:** Should show user with `phoneNumber: "0730238921"`

---

## Files Modified

### Backend:
1. ✅ `backend/src/modules/tables/tables.controller.ts`
   - Updated DTO to accept `companyId` and `status`

2. ✅ `backend/src/modules/auth/auth.service.ts`
   - Updated `sanitizeUser()` to map `phone` → `phoneNumber`

3. ✅ `backend/src/modules/users/users.service.ts`
   - Added `transformUser()` helper method
   - Updated all user-returning methods to transform responses

### Frontend:
No frontend changes needed - the existing code was correct!

---

## Architecture Notes

### Database → API → Frontend Field Mapping

**User Phone Field:**
- **Database (Prisma):** `phone: String?`
- **API Response:** `phoneNumber: string | undefined`
- **Frontend Interface:** `phoneNumber?: string`

**Reasoning:**
- Prisma schema uses `phone` (shorter, database convention)
- Frontend uses `phoneNumber` (clearer, JavaScript convention)
- API layer transforms between the two

This is a standard practice in multi-layer applications where database naming conventions differ from API/frontend conventions.

---

## Prevention for Future

### When Adding New Fields:

1. **Check three layers:**
   - Database schema (Prisma)
   - API DTOs (Controllers)
   - Frontend interfaces

2. **Add logging:**
   - Log data creation
   - Log API responses
   - Log filtered results

3. **Verify DTOs:**
   - Ensure controller DTOs match service expectations
   - Use proper TypeScript types
   - Consider using `class-validator` for automatic validation

### When Creating New Entities:

1. **Always include `companyId`** in multi-tenant systems
2. **Log the created entity** to verify all fields
3. **Test filtering** by `companyId` immediately
4. **Check console** for warnings about undefined fields

