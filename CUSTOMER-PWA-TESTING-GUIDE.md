# Customer PWA Testing Guide

## Testing in Browser (Without QR Scanner)

Since you're testing in a browser without a camera, here's how to test the customer PWA flow:

---

## Method 1: Restaurant Discovery → Table Selection

This is the **recommended** way to test in a browser.

### Steps:

1. **Navigate to Restaurant List**
   ```
   http://localhost:4200/customer/restaurants
   ```

2. **Select a Restaurant**
   - Click on any restaurant card (e.g., "Bella Vista Italian")
   - You'll be redirected to:
   ```
   http://localhost:4200/customer/scan-table?company=11111111-1111-1111-1111-111111111111&restaurant=bella-vista
   ```

3. **Switch to Manual Entry**
   - Click the "Enter Table Number Manually" button
   - The page will show a table number input field

4. **Enter Table Number**
   - Type a table number (e.g., `1`)
   - You'll see available tables as quick-select buttons
   - Click "Continue" or press Enter

5. **Register/Login**
   - Enter your name, email, and phone
   - Click "Start Ordering"

6. **View Menu**
   - You'll see ONLY the menu items for the selected restaurant
   - Test by selecting a different restaurant and comparing menus

---

## Method 2: Direct URL with Query Parameters

You can also directly navigate with query parameters to simulate a QR code scan:

### Format:
```
http://localhost:4200/customer/scan-table?company={COMPANY_GUID}&restaurant={SLUG}&table={TABLE_NUMBER}
```

### Example URLs:

**Bella Vista Italian (Table 1):**
```
http://localhost:4200/customer/scan-table?company=11111111-1111-1111-1111-111111111111&restaurant=bella-vista&table=1
```

**Sushi Zen (Table 2):**
```
http://localhost:4200/customer/scan-table?company=22222222-2222-2222-2222-222222222222&restaurant=sushi-zen&table=2
```

**Burger Palace (Table 1):**
```
http://localhost:4200/customer/scan-table?company=33333333-3333-3333-3333-333333333333&restaurant=burger-palace&table=1
```

**Café Mocha (Table 3):**
```
http://localhost:4200/customer/scan-table?company=44444444-4444-4444-4444-444444444444&restaurant=cafe-mocha&table=3
```

---

## Method 3: Manual Entry Without Company Context

If you want to test the legacy flow (not recommended):

1. Navigate to:
   ```
   http://localhost:4200/customer/scan-table?manual=true
   ```

2. Enter a table number manually

**Note:** This won't have company filtering and may show incorrect data.

---

## What to Test

### ✅ Company Isolation
1. **Menu Items**
   - Navigate to Bella Vista → Menu
   - Note the menu items
   - Go back and select Sushi Zen → Menu
   - **Verify**: Different menu items appear

2. **Table Numbers**
   - Each restaurant should show only its own tables
   - Table 1 in Bella Vista ≠ Table 1 in Sushi Zen

3. **Orders**
   - Place an order at Bella Vista
   - Switch to Sushi Zen
   - **Verify**: Bella Vista order not visible in Sushi Zen

### ✅ Session Persistence
1. Order at Bella Vista
2. Close browser tab
3. Reopen and navigate to Bella Vista menu
4. **Verify**: Your cart/session is preserved

### ✅ Multi-Restaurant Sessions
1. Order at Bella Vista (don't checkout)
2. Open new tab → Order at Sushi Zen
3. Switch between tabs
4. **Verify**: Each restaurant maintains separate cart/session

### ✅ URL Structure
- Entry point: `/customer/scan-table?company=xxx&restaurant=yyy`
- Menu: `/customer/menu` (clean URL, company in session)
- Cart: `/customer/cart` (clean URL)
- Orders: `/customer/orders` (clean URL)

---

## Company GUIDs Reference

```typescript
{
  "Default Restaurant": "00000000-0000-0000-0000-000000000000",
  "Bella Vista Italian": "11111111-1111-1111-1111-111111111111",
  "Sushi Zen": "22222222-2222-2222-2222-222222222222",
  "Burger Palace": "33333333-3333-3333-3333-333333333333",
  "Café Mocha": "44444444-4444-4444-4444-444444444444"
}
```

---

## Quick Test Checklist

- [ ] Restaurant discovery page loads and shows all restaurants
- [ ] Selecting a restaurant navigates with query parameters
- [ ] Manual entry mode shows table number input
- [ ] Quick-select buttons show available tables for that restaurant
- [ ] Entering a valid table number proceeds to registration
- [ ] Entering an invalid table number shows error
- [ ] Registration creates session with correct companyId
- [ ] Menu shows only items for selected restaurant
- [ ] Cart is isolated per restaurant
- [ ] Orders are filtered by restaurant
- [ ] Switching restaurants shows different data
- [ ] Session persists after browser refresh

---

## Troubleshooting

### "Table not found" error
- Make sure the restaurant has tables created in the admin panel
- Check that you're entering a valid table number (usually 1-10)

### Menu shows items from all restaurants
- **Bug**: This indicates `companyId` filtering is not working
- Check browser console for errors
- Verify session includes `companyId`

### Unable to switch between restaurants
- Clear localStorage: `localStorage.clear()`
- Refresh page
- Start from restaurant discovery page

### Backend shows "Returning X menu items (all companies)"
- **Issue**: API call missing `companyId` parameter
- Check network tab → GET `/api/menu` should have `?companyId=xxx`

---

## Success Indicators

### In Browser Console:
```
🏢 Company context from URL: 11111111-1111-1111-1111-111111111111 (bella-vista)
✅ Stored companyId for session: 11111111-1111-1111-1111-111111111111
```

### In Backend Logs:
```
Menu findMany called with: {
  "where": {
    "companyId": "11111111-1111-1111-1111-111111111111"
  }
}
Returning 5 menu items for company 11111111-1111-1111-1111-111111111111
```

### In Network Tab:
```
GET /api/menu?companyId=11111111-1111-1111-1111-111111111111
Status: 200 OK
Response: [5 menu items for Bella Vista only]
```

---

## Testing Complete Flow

**Scenario: Customer visits Bella Vista, orders food, then visits Sushi Zen**

1. Navigate to `/customer/restaurants`
2. Click "Bella Vista Italian"
3. Enter table number: `1`
4. Register: John Doe, john@test.com, 555-0100
5. Browse menu → Add "Margherita Pizza" to cart
6. View cart → Note subtotal
7. Open new tab → Navigate to `/customer/restaurants`
8. Click "Sushi Zen"
9. Enter table number: `1`
10. Register: John Doe (same customer)
11. Browse menu → **Verify different items** (sushi, not pizza)
12. Add "California Roll" to cart
13. Switch back to Bella Vista tab
14. **Verify**: Cart still has pizza, not sushi
15. Switch to Sushi Zen tab
16. **Verify**: Cart has sushi, not pizza

**Success**: Each restaurant maintains separate cart/session with correct menu items.

---

## Need Real QR Code Testing?

To test actual QR code scanning:
1. Deploy frontend to a mobile-accessible URL (e.g., ngrok)
2. Generate QR codes in admin panel
3. Print or display QR codes on screen
4. Scan with mobile device camera or QR reader app
5. Verify it navigates to correct URL with company parameters

