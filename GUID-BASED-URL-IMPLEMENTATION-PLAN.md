# GUID-Based URL Implementation Plan

## 🎯 **THE CORRECT APPROACH**

Staff and interfaces should **NOT select companies** - the **URL determines the company context**.

### **Current Problem:**
- Admin manually selects companies ❌
- No GUID in URLs ❌
- Staff could theoretically switch companies ❌
- Each interface loads without company context ❌

### **Required Solution:**
- **Kitchen:** `https://restaurant-app.com/kitchen/{companyGuid}`
- **Bar:** `https://restaurant-app.com/bar/{companyGuid}`
- **Waiter:** `https://restaurant-app.com/waiter/{companyGuid}`
- **Admin:** `https://restaurant-app.com/admin/{companyGuid}`
- **Customer:** QR code includes company GUID

---

## 📋 **WHAT WE'VE MISSED**

### 1. **Company Creation Workflow**
- ✅ Company selection page exists
- ❌ No proper company creation form
- ❌ Company creation doesn't generate GUID
- ❌ No QR code generation on creation
- ❌ No staff account setup wizard
- ❌ No initial table setup
- ❌ No initial menu setup

### 2. **GUID-Based URL Routing**
- ❌ Kitchen doesn't use company GUID in URL
- ❌ Bar doesn't use company GUID in URL
- ❌ Waiter doesn't use company GUID in URL
- ❌ Admin doesn't use company GUID in URL
- ❌ Customer scans QR but doesn't load company from GUID properly

### 3. **Company Context Loading**
- ❌ Kitchen doesn't load company from URL
- ❌ Bar doesn't load company from URL
- ❌ Waiter doesn't load company from URL
- ❌ Admin still has company selection (should use URL)
- ✅ Customer PWA loads company from QR code

### 4. **Route Guards**
- ❌ No guard to validate company GUID exists
- ❌ No guard to check company is active
- ❌ No guard to validate staff access to company

### 5. **Company Setup Wizard**
When a new company is created, admin needs:
- ❌ Step 1: Company profile (name, logo, branding)
- ❌ Step 2: Create admin account
- ❌ Step 3: Add tables (with QR code generation)
- ❌ Step 4: Add initial menu items
- ❌ Step 5: Add staff members
- ❌ Step 6: Get company URLs for each interface

### 6. **QR Code System**
- ❌ QR codes should encode: `{companyGuid}/table/{tableNumber}`
- ❌ Scanning should load company context first
- ❌ QR code generation needs company branding
- ❌ Downloadable/printable QR codes per table

### 7. **Staff Onboarding**
- ❌ Kitchen staff gets: `https://app.com/kitchen/{companyGuid}`
- ❌ Bar staff gets: `https://app.com/bar/{companyGuid}`
- ❌ Waiters get: `https://app.com/waiter/{companyGuid}`
- ❌ Admin gets: `https://app.com/admin/{companyGuid}`
- ❌ Staff bookmarks their specific URL

### 8. **System Admin Panel**
- ❌ Super admin to manage all companies
- ❌ Can create new companies
- ❌ Can view all companies
- ❌ Can generate URLs for companies
- ❌ Can deactivate/reactivate companies

---

## 🚀 **IMPLEMENTATION TASKS**

### **Phase 1: Update Routing Structure**
1. Change all routes to include `/:companyGuid` parameter
2. Update Kitchen route: `/kitchen/:companyGuid`
3. Update Bar route: `/bar/:companyGuid`
4. Update Waiter route: `/waiter/:companyGuid`
5. Update Admin route: `/admin/:companyGuid`
6. Keep Customer route: `/customer` (gets GUID from QR)

### **Phase 2: Create Company Guard**
1. Create `CompanyGuard` that:
   - Extracts `companyGuid` from URL
   - Validates company exists
   - Checks company is active
   - Loads company into context
   - Applies branding
   - Redirects if invalid

### **Phase 3: Update All Components**
1. **Kitchen Component**:
   - Extract `companyGuid` from route params
   - Load company context on init
   - Remove manual company selection

2. **Bar Component**:
   - Extract `companyGuid` from route params
   - Load company context on init
   - Remove manual company selection

3. **Waiter Component**:
   - Extract `companyGuid` from route params
   - Load company context on init
   - Remove manual company selection

4. **Admin Component**:
   - Extract `companyGuid` from route params
   - Load company context on init
   - Remove company selection page for staff
   - Keep system admin separate

### **Phase 4: Create Company Setup Wizard**
1. Multi-step form for new companies:
   - Company details
   - Branding
   - Admin account creation
   - Table setup
   - Menu setup
   - Staff setup
   - URL generation and display

### **Phase 5: Update QR Code System**
1. QR codes encode: `https://app.com/customer?company={companyGuid}&table={tableNumber}`
2. Customer PWA extracts both parameters
3. Loads company context first
4. Then validates table
5. Generates branded QR codes

### **Phase 6: Create System Admin Interface**
1. Super admin login
2. View all companies
3. Create new companies
4. Generate company URLs
5. Manage company status
6. View analytics across companies

---

## 🔄 **USER FLOWS**

### **Super Admin Creates Company**
1. Super admin logs into system admin panel
2. Clicks "Create New Company"
3. Fills out company wizard:
   - Company name, logo, branding
   - Creates admin account for company
   - Sets up tables (generates QR codes)
   - Adds initial menu items
   - Adds staff members
4. System generates and displays URLs:
   - Kitchen: `https://app.com/kitchen/abc123`
   - Bar: `https://app.com/bar/abc123`
   - Waiter: `https://app.com/waiter/abc123`
   - Admin: `https://app.com/admin/abc123`
5. Downloads QR codes for all tables
6. Provides URLs to staff members

### **Kitchen Staff Starts Work**
1. Kitchen staff receives URL: `https://app.com/kitchen/abc123`
2. Bookmarks URL in browser
3. Opens URL
4. System:
   - Extracts `abc123` from URL
   - Loads "Bella Vista Italian" company
   - Applies branding (red/yellow colors)
   - Shows only Bella Vista's orders
5. Staff sees only their restaurant's data

### **Customer Scans QR Code**
1. Customer scans table QR code
2. QR contains: `https://app.com/customer?company=abc123&table=5`
3. System:
   - Extracts company GUID `abc123`
   - Loads "Bella Vista Italian"
   - Applies branding
   - Validates table 5
   - Loads menu for Bella Vista
4. Customer sees branded menu

---

## 📝 **DATABASE REQUIREMENTS**

### Already Have:
- ✅ `companies` table with GUID
- ✅ All tables have `companyId`
- ✅ Company branding fields

### Still Need:
- ❌ System admin users table (separate from company users)
- ❌ Company setup completion status
- ❌ Company subscription/billing info (future)

---

## 🎨 **UI/UX REQUIREMENTS**

### System Admin Panel:
- Dashboard showing all companies
- Company creation wizard
- URL generator and display
- Company management

### Staff Interfaces:
- **Remove** company selection dropdowns
- Load company from URL automatically
- Show company branding in header
- Display "You are managing: {Company Name}"

### Customer PWA:
- Extract company from QR code
- Load company branding immediately
- Show company logo and colors

---

## 🔒 **SECURITY CONSIDERATIONS**

1. **Company Isolation**:
   - Staff can only access their company's URL
   - No cross-company data leaks
   - URL determines access scope

2. **GUID Security**:
   - GUIDs are not secrets (public in URLs)
   - Company data protected by auth
   - Staff must authenticate within company context

3. **Access Control**:
   - Staff accounts linked to specific company
   - Can't switch companies via URL
   - Must be authorized for that company

---

## 📊 **IMPLEMENTATION PRIORITY**

### **HIGH PRIORITY** (Must Have):
1. ✅ GUID-based URL routing for all interfaces
2. ✅ Company guard to validate and load context
3. ✅ Update all components to use URL-based company
4. ✅ Remove manual company selection from staff interfaces
5. ✅ Update QR codes to include company GUID

### **MEDIUM PRIORITY** (Should Have):
6. Company setup wizard
7. System admin panel
8. Staff onboarding workflow
9. Company URL generation and display

### **LOW PRIORITY** (Nice to Have):
10. Company analytics dashboard
11. Multi-tenant billing
12. Company templates
13. White-label options

---

## ✅ **TESTING CHECKLIST**

- [ ] Kitchen staff can only see their company's orders via URL
- [ ] Bar staff can only see their company's drink orders via URL
- [ ] Waiter can only see their company's tables via URL
- [ ] Admin can only manage their company via URL
- [ ] Customer scanning QR loads correct company
- [ ] Invalid company GUID shows error page
- [ ] Inactive company redirects with message
- [ ] Staff can't access other companies by changing URL
- [ ] Company branding applies correctly
- [ ] QR codes encode correct company GUID

---

## 🎯 **SUCCESS METRICS**

1. **Zero Manual Company Selection**: Staff never select companies
2. **URL-Based Access**: All interfaces use company GUID in URL
3. **Complete Isolation**: No data leaks between companies
4. **Easy Onboarding**: New company setup takes < 10 minutes
5. **Staff Clarity**: Staff always know which restaurant they're managing

