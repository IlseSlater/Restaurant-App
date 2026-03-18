# Fix for Padstal Centurion Company

## Issue
Tables and staff were created for Padstal Centurion but they're not displaying on the admin dashboard.

## Root Cause
The tables and staff were created but some may be missing the `companyId` field association, or the company is inactive.

## Quick Fix Option 1: Delete and Recreate (RECOMMENDED)

Since we've now fixed both issues in the code:
1. Companies are created with `isActive: true` by default
2. Tables include `companyId` when created

**Steps:**
1. Go to System Admin (`http://localhost:4200/admin/system`)
2. Find "Padstal Centurion" 
3. Delete it (if there's a delete option)
4. Click "Setup Wizard"
5. Create it again fresh
6. Everything will work properly!

## Option 2: Manual Database Fix (If you want to keep existing data)

If you want to fix the existing Padstal Centurion data, you can manually update the database.

### Using Prisma Studio:

1. Open Prisma Studio:
```bash
cd backend
npx prisma studio
```

2. **Fix Company Active Status:**
   - Open the `Company` table
   - Find "Padstal Centurion" (id: `company-1760083304907`)
   - Set `isActive` to `true`
   - Click Save

3. **Fix Tables (if needed):**
   - Open the `Table` table
   - Find all tables with numbers 1-14 that don't have a `companyId`
   - Set their `companyId` to: `company-1760083304907`
   - Click Save for each

4. **Fix Staff (if needed):**
   - Open the `User` table  
   - Find users with email "islater88@gmail.com"
   - Verify they have `companyId`: `company-1760083304907`
   - If not, update them
   - Click Save

5. **Refresh browser** and the data should appear

### Using Database Query (Advanced):

If you have direct database access, you can run:

```sql
-- Fix company active status
UPDATE "Company" 
SET "isActive" = true 
WHERE id = 'company-1760083304907';

-- Fix tables without companyId
UPDATE "Table" 
SET "companyId" = 'company-1760083304907' 
WHERE "number" BETWEEN 1 AND 14 
  AND "companyId" IS NULL;

-- Verify staff have correct companyId
UPDATE "User" 
SET "companyId" = 'company-1760083304907' 
WHERE email = 'islater88@gmail.com';
```

## Verification

After applying either fix:

1. Navigate to: `http://localhost:4200/admin/company-1760083304907`
2. Check the Table Management tab - should show 14 tables
3. Check the Staff Management tab - should show 5 staff members
4. All data should be visible and functional

## Why This Happened

- **Before fix:** `companies.service.ts` didn't set `isActive: true` when creating companies
- **Before fix:** `tables.service.ts` didn't accept `companyId` parameter  
- **After fix:** Both issues are now resolved in the code
- **Result:** New companies created after the fix will work perfectly!

## Testing the Fix

Create a new test company:
1. Go to System Admin
2. Click "Setup Wizard"
3. Enter name: "Test Restaurant"
4. Add 5 tables
5. Add 2 staff members
6. Complete wizard
7. Click "Open Admin Dashboard"
8. ✅ Tables should display
9. ✅ Staff should display
10. ✅ Company should be active

