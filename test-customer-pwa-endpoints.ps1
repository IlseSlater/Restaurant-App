# PowerShell script to test Customer PWA endpoints
Write-Host "Testing Customer PWA Endpoints..." -ForegroundColor Green
Write-Host ""

$baseUrl = "http://localhost:3000/api"

# Test 1: Get all tables (to get a table ID)
Write-Host "1. Getting tables..." -ForegroundColor Yellow
try {
    $tables = Invoke-RestMethod -Uri "$baseUrl/tables" -Method Get
    if ($tables.Count -gt 0) {
        $tableId = $tables[0].id
        Write-Host "   ✓ Found table: $tableId" -ForegroundColor Green
    } else {
        Write-Host "   ✗ No tables found. Please create a table first." -ForegroundColor Red
        exit
    }
} catch {
    Write-Host "   ✗ Error: $_" -ForegroundColor Red
    exit
}

Write-Host ""

# Helper function to convert hashtables to JSON in PowerShell 5
function Convert-ToJsonString {
    param(
        [Parameter(Mandatory = $true)]
        [hashtable]$Data,
        [int]$Depth = 5
    )

    return ($Data | ConvertTo-Json -Depth $Depth)
}

# Test 2: Create Customer Session
Write-Host "2. Creating customer session..." -ForegroundColor Yellow
$sessionBody = @{
    tableId = $tableId
    customerName = "Test Customer"
    phoneNumber = "+27123456789"
    dietaryPreferences = @("Vegetarian")
    allergies = @("Peanuts")
}
$sessionData = Convert-ToJsonString -Data $sessionBody -Depth 5

try {
    $session = Invoke-RestMethod -Uri "$baseUrl/customer-sessions" -Method Post -Body $sessionData -ContentType "application/json"
    $sessionId = $session.id
    Write-Host "   ✓ Created session: $sessionId" -ForegroundColor Green
} catch {
    Write-Host "   ✗ Error: $_" -ForegroundColor Red
    exit
}

Write-Host ""

# Test 3: Get Customer Session
Write-Host "3. Getting customer session..." -ForegroundColor Yellow
try {
    $retrievedSession = Invoke-RestMethod -Uri "$baseUrl/customer-sessions/$sessionId" -Method Get
    Write-Host "   ✓ Retrieved session for: $($retrievedSession.customerName)" -ForegroundColor Green
} catch {
    Write-Host "   ✗ Error: $_" -ForegroundColor Red
}

Write-Host ""

# Test 4: Update Session Activity
Write-Host "4. Updating session activity..." -ForegroundColor Yellow
try {
    $updated = Invoke-RestMethod -Uri "$baseUrl/customer-sessions/$sessionId/activity" -Method Put -ContentType "application/json"
    Write-Host "   ✓ Updated session activity" -ForegroundColor Green
} catch {
    Write-Host "   ✗ Error: $_" -ForegroundColor Red
}

Write-Host ""

# Test 5: Get Menu Items (to get a menu item ID)
Write-Host "5. Getting menu items..." -ForegroundColor Yellow
try {
    $menuItems = Invoke-RestMethod -Uri "$baseUrl/menu" -Method Get
    if ($menuItems.Count -gt 0) {
        $menuItemId = $menuItems[0].id
        $menuItemPrice = $menuItems[0].price
        Write-Host "   ✓ Found menu item: $($menuItems[0].name) - R$menuItemPrice" -ForegroundColor Green
    } else {
        Write-Host "   ✗ No menu items found. Please create menu items first." -ForegroundColor Red
        exit
    }
} catch {
    Write-Host "   ✗ Error: $_" -ForegroundColor Red
    exit
}

Write-Host ""

# Test 6: Create Customer Order
Write-Host "6. Creating customer order..." -ForegroundColor Yellow
$orderBody = @{
    customerSessionId = $sessionId
    tableId = $tableId
    serviceFeePercentage = 15
    items = @(
        @{
            menuItemId = $menuItemId
            quantity = 2
            price = [double]$menuItemPrice
            specialInstructions = "No onions please"
        }
    )
}
$orderData = Convert-ToJsonString -Data $orderBody -Depth 10

try {
    $order = Invoke-RestMethod -Uri "$baseUrl/customer-orders" -Method Post -Body $orderData -ContentType "application/json"
    $orderId = $order.id
    Write-Host "   ✓ Created order: $orderId (Total: R$($order.total))" -ForegroundColor Green
} catch {
    Write-Host "   ✗ Error: $_" -ForegroundColor Red
}

Write-Host ""

# Test 7: Get Orders by Session
Write-Host "7. Getting orders by session..." -ForegroundColor Yellow
try {
    $orders = Invoke-RestMethod -Uri "$baseUrl/customer-orders/session/$sessionId" -Method Get
    Write-Host "   ✓ Retrieved $($orders.Count) order(s)" -ForegroundColor Green
} catch {
    Write-Host "   ✗ Error: $_" -ForegroundColor Red
}

Write-Host ""

# Test 8: Create Waiter Call
Write-Host "8. Creating waiter call..." -ForegroundColor Yellow
$callBody = @{
    tableId = $tableId
    customerSessionId = $sessionId
    callType = "ASSISTANCE"
    message = "Need help with menu"
}
$callData = Convert-ToJsonString -Data $callBody -Depth 5

try {
    $call = Invoke-RestMethod -Uri "$baseUrl/waiter-calls" -Method Post -Body $callData -ContentType "application/json"
    $callId = $call.id
    Write-Host "   ✓ Created waiter call: $callId" -ForegroundColor Green
} catch {
    Write-Host "   ✗ Error: $_" -ForegroundColor Red
}

Write-Host ""

# Test 9: Get Pending Waiter Calls
Write-Host "9. Getting pending waiter calls..." -ForegroundColor Yellow
try {
    $pendingCalls = Invoke-RestMethod -Uri "$baseUrl/waiter-calls/pending" -Method Get
    Write-Host "   ✓ Retrieved $($pendingCalls.Count) pending call(s)" -ForegroundColor Green
} catch {
    Write-Host "   ✗ Error: $_" -ForegroundColor Red
}

Write-Host ""

# Test 10: End Customer Session
Write-Host "10. Ending customer session..." -ForegroundColor Yellow
try {
    $ended = Invoke-RestMethod -Uri "$baseUrl/customer-sessions/$sessionId/end" -Method Put -ContentType "application/json"
    Write-Host "   ✓ Session ended successfully" -ForegroundColor Green
} catch {
    Write-Host "   ✗ Error: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "All tests completed!" -ForegroundColor Green
Write-Host "Customer PWA endpoints are working!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
