# Troubleshooting: Company Creation Issues

## Issues Reported
1. **Tables not displaying** on admin dashboard after creating company via wizard
2. **Phone numbers not showing** on staff cards

## Root Causes & Fixes

### Issue 1: Tables Not Displaying

**Root Cause:**
Tables were being created without `companyId` association.

**What Was Fixed:**
- ✅ Backend: `tables.service.ts` - Added `companyId` to createTable DTO
- ✅ Frontend: `company-wizard.component.ts` - Passes `companyId` in table data

**Verification Steps:**
1. Open browser Developer Tools (F12)
2. Go to Network tab
3. Create a new company
4. Look for POST requests to `/api/tables`
5. Check the request payload - should include `companyId`

**Example Request Payload:**
```json
{
  "number": 1,
  "status": "AVAILABLE",
  "companyId": "company-1760083304907"
}
```

### Issue 2: Phone Numbers Not Showing

**Root Cause:**
The `createStaffMember` method in `auth.service.ts` wasn't accepting or saving the `phone` field.

**What Was Fixed:**
- ✅ Backend: `auth.service.ts` - Added `phone?: string` to DTO
- ✅ Backend: Added `phone: createDto.phone` to data being saved
- ✅ Backend rebuilt successfully
- ⏳ Backend server needs to be restarted (currently restarting)

**Verification Steps:**
1. Check backend console for startup messages
2. Create a new company via wizard
3. Add staff with phone numbers
4. Check staff cards on admin dashboard
5. Phone numbers should now display

## Current Status

### ✅ Completed
- [x] Backend code fixed for tables (companyId)
- [x] Backend code fixed for phone numbers
- [x] Backend rebuilt successfully
- [x] Frontend wizard captures phone numbers correctly

### ⏳ In Progress
- [ ] Backend server restarting with new build

### 📋 Testing Checklist

After backend restart completes:

**Test 1: Create New Company**
1. Delete existing "Padstal Centurion" (if needed)
2. Go to System Admin (`/admin/system`)
3. Click "Setup Wizard"
4. Fill in company details
5. Generate 10 tables
6. Add 3 staff members WITH phone numbers:
   - Example: "John Doe", "0731234567", "WAITER", PIN "1234"
   - Example: "Jane Smith", "0737654321", "KITCHEN_STAFF", PIN "5678"
   - Example: "Bob Manager", "0739876543", "MANAGER", PIN "9999"
7. Complete wizard
8. Click "Open Admin Dashboard"

**Expected Results:**
- ✅ Company dashboard loads successfully
- ✅ Tables appear in Table Management tab (10 tables)
- ✅ Staff appear in Staff Management tab (3 staff)
- ✅ Phone numbers visible on staff cards (not "No phone number")

**Test 2: Verify Database**
If issues persist, check database directly:

Using browser console:
```javascript
// Check if tables have companyId
fetch('http://localhost:3000/api/tables')
  .then(r => r.json())
  .then(tables => console.table(tables))

// Check if staff have phone numbers
fetch('http://localhost:3000/api/users')
  .then(r => r.json())
  .then(users => console.table(users))
```

## Common Issues & Solutions

### Issue: "Backend not reflecting changes"

**Solution:**
1. Stop backend server
2. Rebuild: `cd backend && npm run build`
3. Restart: `npm run start:dev`
4. Wait for "Server running on http://localhost:3000" message

### Issue: "Tables showing but wrong company"

**Check:**
- Browser console for errors
- Network tab for API responses
- Ensure URL has correct companyGuid: `/admin/{companyGuid}`

### Issue: "Phone numbers still not showing"

**Possible causes:**
1. Backend not restarted after code change
2. Old staff data (created before fix)
3. Frontend cache issue

**Solutions:**
1. Restart backend server
2. Delete and recreate company
3. Hard refresh browser (Ctrl+Shift+R)
4. Check browser console for errors

### Issue: "Company created but nothing works"

**Check:**
1. Backend console for errors during company creation
2. Browser console for API errors
3. Network tab for failed requests

**Common error patterns:**
- 400 Bad Request: Missing required fields
- 404 Not Found: Company ID mismatch
- 500 Internal Server Error: Backend database issue

## Manual Database Verification

If you need to check the database directly:

```bash
cd backend
npx prisma studio
```

This opens a GUI where you can:
1. View all companies
2. Check if tables have `companyId` set
3. Verify staff have `phone` field populated
4. See actual data being stored

## Quick Fix: Start Fresh

If nothing works, the fastest solution:

1. **Delete problematic company:**
   - Go to `/admin/system`
   - Click delete icon on company
   - Type company name to confirm

2. **Verify backend is running with latest code:**
   ```bash
   # Stop all node processes
   # In PowerShell:
   Get-Process -Name "node" | Stop-Process -Force
   
   # Rebuild and start
   cd backend
   npm run build
   npm run start:dev
   ```

3. **Create new company:**
   - Use Setup Wizard
   - Fill in ALL fields (including phone numbers)
   - Complete wizard
   - Check admin dashboard

## Expected Console Output

### Backend (on company creation):
```
Created new company: { id: 'company-...', name: '...', ... }
Created new table: { id: 'table-...', number: 1, companyId: 'company-...', ... }
Created new table: { id: 'table-...', number: 2, companyId: 'company-...', ... }
...
Created new user: { id: 'user-...', name: '...', phone: '0731234567', companyId: 'company-...', ... }
```

### Frontend (browser console):
```
Company created: { id: '...', name: '...', isActive: true }
Table created successfully
Staff member added!
Setup complete!
```

## Still Having Issues?

If problems persist after:
- ✅ Backend restarted
- ✅ Frontend hard refreshed
- ✅ New company created
- ✅ All fields filled in

Then check:
1. Are there any TypeScript compilation errors?
2. Are there any console errors (backend or frontend)?
3. Are API requests reaching the backend? (Network tab)
4. Is the data actually being saved? (Prisma Studio)

## Summary

The fixes have been applied to:
- ✅ Tables: Now include `companyId` when created
- ✅ Staff: Now include `phone` when created
- ⏳ Backend: Restarting to apply changes

**Next steps:**
1. Wait for backend to fully restart (check for "Server running" message)
2. Refresh browser page
3. Delete old "Padstal Centurion" company
4. Create new company via wizard
5. Verify tables and phone numbers display correctly

All issues should be resolved after backend restart completes! 🎉

