# Phone Number and Table Display Fixes

## Issues Identified

### 1. **Phone Numbers Not Displaying on Staff Cards**

**Root Cause**: Field name inconsistency between creation and display
- **Wizard Form**: Used `phone` field
- **Backend**: Expected `phone` but received `phoneNumber` from wizard
- **Frontend Display**: Expected `phoneNumber` field
- **Result**: Phone numbers were saved as `phone` but displayed as `phoneNumber`, causing display to show "No phone number"

**Fix Applied**:
1. Updated wizard `staffForm` to use `phoneNumber` instead of `phone`
2. Updated wizard template to use `formControlName="phoneNumber"`
3. Updated wizard staff list display to show `staff.phoneNumber`
4. Updated backend `auth.service.ts` to accept `phoneNumber` and map it to `phone` field in database
5. Frontend `User` interface already has `phoneNumber?: string`, so display is correct

### 2. **Tables Not Displaying After Creation**

**Root Cause**: Potentially data not being persisted or filtered incorrectly

**Diagnostic Steps Added**:
1. Added comprehensive logging in wizard `createCompanyWithSetup()`:
   - Logs company creation
   - Logs each table being created with full data
   - Logs success/failure for each step

2. Added logging in admin component table filter:
   - Logs current company ID
   - Logs all tables from service
   - Logs filtered tables for current company

**What to Check**:
- Browser console for table creation logs (should see "✅ Table created:" for each table)
- Admin dashboard console for filtering logs (should see tables being filtered by companyId)
- Verify that `companyId` is being set correctly on tables
- Check if backend is returning tables with `companyId` field

## Files Modified

### Frontend
1. `frontend/src/app/admin/company-wizard.component.ts`
   - Line 452: Changed `phone` to `phoneNumber` in staffForm
   - Line 142: Changed `formControlName="phone"` to `formControlName="phoneNumber"`
   - Line 173: Changed `staff.phone` to `staff.phoneNumber`
   - Lines 512-561: Added comprehensive logging to `createCompanyWithSetup()`

2. `frontend/src/app/admin.component.ts`
   - Lines 140-155: Added logging to tables$ observable
   - Lines 157-172: Added logging to staffMembers$ observable

### Backend
3. `backend/src/modules/auth/auth.service.ts`
   - Line 110: Changed parameter from `phone?: string` to `phoneNumber?: string`
   - Line 127: Map `phoneNumber` to `phone` field: `phone: createDto.phoneNumber`

## Testing Instructions

### Test Phone Number Display:
1. Open browser console (F12)
2. Go to `/admin/company/new` 
3. Create a new company with at least one staff member
4. **Include a phone number** for the staff member (e.g., "+27 123 456 7890")
5. Watch console for logs: "✅ Staff member created:"
6. After creation, click "Open Admin Dashboard"
7. Go to "Staff Management" tab
8. **Expected**: Phone number should display under staff name
9. Check console logs: "👥 Filtered staff for company..." should show staff with phone field

### Test Table Display:
1. Same wizard process as above
2. Generate 10 tables in Step 2
3. Watch console for logs: "✅ Table created:" (should appear 10 times)
4. After creation, go to admin dashboard
5. Go to "Table Management" tab
6. Check console for: "🪑 Filtered tables for company..." 
7. **Expected**: Should see 10 tables displayed
8. If no tables, check:
   - Do logs show tables being created?
   - Do logs show tables in "All tables from service"?
   - Does companyId match between creation and filtering?

## Known Limitations

**Backend Mock Data**: The current backend uses in-memory mock data (PrismaService mock), which means:
- Data persists during the session
- Data is lost if backend restarts
- For production, need to use actual Prisma with PostgreSQL

## Next Steps

If tables still don't display:
1. Check if backend is restarting between creation and viewing
2. Verify `ApiService.createTable()` is called with correct `companyId`
3. Verify `TableService.getTables()` returns data with `companyId` field
4. Check if there's a caching issue in the services
5. Consider using `BehaviorSubject` in services to maintain state

