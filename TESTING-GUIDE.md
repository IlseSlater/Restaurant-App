# Restaurant App - Testing Guide

## Setup

### 1. Start Backend Server
```bash
cd backend
npm run start:dev
```
Backend will run on `http://localhost:3000`

### 2. Start Frontend Server
```bash
cd frontend
npm start
```
Frontend will run on `http://localhost:4200`

### 3. Run Database Migration
```bash
cd backend
npx prisma migrate dev --name add-auth-and-security
npx prisma generate
```

## Test Scenarios

### Test 1: Company Creation via Setup Wizard

**Steps:**
1. Navigate to `http://localhost:4200/admin/system`
2. Click the "Setup Wizard" button
3. **Step 1 - Company Details:**
   - Enter company name (e.g., "Bella Vista Italian")
   - Slug should auto-generate
   - Enter phone number
   - Enter address
   - Click "Get Current Location" button (allow location access)
   - Verify location coordinates appear
   - Click "Next: Setup Tables"

4. **Step 2 - Tables:**
   - Enter number of tables (e.g., 10)
   - Click "Generate X Tables"
   - Verify table list appears
   - Click "Next: Add Staff"

5. **Step 3 - Staff:**
   - Enter staff member name (e.g., "John Waiter")
   - Enter email (e.g., "john@bellavista.com")
   - Select role (e.g., "Waiter")
   - Enter PIN (e.g., "1234")
   - Click "Add Staff Member"
   - Verify staff member appears in list
   - Optionally add more staff
   - Click "Next: Complete Setup"

6. **Step 4 - Completion:**
   - Verify company name is displayed
   - Verify summary shows correct table and staff count
   - Click "Create Restaurant"
   - Wait for creation process
   - Verify staff URLs are displayed for:
     - Kitchen
     - Bar
     - Waiter
     - Admin
   - Click copy button next to each URL
   - Verify "URL copied to clipboard!" message

**Expected Results:**
- ✅ Company is created with location
- ✅ Tables are created
- ✅ Staff members are created with hashed PINs
- ✅ URLs include company GUID
- ✅ Copy to clipboard works

### Test 2: Staff Authentication with PIN

**Steps:**
1. Copy the Kitchen staff URL from wizard completion (or use format: `http://localhost:4200/kitchen/{companyGuid}`)
2. Navigate to the Kitchen URL
3. Should be redirected to `/staff/login/{companyGuid}`
4. Verify company name is displayed in the login form
5. Enter PIN: "1234" (or the PIN you created)
6. Click "Login"

**Expected Results:**
- ✅ Redirected to login page when accessing protected route without auth
- ✅ Company name is shown on login page
- ✅ PIN login successful
- ✅ JWT token stored in localStorage
- ✅ Redirected to kitchen interface with company context loaded
- ✅ Kitchen interface shows correct company data

**Test Invalid PIN:**
1. Enter wrong PIN: "9999"
2. Click "Login"
3. Should see error message

### Test 3: Staff Authentication with Email/Password

**Steps:**
1. On the staff login page, click "Login with Email/Password"
2. Enter email from staff creation
3. Enter a password (Note: You'll need to update the staff member in the database first)
4. Click "Login"

**To Set Password via API:**
```bash
# Use Prisma Studio or update via API
cd backend
npx prisma studio
# Find user, set password field to bcrypt hash
```

**Expected Results:**
- ✅ Toggle between PIN and Email/Password modes works
- ✅ Email/password login successful
- ✅ User is authenticated and redirected

### Test 4: Customer Session with Location Capture

**Steps:**
1. Navigate to `http://localhost:4200/customer/scan-table?c={companyGuid}&t=1`
2. Click "Enter Table Number Manually"
3. Enter table number: 1
4. Click "Continue"
5. On registration page:
   - Enter customer name
   - Enter phone number
   - Select dietary preferences (optional)
   - Enter allergies (optional)
   - Accept terms
   - Click "Start Ordering"
6. Browser should request location permission
7. **Allow** location access

**Expected Results:**
- ✅ Browser prompts for location permission
- ✅ Location is captured (check browser console for log)
- ✅ Session is created with `scanLocation` and `expectedLocation` fields
- ✅ Customer is redirected to menu page
- ✅ Session is active in database

**Check Database:**
```bash
cd backend
npx prisma studio
# Open CustomerSession table
# Find latest session
# Verify scanLocation and expectedLocation are populated (JSON objects)
```

### Test 5: Session Security - Previous Session Ending

**Prerequisites:** Complete Test 4 first

**Steps:**
1. Note your phone number from Test 4
2. Open a NEW incognito/private browser window
3. Navigate to `http://localhost:4200/customer/scan-table?c={DIFFERENT_companyGuid}&t=2`
   - If you only have one company, create another via wizard first
4. Enter the SAME phone number from Test 4
5. Complete registration with location permission

**Expected Results:**
- ✅ Previous session is ended automatically
- ✅ New session is created for new company
- ✅ Check database: previous session has `isActive=false`, `sessionEnd` populated
- ✅ Console logs show "Previous sessions ended"

**Check Backend Logs:**
Should see API call to `/customer-sessions/end-previous`

### Test 6: Company Authentication Guard

**Steps:**
1. Login as staff member for Company A
2. Try to access Kitchen URL for Company B: `http://localhost:4200/kitchen/{companyBGuid}`

**Expected Results:**
- ✅ Access is denied
- ✅ Redirected to `/admin/system` with error query param
- ✅ Console shows warning about unauthorized access

**Test SYSTEM_ADMIN Override:**
1. Create a SYSTEM_ADMIN user in database
2. Login as SYSTEM_ADMIN
3. Access any company's Kitchen URL

**Expected Results:**
- ✅ SYSTEM_ADMIN can access any company
- ✅ No access denied error

### Test 7: QR Code Data Generation

**Using API directly:**

```bash
# Get QR data for specific table
curl http://localhost:3000/api/tables/qr-data/{companyGuid}/{tableId}

# Get QR data for all tables in company
curl http://localhost:3000/api/tables/qr-data/{companyGuid}
```

**Expected Response:**
```json
{
  "companyId": "...",
  "companyName": "Bella Vista Italian",
  "tableId": "...",
  "tableNumber": 1,
  "expectedLocation": {
    "lat": -26.2041,
    "lng": 28.0473,
    "radius": 100
  },
  "scanUrl": "http://localhost:4200/customer/scan-table?c=...&t=1",
  "timestamp": "2025-10-10T..."
}
```

**Expected Results:**
- ✅ QR data includes company GUID
- ✅ Location data is included (if company has location set)
- ✅ Scan URL is properly formatted
- ✅ All tables return data when requesting company-wide

### Test 8: Session Expiry on Bill Payment

**Steps:**
1. Create a customer session (via Test 4)
2. Create some orders for that session
3. Using Waiter interface or API, mark bill as paid:

```bash
# Via API (if endpoint exists)
curl -X POST http://localhost:3000/api/customer-sessions/{sessionId}/end-with-payment \
  -H "Content-Type: application/json" \
  -d '{"paidBy": "waiter-id"}'
```

**Expected Results:**
- ✅ Session is marked inactive
- ✅ `sessionEnd` timestamp is set
- ✅ `billPaidBy` field contains waiter ID
- ✅ `billPaidAt` timestamp is set
- ✅ `expiryReason` is set to appropriate value
- ✅ Customer can no longer place orders with that session

### Test 9: Location Validation

**Steps:**
1. Create a company with location set via wizard
2. Create a customer session with location (Test 4)
3. Call location validation endpoint:

```bash
curl -X POST http://localhost:3000/api/customer-sessions/{sessionId}/validate-location \
  -H "Content-Type: application/json" \
  -d '{"lat": -26.2041, "lng": 28.0473}'
```

**Test with different location (should fail):**
```bash
curl -X POST http://localhost:3000/api/customer-sessions/{sessionId}/validate-location \
  -H "Content-Type: application/json" \
  -d '{"lat": 40.7128, "lng": -74.0060}'
```

**Expected Results:**
- ✅ Valid location returns `true` or success response
- ✅ Invalid location (far away) returns `false` or error
- ✅ Distance calculation uses Haversine formula correctly

### Test 10: System Admin Dashboard

**Steps:**
1. Navigate to `http://localhost:4200/admin/system`
2. View all companies
3. Check company cards show:
   - Company name and slug
   - Active/Inactive status
   - Revenue stats (if available)
4. Click "Refresh Data" button
5. Click on a company card's "View Dashboard" button

**Expected Results:**
- ✅ All companies are listed
- ✅ Stats are displayed
- ✅ Refresh works
- ✅ Can navigate to individual company dashboard
- ✅ Company dashboard loads with correct company context

### Test 11: HTTP Interceptor - Auto Token Attachment

**Steps:**
1. Login as staff member
2. Open browser DevTools -> Network tab
3. Navigate to Kitchen interface
4. Check API requests

**Expected Results:**
- ✅ All API requests include `Authorization: Bearer {token}` header
- ✅ Token matches the one in localStorage
- ✅ Requests are successful with authentication

**Test Token Expiry:**
1. Manually modify token in localStorage to invalid value
2. Try to access protected route
3. Should be logged out or redirected

## Database Verification Queries

### Check Customer Session with Location
```sql
SELECT 
  id, 
  customerName, 
  phoneNumber, 
  isActive, 
  scanLocation, 
  expectedLocation, 
  sessionStart, 
  sessionEnd,
  expiryReason
FROM CustomerSession
ORDER BY sessionStart DESC
LIMIT 5;
```

### Check Staff with PINs
```sql
SELECT 
  id, 
  name, 
  email, 
  role, 
  companyId,
  isActive,
  lastLogin
FROM User
WHERE pin IS NOT NULL;
```

### Check Companies with Locations
```sql
SELECT 
  id, 
  name, 
  slug, 
  latitude, 
  longitude, 
  locationRadius
FROM Company
WHERE latitude IS NOT NULL;
```

## Troubleshooting

### Issue: Location not captured
- **Cause:** Browser denied location permission
- **Fix:** Grant location permission in browser settings
- **Verify:** Check browser console for geolocation errors

### Issue: PIN login fails
- **Cause:** PIN not properly hashed or doesn't exist
- **Fix:** Use Prisma Studio to check user's `pin` field
- **Note:** PINs are hashed with bcrypt

### Issue: Staff can't access company interface
- **Cause:** User's `companyId` doesn't match URL `companyGuid`
- **Fix:** Verify user belongs to correct company in database

### Issue: Previous session not ending
- **Cause:** API endpoint not called or phone number mismatch
- **Fix:** Check browser console for API errors
- **Verify:** Ensure `/customer-sessions/end-previous` endpoint works

### Issue: JWT token not attached to requests
- **Cause:** HTTP interceptor not registered
- **Fix:** Verify `main.ts` includes `provideHttpClient(withInterceptors([authInterceptor]))`

## Success Criteria

All tests should pass with:
- ✅ No console errors
- ✅ Proper authentication flow
- ✅ Location capture working
- ✅ Session security enforced
- ✅ Company isolation maintained
- ✅ Database records properly populated
- ✅ Staff URLs with correct GUIDs
- ✅ QR code data includes location

## Automated Tests

The frontend uses **Karma + Jasmine** for unit tests. Run (requires Chrome/Chromium; in some environments use `--browsers=ChromeHeadless`):

```bash
cd frontend
npm test
```

### Current unit tests

- **StorageService** (`services/storage.service.spec.ts`): get/set/remove and getObject/setObject with `STORAGE_KEYS`.
- **CustomerAuthGuard** (`customer-pwa/guards/customer-auth.guard.spec.ts`): allows route when session active; redirects to `/customer/welcome` when not.
- **StaffAuthGuard** (`guards/staff-auth.guard.spec.ts`): redirects to staff login when not authenticated; allows staff roles; denies non-staff and shows snackbar.

### Legacy routes and components

See [docs/LEGACY-ROUTES-AND-COMPONENTS.md](docs/LEGACY-ROUTES-AND-COMPONENTS.md) for documented legacy routes (`/customer-old`, `/waiter` without GUID, etc.) and cleanup suggestions.

## Next Steps After Testing

1. Fix any bugs found during testing
2. Add more unit tests for services, interceptors, and key components
3. Add E2E tests (Cypress/Playwright) for critical flows
4. Implement remaining features:
   - Scheduled job for session expiry
   - QR code PDF generation
   - Role-based UI restrictions
5. Deploy to staging environment
6. Performance testing
7. Security audit

