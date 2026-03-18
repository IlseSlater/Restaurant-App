# 🎯 Cursor Implementation Guide - Detailed Todo List

## 📋 **PRIORITY 1: STABILIZATION & TESTING (Days 1-2)**

### **TODO 1: Fix Backend Stability Issues**

#### **Step 1.1: Restart Backend Server**
```bash
# Terminal 1: Stop current backend (Ctrl+C if running)
cd backend
npm run start:dev
```

**Expected Output:**
```
[Nest] 12345  - 10/13/2025, 2:30:45 PM     LOG [NestApplication] Nest application successfully started +2ms
```

#### **Step 1.2: Test Order Creation Fix**
```bash
# Test the customer order endpoint that was recently fixed
curl -X POST http://localhost:3000/api/customer-orders \
  -H "Content-Type: application/json" \
  -d '{
    "customerSessionId": "test-session-123",
    "tableId": "test-table-1",
    "serviceFeePercentage": 15,
    "items": [
      {
        "menuItemId": "menu-item-1",
        "quantity": 2,
        "price": 25.99,
        "specialInstructions": "No onions"
      }
    ]
  }'
```

**Expected Response:** Status 201 with order object containing items array

#### **Step 1.3: Verify All Customer PWA Endpoints**
Run the PowerShell test script:
```powershell
.\test-customer-pwa-endpoints.ps1
```

**Fix any 500 errors by:**
1. Check backend console for error details
2. Update PrismaService mock methods if needed
3. Ensure all required fields are handled

---

### **TODO 2: Fix Frontend Build Issues**

#### **Step 2.1: Resolve TypeScript Version Conflict**
```bash
cd frontend

# Check current TypeScript version
npm list typescript

# If version conflict exists, fix it:
npm install typescript@5.2.2 --save-dev

# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

#### **Step 2.2: Register HTTP Interceptor**

**File:** `frontend/src/app/app.config.ts`

**Add this import:**
```typescript
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { AuthInterceptor } from './interceptors/auth.interceptor';
```

**Update providers array:**
```typescript
export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(
      withInterceptorsFromDi() // Add this
    ),
    // Add the interceptor
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    },
    // ... existing providers
  ]
};
```

#### **Step 2.3: Test Frontend Build**
```bash
cd frontend
npm run build
```

**Expected:** Build completes without TypeScript errors

---

### **TODO 3: Execute Comprehensive Testing**

#### **Step 3.1: Test Company-Scoped Data Filtering**

**Follow:** `TESTING-COMPANY-FILTERING.md`

**Key Tests:**
1. **Customer Menu Data Leakage Test**
   ```bash
   # Navigate to: http://localhost:4200/customer/restaurants
   # Select "Bella Vista Italian"
   # Go to menu - should show ONLY Bella Vista items (not all restaurants)
   ```

2. **Admin Dashboard Company Filtering**
   ```bash
   # Navigate to: http://localhost:4200/admin/system
   # Create new company via wizard
   # Verify tables, staff, menu items are company-specific
   ```

3. **Backend API Filtering**
   ```bash
   # Test with companyId parameter
   curl "http://localhost:3000/api/menu?companyId=company-123"
   # Should return only items for that company
   ```

#### **Step 3.2: Test Customer PWA End-to-End**

**Follow:** `CUSTOMER-PWA-TESTING-GUIDE.md`

**Complete Flow Test:**
1. Navigate to `http://localhost:4200/customer/restaurants`
2. Select restaurant → Enter table number → Register
3. Browse menu → Add items to cart → Place order
4. Verify order appears in Kitchen/Bar dashboard
5. Test real-time status updates via WebSocket

#### **Step 3.3: Test All Interface Integration**

**Admin Dashboard:**
```bash
http://localhost:4200/admin
# Test: Create menu items, manage staff, view orders
```

**Kitchen Interface:**
```bash
http://localhost:4200/kitchen
# Test: Receive food orders, update status
```

**Bar Interface:**
```bash
http://localhost:4200/bar
# Test: Receive drink orders, update status
```

**Waiter Interface:**
```bash
http://localhost:4200/waiter
# Test: View tables, manage orders, assign waiters
```

---

## 📋 **PRIORITY 2: COMPLETE CUSTOMER PWA (Days 3-4)**

### **TODO 4: Implement Real QR Code Scanning**

#### **Step 4.1: Install QR Scanner Library**
```bash
cd frontend
npm install @zxing/ngx-scanner @zxing/library
```

#### **Step 4.2: Update Scan Table Component**

**File:** `frontend/src/app/customer-pwa/pages/scan-table.component.ts`

**Add imports:**
```typescript
import { ZXingScannerModule } from '@zxing/ngx-scanner';
import { BarcodeFormat } from '@zxing/library';
```

**Add to component:**
```typescript
export class ScanTableComponent {
  // Add these properties
  hasDevices = false;
  hasPermission = false;
  qrResultString = '';
  availableDevices: MediaDeviceInfo[] = [];
  currentDevice?: MediaDeviceInfo;
  
  // Add these methods
  onCamerasFound(devices: MediaDeviceInfo[]): void {
    this.availableDevices = devices;
    this.hasDevices = Boolean(devices && devices.length);
  }

  onCodeResult(resultString: string) {
    this.qrResultString = resultString;
    this.processQRCode(resultString);
  }

  onHasPermission(has: boolean) {
    this.hasPermission = has;
  }

  processQRCode(qrData: string) {
    try {
      // Parse QR code data (should be URL with query params)
      const url = new URL(qrData);
      const companyId = url.searchParams.get('company');
      const tableNumber = url.searchParams.get('table');
      const restaurantSlug = url.searchParams.get('restaurant');
      
      if (companyId && tableNumber) {
        // Set company context and navigate to register
        this.customerSession.setCompanyContext(companyId, restaurantSlug);
        this.customerSession.setTableNumber(tableNumber);
        this.router.navigate(['/customer/register']);
      }
    } catch (error) {
      console.error('Invalid QR code format:', error);
      this.error = 'Invalid QR code. Please try again or enter table number manually.';
    }
  }
}
```

**Update template:**
```html
<!-- Add camera scanner section -->
<div class="scanner-section" *ngIf="!showManualEntry">
  <div class="scanner-container">
    <zxing-scanner
      #scanner
      [devices]="availableDevices"
      [device]="currentDevice"
      (camerasFound)="onCamerasFound($event)"
      (scanSuccess)="onCodeResult($event)"
      (hasPermission)="onHasPermission($event)"
      [formats]="[BarcodeFormat.QR_CODE]">
    </zxing-scanner>
  </div>
  
  <div class="scanner-overlay">
    <div class="scanner-frame"></div>
    <p class="scanner-instructions">Point your camera at the QR code on your table</p>
  </div>
</div>
```

#### **Step 4.3: Update QR Code Generation**

**File:** `backend/src/modules/tables/tables.service.ts`

**Update generateQRData method:**
```typescript
async generateQRData(companyId: string, tableId?: string) {
  const company = await this.prisma.company.findUnique({
    where: { id: companyId }
  });
  
  if (!company) {
    throw new Error('Company not found');
  }

  if (tableId) {
    // Generate QR for specific table
    const table = await this.prisma.table.findUnique({
      where: { id: tableId }
    });
    
    if (!table) {
      throw new Error('Table not found');
    }

    const qrUrl = `${process.env.FRONTEND_URL}/customer/scan-table?company=${company.guid}&restaurant=${company.slug}&table=${table.number}`;
    
    return {
      tableId: table.id,
      tableNumber: table.number,
      qrData: qrUrl,
      companyName: company.name
    };
  } else {
    // Generate QR for all tables
    const tables = await this.prisma.table.findMany({
      where: { companyId }
    });

    return tables.map(table => ({
      tableId: table.id,
      tableNumber: table.number,
      qrData: `${process.env.FRONTEND_URL}/customer/scan-table?company=${company.guid}&restaurant=${company.slug}&table=${table.number}`,
      companyName: company.name
    }));
  }
}
```

---

### **TODO 5: Complete Missing Customer PWA Features**

#### **Step 5.1: Implement Waiter Call Modal**

**File:** `frontend/src/app/customer-pwa/components/waiter-call-modal.component.ts`

**Create new component:**
```bash
cd frontend/src/app/customer-pwa/components
ng generate component waiter-call-modal --standalone
```

**Component implementation:**
```typescript
import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-waiter-call-modal',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatSelectModule,
    MatInputModule,
    MatFormFieldModule,
    FormsModule
  ],
  template: `
    <h2 mat-dialog-title>Call Waiter</h2>
    <mat-dialog-content>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>What do you need help with?</mat-label>
        <mat-select [(value)]="callType">
          <mat-option value="ASSISTANCE">General Assistance</mat-option>
          <mat-option value="ORDER_HELP">Help with Order</mat-option>
          <mat-option value="BILL_REQUEST">Request Bill</mat-option>
          <mat-option value="COMPLAINT">Complaint</mat-option>
          <mat-option value="OTHER">Other</mat-option>
        </mat-select>
      </mat-form-field>

      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Additional message (optional)</mat-label>
        <textarea matInput [(ngModel)]="message" rows="3" placeholder="Describe what you need..."></textarea>
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="cancel()">Cancel</button>
      <button mat-raised-button color="primary" (click)="callWaiter()">Call Waiter</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .full-width {
      width: 100%;
      margin-bottom: 16px;
    }
  `]
})
export class WaiterCallModalComponent {
  callType = 'ASSISTANCE';
  message = '';

  constructor(
    public dialogRef: MatDialogRef<WaiterCallModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  cancel(): void {
    this.dialogRef.close();
  }

  callWaiter(): void {
    this.dialogRef.close({
      callType: this.callType,
      message: this.message
    });
  }
}
```

#### **Step 5.2: Implement Item Detail Page**

**File:** `frontend/src/app/customer-pwa/pages/item-detail.component.ts`

**Create component:**
```bash
ng generate component customer-pwa/pages/item-detail --standalone
```

**Implementation:**
```typescript
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { CustomerCartService } from '../services/customer-cart.service';
import { ApiService } from '../../services/api.service';
import { MenuItem } from '../../interfaces/api.interfaces';

@Component({
  selector: 'app-item-detail',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    FormsModule
  ],
  template: `
    <div class="item-detail-container" *ngIf="item">
      <!-- Header -->
      <div class="header">
        <button mat-icon-button (click)="goBack()">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <h1>{{ item.name }}</h1>
      </div>

      <!-- Item Image -->
      <div class="item-image">
        <img [src]="item.imageUrl || '/assets/placeholder-food.svg'" [alt]="item.name">
      </div>

      <!-- Item Info -->
      <div class="item-info">
        <h2>{{ item.name }}</h2>
        <p class="description">{{ item.description }}</p>
        <div class="price">{{ formatCurrency(item.price) }}</div>
        
        <!-- Prep Time -->
        <div class="prep-time" *ngIf="item.prepTimeMin">
          <mat-icon>schedule</mat-icon>
          <span>{{ item.prepTimeMin }} minutes</span>
        </div>

        <!-- Spice Level -->
        <div class="spice-level" *ngIf="item.spiceLevel">
          <mat-icon>local_fire_department</mat-icon>
          <span>Spice Level: {{ item.spiceLevel }}/5</span>
        </div>
      </div>

      <!-- Quantity & Special Instructions -->
      <div class="order-section">
        <!-- Quantity Selector -->
        <div class="quantity-selector">
          <label>Quantity</label>
          <div class="quantity-controls">
            <button mat-icon-button (click)="decreaseQuantity()" [disabled]="quantity <= 1">
              <mat-icon>remove</mat-icon>
            </button>
            <span class="quantity">{{ quantity }}</span>
            <button mat-icon-button (click)="increaseQuantity()">
              <mat-icon>add</mat-icon>
            </button>
          </div>
        </div>

        <!-- Special Instructions -->
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Special Instructions (Optional)</mat-label>
          <textarea matInput [(ngModel)]="specialInstructions" 
                   placeholder="e.g., No onions, extra spicy, well done..."
                   rows="3"></textarea>
        </mat-form-field>

        <!-- Add to Cart Button -->
        <button mat-raised-button color="primary" class="add-to-cart-btn" (click)="addToCart()">
          <mat-icon>add_shopping_cart</mat-icon>
          Add {{ quantity }} to Cart - {{ formatCurrency(item.price * quantity) }}
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div class="loading-container" *ngIf="loading">
      <mat-icon class="loading-spinner">refresh</mat-icon>
      <p>Loading item details...</p>
    </div>
  `,
  styles: [`
    .item-detail-container {
      max-width: 600px;
      margin: 0 auto;
      padding: 0;
    }

    .header {
      display: flex;
      align-items: center;
      padding: 16px;
      background: white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      position: sticky;
      top: 0;
      z-index: 100;
    }

    .header h1 {
      margin: 0 0 0 16px;
      font-size: 1.2rem;
      font-weight: 600;
    }

    .item-image {
      width: 100%;
      height: 250px;
      overflow: hidden;
    }

    .item-image img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .item-info {
      padding: 24px;
    }

    .item-info h2 {
      margin: 0 0 12px 0;
      font-size: 1.5rem;
      font-weight: 700;
    }

    .description {
      color: #666;
      line-height: 1.5;
      margin-bottom: 16px;
    }

    .price {
      font-size: 1.3rem;
      font-weight: 700;
      color: #2196f3;
      margin-bottom: 16px;
    }

    .prep-time, .spice-level {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
      color: #666;
    }

    .order-section {
      padding: 24px;
      border-top: 1px solid #eee;
    }

    .quantity-selector {
      margin-bottom: 24px;
    }

    .quantity-selector label {
      display: block;
      margin-bottom: 8px;
      font-weight: 600;
    }

    .quantity-controls {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .quantity {
      font-size: 1.2rem;
      font-weight: 600;
      min-width: 30px;
      text-align: center;
    }

    .full-width {
      width: 100%;
      margin-bottom: 24px;
    }

    .add-to-cart-btn {
      width: 100%;
      height: 56px;
      font-size: 1.1rem;
      font-weight: 600;
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 200px;
    }

    .loading-spinner {
      animation: spin 1s linear infinite;
      font-size: 2rem;
      margin-bottom: 16px;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `]
})
export class ItemDetailComponent implements OnInit {
  item: MenuItem | null = null;
  loading = true;
  quantity = 1;
  specialInstructions = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private cartService: CustomerCartService,
    private apiService: ApiService
  ) {}

  ngOnInit() {
    const itemId = this.route.snapshot.paramMap.get('id');
    if (itemId) {
      this.loadItem(itemId);
    }
  }

  loadItem(itemId: string) {
    this.apiService.getMenuItem(itemId).subscribe({
      next: (item) => {
        this.item = item;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading item:', error);
        this.loading = false;
        this.router.navigate(['/customer/menu']);
      }
    });
  }

  increaseQuantity() {
    this.quantity++;
  }

  decreaseQuantity() {
    if (this.quantity > 1) {
      this.quantity--;
    }
  }

  addToCart() {
    if (this.item) {
      this.cartService.addItem({
        menuItemId: this.item.id,
        name: this.item.name,
        price: this.item.price,
        quantity: this.quantity,
        specialInstructions: this.specialInstructions,
        imageUrl: this.item.imageUrl
      });

      // Show success message and navigate back
      this.router.navigate(['/customer/menu']);
    }
  }

  goBack() {
    this.router.navigate(['/customer/menu']);
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR'
    }).format(amount);
  }
}
```

#### **Step 5.3: Add Order Notifications**

**File:** `frontend/src/app/customer-pwa/services/notification.service.ts`

**Create service:**
```typescript
import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  constructor(private snackBar: MatSnackBar) {}

  showSuccess(message: string, duration = 3000) {
    this.snackBar.open(message, 'Close', {
      duration,
      panelClass: ['success-snackbar']
    });
  }

  showError(message: string, duration = 5000) {
    this.snackBar.open(message, 'Close', {
      duration,
      panelClass: ['error-snackbar']
    });
  }

  showInfo(message: string, duration = 4000) {
    this.snackBar.open(message, 'Close', {
      duration,
      panelClass: ['info-snackbar']
    });
  }

  showOrderStatusUpdate(orderNumber: string, status: string) {
    const statusMessages = {
      'PENDING': `Order #${orderNumber} has been placed`,
      'PREPARING': `Order #${orderNumber} is being prepared`,
      'READY': `Order #${orderNumber} is ready!`,
      'SERVED': `Order #${orderNumber} has been served`
    };

    const message = statusMessages[status] || `Order #${orderNumber} status updated`;
    this.showInfo(message);
  }
}
```

**Update orders component to use notifications:**
```typescript
// In orders.component.ts, add WebSocket listener for status updates
ngOnInit() {
  // ... existing code ...

  // Listen for order status updates
  this.webSocketService.onOrderStatusChanged().subscribe(data => {
    if (data.customerSessionId === this.customerSession.getCurrentSession()?.id) {
      this.notificationService.showOrderStatusUpdate(data.orderNumber, data.status);
      this.loadOrders(); // Refresh orders
    }
  });
}
```

---

## 📋 **PRIORITY 3: ADVANCED FEATURES (Week 2)**

### **TODO 6: Analytics Dashboard**

#### **Step 6.1: Create Analytics Service**

**File:** `frontend/src/app/services/analytics.service.ts`

```typescript
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';

export interface AnalyticsData {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  topSellingItems: TopSellingItem[];
  revenueByHour: RevenueByHour[];
  orderStatusDistribution: OrderStatusDistribution[];
}

export interface TopSellingItem {
  menuItemId: string;
  name: string;
  quantity: number;
  revenue: number;
}

export interface RevenueByHour {
  hour: number;
  revenue: number;
  orderCount: number;
}

export interface OrderStatusDistribution {
  status: string;
  count: number;
  percentage: number;
}

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  private baseUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient) {}

  getAnalytics(companyId: string, dateRange?: { start: Date; end: Date }): Observable<AnalyticsData> {
    const params = new URLSearchParams();
    params.append('companyId', companyId);
    
    if (dateRange) {
      params.append('startDate', dateRange.start.toISOString());
      params.append('endDate', dateRange.end.toISOString());
    }

    return this.http.get<AnalyticsData>(`${this.baseUrl}/analytics?${params}`);
  }

  getRealtimeMetrics(companyId: string): Observable<any> {
    return combineLatest([
      this.http.get(`${this.baseUrl}/orders?companyId=${companyId}`),
      this.http.get(`${this.baseUrl}/menu?companyId=${companyId}`)
    ]).pipe(
      map(([orders, menu]) => {
        // Calculate real-time metrics
        return {
          activeOrders: orders.filter(o => ['PENDING', 'PREPARING'].includes(o.status)).length,
          completedToday: orders.filter(o => this.isToday(o.createdAt)).length,
          revenueToday: orders
            .filter(o => this.isToday(o.createdAt) && o.status === 'SERVED')
            .reduce((sum, order) => sum + order.total, 0)
        };
      })
    );
  }

  private isToday(date: string): boolean {
    const today = new Date();
    const orderDate = new Date(date);
    return orderDate.toDateString() === today.toDateString();
  }
}
```

#### **Step 6.2: Create Analytics Dashboard Component**

**File:** `frontend/src/app/analytics/analytics-dashboard.component.ts`

```typescript
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule } from '@angular/material/core';
import { FormsModule } from '@angular/forms';
import { AnalyticsService, AnalyticsData } from '../services/analytics.service';
import { CompanyContextService } from '../services/company-context.service';

@Component({
  selector: 'app-analytics-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatInputModule,
    MatNativeDateModule,
    FormsModule
  ],
  template: `
    <div class="analytics-container">
      <div class="analytics-header">
        <h1>📊 Analytics Dashboard</h1>
        
        <!-- Date Range Selector -->
        <div class="date-range-selector">
          <mat-form-field appearance="outline">
            <mat-label>Start Date</mat-label>
            <input matInput [matDatepicker]="startPicker" [(ngModel)]="startDate" (dateChange)="onDateChange()">
            <mat-datepicker-toggle matSuffix [for]="startPicker"></mat-datepicker-toggle>
            <mat-datepicker #startPicker></mat-datepicker>
          </mat-form-field>
          
          <mat-form-field appearance="outline">
            <mat-label>End Date</mat-label>
            <input matInput [matDatepicker]="endPicker" [(ngModel)]="endDate" (dateChange)="onDateChange()">
            <mat-datepicker-toggle matSuffix [for]="endPicker"></mat-datepicker-toggle>
            <mat-datepicker #endPicker></mat-datepicker>
          </mat-form-field>
          
          <button mat-raised-button color="primary" (click)="refreshData()">Refresh</button>
        </div>
      </div>

      <!-- Key Metrics Cards -->
      <div class="metrics-grid" *ngIf="analyticsData">
        <mat-card class="metric-card revenue">
          <mat-card-content>
            <div class="metric-icon">💰</div>
            <div class="metric-value">{{ formatCurrency(analyticsData.totalRevenue) }}</div>
            <div class="metric-label">Total Revenue</div>
          </mat-card-content>
        </mat-card>

        <mat-card class="metric-card orders">
          <mat-card-content>
            <div class="metric-icon">📋</div>
            <div class="metric-value">{{ analyticsData.totalOrders }}</div>
            <div class="metric-label">Total Orders</div>
          </mat-card-content>
        </mat-card>

        <mat-card class="metric-card average">
          <mat-card-content>
            <div class="metric-icon">📈</div>
            <div class="metric-value">{{ formatCurrency(analyticsData.averageOrderValue) }}</div>
            <div class="metric-label">Average Order Value</div>
          </mat-card-content>
        </mat-card>

        <mat-card class="metric-card active">
          <mat-card-content>
            <div class="metric-icon">🔥</div>
            <div class="metric-value">{{ realtimeMetrics?.activeOrders || 0 }}</div>
            <div class="metric-label">Active Orders</div>
          </mat-card-content>
        </mat-card>
      </div>

      <!-- Top Selling Items -->
      <mat-card class="chart-card" *ngIf="analyticsData?.topSellingItems">
        <mat-card-header>
          <mat-card-title>🏆 Top Selling Items</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <div class="top-items-list">
            <div class="top-item" *ngFor="let item of analyticsData.topSellingItems; let i = index">
              <div class="item-rank">{{ i + 1 }}</div>
              <div class="item-info">
                <div class="item-name">{{ item.name }}</div>
                <div class="item-stats">{{ item.quantity }} sold • {{ formatCurrency(item.revenue) }}</div>
              </div>
              <div class="item-bar">
                <div class="bar-fill" [style.width.%]="(item.quantity / analyticsData.topSellingItems[0].quantity) * 100"></div>
              </div>
            </div>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Revenue by Hour Chart -->
      <mat-card class="chart-card" *ngIf="analyticsData?.revenueByHour">
        <mat-card-header>
          <mat-card-title>⏰ Revenue by Hour</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <div class="hour-chart">
            <div class="hour-bar" *ngFor="let hour of analyticsData.revenueByHour">
              <div class="bar-container">
                <div class="bar" [style.height.%]="(hour.revenue / maxHourlyRevenue) * 100"></div>
              </div>
              <div class="hour-label">{{ hour.hour }}:00</div>
              <div class="hour-value">{{ formatCurrency(hour.revenue) }}</div>
            </div>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Order Status Distribution -->
      <mat-card class="chart-card" *ngIf="analyticsData?.orderStatusDistribution">
        <mat-card-header>
          <mat-card-title">📊 Order Status Distribution</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <div class="status-chart">
            <div class="status-item" *ngFor="let status of analyticsData.orderStatusDistribution">
              <div class="status-color" [class]="'status-' + status.status.toLowerCase()"></div>
              <div class="status-info">
                <div class="status-name">{{ status.status }}</div>
                <div class="status-count">{{ status.count }} orders ({{ status.percentage }}%)</div>
              </div>
            </div>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .analytics-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }

    .analytics-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 30px;
      flex-wrap: wrap;
      gap: 20px;
    }

    .analytics-header h1 {
      margin: 0;
      font-size: 2rem;
      font-weight: 700;
    }

    .date-range-selector {
      display: flex;
      gap: 16px;
      align-items: center;
      flex-wrap: wrap;
    }

    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }

    .metric-card {
      text-align: center;
      padding: 0;
    }

    .metric-card mat-card-content {
      padding: 24px;
    }

    .metric-icon {
      font-size: 2.5rem;
      margin-bottom: 12px;
    }

    .metric-value {
      font-size: 2rem;
      font-weight: 700;
      margin-bottom: 8px;
    }

    .metric-label {
      color: #666;
      font-size: 0.9rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .metric-card.revenue .metric-value { color: #4caf50; }
    .metric-card.orders .metric-value { color: #2196f3; }
    .metric-card.average .metric-value { color: #ff9800; }
    .metric-card.active .metric-value { color: #f44336; }

    .chart-card {
      margin-bottom: 30px;
    }

    .top-items-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .top-item {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 12px;
      border-radius: 8px;
      background: #f5f5f5;
    }

    .item-rank {
      width: 30px;
      height: 30px;
      border-radius: 50%;
      background: #2196f3;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
    }

    .item-info {
      flex: 1;
    }

    .item-name {
      font-weight: 600;
      margin-bottom: 4px;
    }

    .item-stats {
      font-size: 0.9rem;
      color: #666;
    }

    .item-bar {
      width: 100px;
      height: 8px;
      background: #e0e0e0;
      border-radius: 4px;
      overflow: hidden;
    }

    .bar-fill {
      height: 100%;
      background: #2196f3;
      transition: width 0.3s ease;
    }

    .hour-chart {
      display: flex;
      gap: 8px;
      align-items: end;
      height: 200px;
      padding: 20px 0;
    }

    .hour-bar {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
    }

    .bar-container {
      height: 120px;
      width: 20px;
      background: #e0e0e0;
      border-radius: 4px;
      display: flex;
      align-items: end;
      overflow: hidden;
    }

    .bar {
      width: 100%;
      background: linear-gradient(to top, #2196f3, #64b5f6);
      border-radius: 4px;
      transition: height 0.3s ease;
    }

    .hour-label {
      font-size: 0.8rem;
      font-weight: 600;
    }

    .hour-value {
      font-size: 0.7rem;
      color: #666;
    }

    .status-chart {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .status-item {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .status-color {
      width: 16px;
      height: 16px;
      border-radius: 50%;
    }

    .status-color.status-pending { background: #ff9800; }
    .status-color.status-preparing { background: #2196f3; }
    .status-color.status-ready { background: #4caf50; }
    .status-color.status-served { background: #9e9e9e; }

    .status-name {
      font-weight: 600;
      text-transform: capitalize;
    }

    .status-count {
      font-size: 0.9rem;
      color: #666;
    }

    @media (max-width: 768px) {
      .analytics-header {
        flex-direction: column;
        align-items: stretch;
      }

      .date-range-selector {
        justify-content: center;
      }

      .metrics-grid {
        grid-template-columns: repeat(2, 1fr);
      }

      .hour-chart {
        overflow-x: auto;
        padding-bottom: 10px;
      }
    }
  `]
})
export class AnalyticsDashboardComponent implements OnInit {
  analyticsData: AnalyticsData | null = null;
  realtimeMetrics: any = null;
  loading = true;
  
  startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
  endDate = new Date();
  
  maxHourlyRevenue = 0;

  constructor(
    private analyticsService: AnalyticsService,
    private companyContext: CompanyContextService
  ) {}

  ngOnInit() {
    this.loadAnalytics();
    this.loadRealtimeMetrics();
    
    // Refresh real-time metrics every 30 seconds
    setInterval(() => {
      this.loadRealtimeMetrics();
    }, 30000);
  }

  loadAnalytics() {
    const companyId = this.companyContext.getCurrentCompanyId();
    if (!companyId) return;

    this.loading = true;
    this.analyticsService.getAnalytics(companyId, {
      start: this.startDate,
      end: this.endDate
    }).subscribe({
      next: (data) => {
        this.analyticsData = data;
        this.maxHourlyRevenue = Math.max(...data.revenueByHour.map(h => h.revenue));
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading analytics:', error);
        this.loading = false;
      }
    });
  }

  loadRealtimeMetrics() {
    const companyId = this.companyContext.getCurrentCompanyId();
    if (!companyId) return;

    this.analyticsService.getRealtimeMetrics(companyId).subscribe({
      next: (metrics) => {
        this.realtimeMetrics = metrics;
      },
      error: (error) => {
        console.error('Error loading real-time metrics:', error);
      }
    });
  }

  onDateChange() {
    // Auto-refresh when date changes
    setTimeout(() => this.loadAnalytics(), 100);
  }

  refreshData() {
    this.loadAnalytics();
    this.loadRealtimeMetrics();
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR'
    }).format(amount || 0);
  }
}
```

#### **Step 6.3: Create Backend Analytics Endpoints**

**File:** `backend/src/modules/analytics/analytics.controller.ts`

```typescript
import { Controller, Get, Query } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { ApiQuery, ApiTags } from '@nestjs/swagger';

@ApiTags('Analytics')
@Controller('api/analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get()
  @ApiQuery({ name: 'companyId', required: true })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  async getAnalytics(
    @Query('companyId') companyId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    const dateRange = startDate && endDate ? {
      start: new Date(startDate),
      end: new Date(endDate)
    } : undefined;

    return this.analyticsService.getAnalytics(companyId, dateRange);
  }

  @Get('realtime')
  @ApiQuery({ name: 'companyId', required: true })
  async getRealtimeMetrics(@Query('companyId') companyId: string) {
    return this.analyticsService.getRealtimeMetrics(companyId);
  }

  @Get('top-items')
  @ApiQuery({ name: 'companyId', required: true })
  @ApiQuery({ name: 'limit', required: false })
  async getTopSellingItems(
    @Query('companyId') companyId: string,
    @Query('limit') limit = 10
  ) {
    return this.analyticsService.getTopSellingItems(companyId, Number(limit));
  }
}
```

---

### **TODO 7: Payment Integration**

#### **Step 7.1: Install Payment Libraries**
```bash
cd frontend
npm install @stripe/stripe-js
npm install stripe  # for backend

cd ../backend
npm install stripe
```

#### **Step 7.2: Create Payment Service**

**File:** `frontend/src/app/services/payment.service.ts`

```typescript
import { Injectable } from '@angular/core';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private stripe: Stripe | null = null;
  private baseUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient) {
    this.initializeStripe();
  }

  private async initializeStripe() {
    this.stripe = await loadStripe('pk_test_your_stripe_publishable_key');
  }

  createPaymentIntent(amount: number, currency = 'zar'): Observable<any> {
    return this.http.post(`${this.baseUrl}/payments/create-intent`, {
      amount: Math.round(amount * 100), // Convert to cents
      currency
    });
  }

  async processPayment(clientSecret: string, paymentMethodId: string) {
    if (!this.stripe) {
      throw new Error('Stripe not initialized');
    }

    return await this.stripe.confirmCardPayment(clientSecret, {
      payment_method: paymentMethodId
    });
  }

  async createPaymentMethod(cardElement: any) {
    if (!this.stripe) {
      throw new Error('Stripe not initialized');
    }

    return await this.stripe.createPaymentMethod({
      type: 'card',
      card: cardElement
    });
  }
}
```

#### **Step 7.3: Create Payment Component**

**File:** `frontend/src/app/customer-pwa/pages/payment.component.ts`

```typescript
import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { PaymentService } from '../../services/payment.service';
import { CustomerCartService } from '../services/customer-cart.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-payment',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="payment-container">
      <mat-card class="payment-card">
        <mat-card-header>
          <mat-card-title>💳 Payment</mat-card-title>
          <mat-card-subtitle>Complete your order</mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          <!-- Order Summary -->
          <div class="order-summary">
            <h3>Order Summary</h3>
            <div class="summary-line" *ngFor="let item of cartItems">
              <span>{{ item.name }} x{{ item.quantity }}</span>
              <span>{{ formatCurrency(item.price * item.quantity) }}</span>
            </div>
            <div class="summary-line subtotal">
              <span>Subtotal</span>
              <span>{{ formatCurrency(subtotal) }}</span>
            </div>
            <div class="summary-line service-fee" *ngIf="serviceFee > 0">
              <span>Service Fee ({{ serviceFeePercentage }}%)</span>
              <span>{{ formatCurrency(serviceFee) }}</span>
            </div>
            <div class="summary-line total">
              <span>Total</span>
              <span>{{ formatCurrency(total) }}</span>
            </div>
          </div>

          <!-- Payment Methods -->
          <div class="payment-methods">
            <h3>Payment Method</h3>
            
            <!-- Card Payment -->
            <div class="payment-method" [class.selected]="selectedMethod === 'card'" (click)="selectMethod('card')">
              <div class="method-icon">💳</div>
              <div class="method-info">
                <div class="method-name">Credit/Debit Card</div>
                <div class="method-description">Visa, Mastercard, American Express</div>
              </div>
            </div>

            <!-- Cash Payment -->
            <div class="payment-method" [class.selected]="selectedMethod === 'cash'" (click)="selectMethod('cash')">
              <div class="method-icon">💵</div>
              <div class="method-info">
                <div class="method-name">Cash</div>
                <div class="method-description">Pay with cash when your order arrives</div>
              </div>
            </div>

            <!-- EFT Payment -->
            <div class="payment-method" [class.selected]="selectedMethod === 'eft'" (click)="selectMethod('eft')">
              <div class="method-icon">🏦</div>
              <div class="method-info">
                <div class="method-name">EFT/Bank Transfer</div>
                <div class="method-description">Direct bank transfer</div>
              </div>
            </div>
          </div>

          <!-- Card Details (shown when card is selected) -->
          <div class="card-details" *ngIf="selectedMethod === 'card'">
            <div #cardElement class="card-element">
              <!-- Stripe Elements will be mounted here -->
            </div>
          </div>

          <!-- EFT Details (shown when EFT is selected) -->
          <div class="eft-details" *ngIf="selectedMethod === 'eft'">
            <div class="bank-details">
              <h4>Bank Details</h4>
              <p><strong>Bank:</strong> First National Bank</p>
              <p><strong>Account Name:</strong> Restaurant Name</p>
              <p><strong>Account Number:</strong> 1234567890</p>
              <p><strong>Branch Code:</strong> 250655</p>
              <p><strong>Reference:</strong> Order #{{ orderNumber }}</p>
            </div>
          </div>
        </mat-card-content>

        <mat-card-actions>
          <button mat-button (click)="goBack()">Back to Cart</button>
          <button mat-raised-button color="primary" 
                  (click)="processPayment()" 
                  [disabled]="processing">
            <mat-spinner diameter="20" *ngIf="processing"></mat-spinner>
            <span *ngIf="!processing">
              {{ selectedMethod === 'card' ? 'Pay Now' : 'Place Order' }} - {{ formatCurrency(total) }}
            </span>
            <span *ngIf="processing">Processing...</span>
          </button>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: [`
    .payment-container {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }

    .payment-card {
      margin-bottom: 20px;
    }

    .order-summary {
      margin-bottom: 30px;
      padding: 20px;
      background: #f5f5f5;
      border-radius: 8px;
    }

    .order-summary h3 {
      margin: 0 0 16px 0;
      font-size: 1.2rem;
      font-weight: 600;
    }

    .summary-line {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
    }

    .summary-line.subtotal {
      border-top: 1px solid #ddd;
      padding-top: 8px;
      margin-top: 12px;
    }

    .summary-line.total {
      border-top: 2px solid #333;
      padding-top: 8px;
      margin-top: 12px;
      font-weight: 700;
      font-size: 1.1rem;
    }

    .payment-methods h3 {
      margin: 0 0 16px 0;
      font-size: 1.2rem;
      font-weight: 600;
    }

    .payment-method {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 16px;
      border: 2px solid #e0e0e0;
      border-radius: 8px;
      margin-bottom: 12px;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .payment-method:hover {
      border-color: #2196f3;
    }

    .payment-method.selected {
      border-color: #2196f3;
      background: #e3f2fd;
    }

    .method-icon {
      font-size: 2rem;
    }

    .method-info {
      flex: 1;
    }

    .method-name {
      font-weight: 600;
      margin-bottom: 4px;
    }

    .method-description {
      font-size: 0.9rem;
      color: #666;
    }

    .card-details {
      margin-top: 20px;
      padding: 20px;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
    }

    .card-element {
      padding: 16px;
      border: 1px solid #ccc;
      border-radius: 4px;
      background: white;
    }

    .eft-details {
      margin-top: 20px;
      padding: 20px;
      background: #f5f5f5;
      border-radius: 8px;
    }

    .bank-details h4 {
      margin: 0 0 12px 0;
    }

    .bank-details p {
      margin: 4px 0;
    }

    mat-card-actions {
      display: flex;
      justify-content: space-between;
      padding: 16px 24px;
    }

    mat-spinner {
      margin-right: 8px;
    }
  `]
})
export class PaymentComponent implements OnInit {
  @ViewChild('cardElement') cardElement!: ElementRef;

  cartItems: any[] = [];
  subtotal = 0;
  serviceFee = 0;
  serviceFeePercentage = 0;
  total = 0;
  orderNumber = '';

  selectedMethod = 'card';
  processing = false;

  private stripe: any;
  private cardElementStripe: any;

  constructor(
    private paymentService: PaymentService,
    private cartService: CustomerCartService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadCartData();
    this.generateOrderNumber();
  }

  ngAfterViewInit() {
    if (this.selectedMethod === 'card') {
      this.setupStripeElements();
    }
  }

  loadCartData() {
    this.cartService.getCartItems().subscribe(items => {
      this.cartItems = items;
      this.calculateTotals();
    });

    this.cartService.getServiceFeePercentage().subscribe(percentage => {
      this.serviceFeePercentage = percentage;
      this.calculateTotals();
    });
  }

  calculateTotals() {
    this.subtotal = this.cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    this.serviceFee = this.subtotal * (this.serviceFeePercentage / 100);
    this.total = this.subtotal + this.serviceFee;
  }

  generateOrderNumber() {
    this.orderNumber = 'ORD' + Date.now().toString().slice(-6);
  }

  selectMethod(method: string) {
    this.selectedMethod = method;
    
    if (method === 'card') {
      setTimeout(() => this.setupStripeElements(), 100);
    }
  }

  async setupStripeElements() {
    // Initialize Stripe Elements for card input
    // This would integrate with the actual Stripe Elements
    console.log('Setting up Stripe Elements...');
  }

  async processPayment() {
    this.processing = true;

    try {
      switch (this.selectedMethod) {
        case 'card':
          await this.processCardPayment();
          break;
        case 'cash':
          await this.processCashPayment();
          break;
        case 'eft':
          await this.processEFTPayment();
          break;
      }
    } catch (error) {
      console.error('Payment error:', error);
      this.processing = false;
    }
  }

  async processCardPayment() {
    // Create payment intent
    this.paymentService.createPaymentIntent(this.total).subscribe(async (response) => {
      try {
        // Process with Stripe
        const result = await this.paymentService.processPayment(
          response.clientSecret,
          'payment_method_id' // This would come from Stripe Elements
        );

        if (result.error) {
          throw new Error(result.error.message);
        }

        // Payment successful
        await this.completeOrder('PAID');
      } catch (error) {
        throw error;
      }
    });
  }

  async processCashPayment() {
    // For cash payments, just create the order
    await this.completeOrder('PENDING_CASH');
  }

  async processEFTPayment() {
    // For EFT payments, create order and show bank details
    await this.completeOrder('PENDING_EFT');
  }

  async completeOrder(paymentStatus: string) {
    // Create the order with payment status
    const orderData = {
      items: this.cartItems,
      subtotal: this.subtotal,
      serviceFee: this.serviceFee,
      total: this.total,
      paymentMethod: this.selectedMethod,
      paymentStatus,
      orderNumber: this.orderNumber
    };

    // Submit order (this would call your existing order creation API)
    console.log('Creating order:', orderData);

    // Clear cart
    this.cartService.clearCart();

    // Navigate to success page
    this.router.navigate(['/customer/orders'], {
      queryParams: { orderNumber: this.orderNumber }
    });

    this.processing = false;
  }

  goBack() {
    this.router.navigate(['/customer/cart']);
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR'
    }).format(amount);
  }
}
```

---

### **TODO 8: Inventory Management System**

#### **Step 8.1: Create Inventory Service**

**File:** `backend/src/modules/inventory/inventory.service.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  currentStock: number;
  minStockLevel: number;
  maxStockLevel: number;
  unit: string;
  costPerUnit: number;
  supplierId?: string;
  lastRestocked: Date;
  companyId: string;
}

export interface StockMovement {
  id: string;
  inventoryItemId: string;
  type: 'IN' | 'OUT' | 'ADJUSTMENT';
  quantity: number;
  reason: string;
  userId: string;
  timestamp: Date;
}

@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService) {}

  async getAllInventoryItems(companyId: string): Promise<InventoryItem[]> {
    return this.prisma.inventoryItem.findMany({
      where: { companyId },
      include: {
        supplier: true,
        movements: {
          take: 5,
          orderBy: { timestamp: 'desc' }
        }
      }
    });
  }

  async createInventoryItem(data: Partial<InventoryItem>): Promise<InventoryItem> {
    return this.prisma.inventoryItem.create({
      data: {
        ...data,
        lastRestocked: new Date()
      }
    });
  }

  async updateStock(itemId: string, quantity: number, type: 'IN' | 'OUT' | 'ADJUSTMENT', reason: string, userId: string) {
    const item = await this.prisma.inventoryItem.findUnique({
      where: { id: itemId }
    });

    if (!item) {
      throw new Error('Inventory item not found');
    }

    let newStock = item.currentStock;
    
    switch (type) {
      case 'IN':
        newStock += quantity;
        break;
      case 'OUT':
        newStock -= quantity;
        break;
      case 'ADJUSTMENT':
        newStock = quantity;
        break;
    }

    // Update stock level
    await this.prisma.inventoryItem.update({
      where: { id: itemId },
      data: { 
        currentStock: newStock,
        lastRestocked: type === 'IN' ? new Date() : item.lastRestocked
      }
    });

    // Record stock movement
    await this.prisma.stockMovement.create({
      data: {
        inventoryItemId: itemId,
        type,
        quantity,
        reason,
        userId,
        timestamp: new Date()
      }
    });

    // Check for low stock alerts
    if (newStock <= item.minStockLevel) {
      await this.createLowStockAlert(itemId, newStock, item.minStockLevel);
    }

    return this.prisma.inventoryItem.findUnique({
      where: { id: itemId },
      include: { movements: { take: 5, orderBy: { timestamp: 'desc' } } }
    });
  }

  async getLowStockItems(companyId: string) {
    return this.prisma.inventoryItem.findMany({
      where: {
        companyId,
        currentStock: {
          lte: this.prisma.inventoryItem.fields.minStockLevel
        }
      }
    });
  }

  async getStockMovements(companyId: string, limit = 50) {
    return this.prisma.stockMovement.findMany({
      where: {
        inventoryItem: { companyId }
      },
      include: {
        inventoryItem: true,
        user: true
      },
      orderBy: { timestamp: 'desc' },
      take: limit
    });
  }

  private async createLowStockAlert(itemId: string, currentStock: number, minLevel: number) {
    // Create alert in database or send notification
    console.log(`🚨 Low Stock Alert: Item ${itemId} has ${currentStock} units (min: ${minLevel})`);
    
    // You could integrate with notification service here
    // await this.notificationService.sendLowStockAlert(itemId, currentStock, minLevel);
  }

  async generateRestockReport(companyId: string) {
    const lowStockItems = await this.getLowStockItems(companyId);
    
    return {
      itemsNeedingRestock: lowStockItems.length,
      items: lowStockItems.map(item => ({
        id: item.id,
        name: item.name,
        currentStock: item.currentStock,
        minStockLevel: item.minStockLevel,
        suggestedOrderQuantity: item.maxStockLevel - item.currentStock,
        estimatedCost: (item.maxStockLevel - item.currentStock) * item.costPerUnit
      })),
      totalEstimatedCost: lowStockItems.reduce((sum, item) => 
        sum + ((item.maxStockLevel - item.currentStock) * item.costPerUnit), 0
      )
    };
  }
}
```

#### **Step 8.2: Create Inventory Management Component**

**File:** `frontend/src/app/inventory/inventory-dashboard.component.ts`

```typescript
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { InventoryService } from '../services/inventory.service';

@Component({
  selector: 'app-inventory-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatTabsModule,
    MatChipsModule,
    MatDialogModule
  ],
  template: `
    <div class="inventory-container">
      <div class="inventory-header">
        <h1>📦 Inventory Management</h1>
        <button mat-raised-button color="primary" (click)="openAddItemDialog()">
          <mat-icon>add</mat-icon>
          Add Item
        </button>
      </div>

      <!-- Summary Cards -->
      <div class="summary-cards">
        <mat-card class="summary-card total">
          <mat-card-content>
            <div class="card-icon">📦</div>
            <div class="card-value">{{ totalItems }}</div>
            <div class="card-label">Total Items</div>
          </mat-card-content>
        </mat-card>

        <mat-card class="summary-card low-stock">
          <mat-card-content>
            <div class="card-icon">⚠️</div>
            <div class="card-value">{{ lowStockItems.length }}</div>
            <div class="card-label">Low Stock</div>
          </mat-card-content>
        </mat-card>

        <mat-card class="summary-card value">
          <mat-card-content>
            <div class="card-icon">💰</div>
            <div class="card-value">{{ formatCurrency(totalInventoryValue) }}</div>
            <div class="card-label">Total Value</div>
          </mat-card-content>
        </mat-card>

        <mat-card class="summary-card movements">
          <mat-card-content>
            <div class="card-icon">🔄</div>
            <div class="card-value">{{ recentMovements.length }}</div>
            <div class="card-label">Recent Movements</div>
          </mat-card-content>
        </mat-card>
      </div>

      <!-- Tabs -->
      <mat-tab-group>
        <!-- All Items Tab -->
        <mat-tab label="All Items">
          <div class="tab-content">
            <div class="table-container">
              <table mat-table [dataSource]="inventoryItems" class="inventory-table">
                <!-- Name Column -->
                <ng-container matColumnDef="name">
                  <th mat-header-cell *matHeaderCellDef>Item Name</th>
                  <td mat-cell *matCellDef="let item">
                    <div class="item-name">
                      <strong>{{ item.name }}</strong>
                      <div class="item-category">{{ item.category }}</div>
                    </div>
                  </td>
                </ng-container>

                <!-- Stock Column -->
                <ng-container matColumnDef="stock">
                  <th mat-header-cell *matHeaderCellDef>Stock Level</th>
                  <td mat-cell *matCellDef="let item">
                    <div class="stock-info">
                      <div class="stock-level" [class.low-stock]="item.currentStock <= item.minStockLevel">
                        {{ item.currentStock }} {{ item.unit }}
                      </div>
                      <div class="stock-range">Min: {{ item.minStockLevel }} | Max: {{ item.maxStockLevel }}</div>
                    </div>
                  </td>
                </ng-container>

                <!-- Status Column -->
                <ng-container matColumnDef="status">
                  <th mat-header-cell *matHeaderCellDef>Status</th>
                  <td mat-cell *matCellDef="let item">
                    <mat-chip [class]="getStockStatusClass(item)">
                      {{ getStockStatus(item) }}
                    </mat-chip>
                  </td>
                </ng-container>

                <!-- Value Column -->
                <ng-container matColumnDef="value">
                  <th mat-header-cell *matHeaderCellDef>Value</th>
                  <td mat-cell *matCellDef="let item">
                    <div class="item-value">
                      <div class="total-value">{{ formatCurrency(item.currentStock * item.costPerUnit) }}</div>
                      <div class="unit-cost">{{ formatCurrency(item.costPerUnit) }}/{{ item.unit }}</div>
                    </div>
                  </td>
                </ng-container>

                <!-- Actions Column -->
                <ng-container matColumnDef="actions">
                  <th mat-header-cell *matHeaderCellDef>Actions</th>
                  <td mat-cell *matCellDef="let item">
                    <button mat-icon-button (click)="openStockUpdateDialog(item)">
                      <mat-icon>edit</mat-icon>
                    </button>
                    <button mat-icon-button (click)="viewItemHistory(item)">
                      <mat-icon>history</mat-icon>
                    </button>
                  </td>
                </ng-container>

                <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
                <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
              </table>
            </div>
          </div>
        </mat-tab>

        <!-- Low Stock Tab -->
        <mat-tab label="Low Stock" [badge]="lowStockItems.length">
          <div class="tab-content">
            <div class="low-stock-alerts" *ngIf="lowStockItems.length > 0">
              <mat-card class="alert-card" *ngFor="let item of lowStockItems">
                <mat-card-content>
                  <div class="alert-header">
                    <mat-icon class="alert-icon">warning</mat-icon>
                    <div class="alert-info">
                      <h3>{{ item.name }}</h3>
                      <p>Only {{ item.currentStock }} {{ item.unit }} remaining (min: {{ item.minStockLevel }})</p>
                    </div>
                    <button mat-raised-button color="primary" (click)="quickRestock(item)">
                      Restock
                    </button>
                  </div>
                </mat-card-content>
              </mat-card>
            </div>
            <div class="no-alerts" *ngIf="lowStockItems.length === 0">
              <mat-icon>check_circle</mat-icon>
              <h3>All items are well stocked!</h3>
              <p>No items are currently below minimum stock levels.</p>
            </div>
          </div>
        </mat-tab>

        <!-- Stock Movements Tab -->
        <mat-tab label="Recent Movements">
          <div class="tab-content">
            <div class="movements-list">
              <mat-card class="movement-card" *ngFor="let movement of recentMovements">
                <mat-card-content>
                  <div class="movement-header">
                    <div class="movement-type" [class]="'type-' + movement.type.toLowerCase()">
                      <mat-icon>{{ getMovementIcon(movement.type) }}</mat-icon>
                      {{ movement.type }}
                    </div>
                    <div class="movement-time">{{ formatDate(movement.timestamp) }}</div>
                  </div>
                  <div class="movement-details">
                    <strong>{{ movement.inventoryItem.name }}</strong>
                    <span class="quantity">{{ movement.quantity }} {{ movement.inventoryItem.unit }}</span>
                  </div>
                  <div class="movement-reason">{{ movement.reason }}</div>
                  <div class="movement-user">by {{ movement.user.name }}</div>
                </mat-card-content>
              </mat-card>
            </div>
          </div>
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
  styles: [`
    .inventory-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }

    .inventory-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 30px;
    }

    .inventory-header h1 {
      margin: 0;
      font-size: 2rem;
      font-weight: 700;
    }

    .summary-cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }

    .summary-card {
      text-align: center;
    }

    .summary-card mat-card-content {
      padding: 24px;
    }

    .card-icon {
      font-size: 2.5rem;
      margin-bottom: 12px;
    }

    .card-value {
      font-size: 1.8rem;
      font-weight: 700;
      margin-bottom: 8px;
    }

    .card-label {
      color: #666;
      font-size: 0.9rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .summary-card.total .card-value { color: #2196f3; }
    .summary-card.low-stock .card-value { color: #f44336; }
    .summary-card.value .card-value { color: #4caf50; }
    .summary-card.movements .card-value { color: #ff9800; }

    .tab-content {
      padding: 20px 0;
    }

    .table-container {
      overflow-x: auto;
    }

    .inventory-table {
      width: 100%;
    }

    .item-name strong {
      display: block;
      margin-bottom: 4px;
    }

    .item-category {
      font-size: 0.8rem;
      color: #666;
    }

    .stock-info {
      text-align: center;
    }

    .stock-level {
      font-weight: 600;
      margin-bottom: 4px;
    }

    .stock-level.low-stock {
      color: #f44336;
    }

    .stock-range {
      font-size: 0.8rem;
      color: #666;
    }

    .item-value {
      text-align: right;
    }

    .total-value {
      font-weight: 600;
      margin-bottom: 4px;
    }

    .unit-cost {
      font-size: 0.8rem;
      color: #666;
    }

    .low-stock-alerts {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .alert-card {
      border-left: 4px solid #f44336;
    }

    .alert-header {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .alert-icon {
      color: #f44336;
      font-size: 2rem;
    }

    .alert-info {
      flex: 1;
    }

    .alert-info h3 {
      margin: 0 0 8px 0;
    }

    .alert-info p {
      margin: 0;
      color: #666;
    }

    .no-alerts {
      text-align: center;
      padding: 60px 20px;
      color: #666;
    }

    .no-alerts mat-icon {
      font-size: 4rem;
      color: #4caf50;
      margin-bottom: 16px;
    }

    .movements-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .movement-card {
      border-left: 4px solid #e0e0e0;
    }

    .movement-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }

    .movement-type {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 600;
      text-transform: uppercase;
      font-size: 0.9rem;
    }

    .movement-type.type-in {
      color: #4caf50;
    }

    .movement-type.type-out {
      color: #f44336;
    }

    .movement-type.type-adjustment {
      color: #ff9800;
    }

    .movement-details {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 4px;
    }

    .quantity {
      font-weight: 600;
      color: #2196f3;
    }

    .movement-reason {
      font-size: 0.9rem;
      color: #666;
      margin-bottom: 4px;
    }

    .movement-user {
      font-size: 0.8rem;
      color: #999;
    }

    .movement-time {
      font-size: 0.8rem;
      color: #999;
    }

    @media (max-width: 768px) {
      .inventory-header {
        flex-direction: column;
        gap: 16px;
        align-items: stretch;
      }

      .summary-cards {
        grid-template-columns: repeat(2, 1fr);
      }

      .alert-header {
        flex-direction: column;
        align-items: stretch;
        gap: 12px;
      }
    }
  `]
})
export class InventoryDashboardComponent implements OnInit {
  inventoryItems: any[] = [];
  lowStockItems: any[] = [];
  recentMovements: any[] = [];
  
  totalItems = 0;
  totalInventoryValue = 0;
  
  displayedColumns = ['name', 'stock', 'status', 'value', 'actions'];

  constructor(
    private inventoryService: InventoryService,
    private dialog: MatDialog
  ) {}

  ngOnInit() {
    this.loadInventoryData();
  }

  loadInventoryData() {
    // Load all inventory items
    this.inventoryService.getAllItems().subscribe(items => {
      this.inventoryItems = items;
      this.totalItems = items.length;
      this.totalInventoryValue = items.reduce((sum, item) => 
        sum + (item.currentStock * item.costPerUnit), 0
      );
      
      // Filter low stock items
      this.lowStockItems = items.filter(item => 
        item.currentStock <= item.minStockLevel
      );
    });

    // Load recent movements
    this.inventoryService.getRecentMovements().subscribe(movements => {
      this.recentMovements = movements;
    });
  }

  getStockStatus(item: any): string {
    if (item.currentStock <= item.minStockLevel) {
      return 'Low Stock';
    } else if (item.currentStock >= item.maxStockLevel) {
      return 'Overstocked';
    } else {
      return 'Normal';
    }
  }

  getStockStatusClass(item: any): string {
    const status = this.getStockStatus(item);
    return status.toLowerCase().replace(' ', '-');
  }

  getMovementIcon(type: string): string {
    switch (type) {
      case 'IN': return 'arrow_downward';
      case 'OUT': return 'arrow_upward';
      case 'ADJUSTMENT': return 'tune';
      default: return 'help';
    }
  }

  openAddItemDialog() {
    // Open dialog to add new inventory item
    console.log('Opening add item dialog...');
  }

  openStockUpdateDialog(item: any) {
    // Open dialog to update stock levels
    console.log('Opening stock update dialog for:', item.name);
  }

  viewItemHistory(item: any) {
    // Show item movement history
    console.log('Viewing history for:', item.name);
  }

  quickRestock(item: any) {
    // Quick restock to max level
    const restockQuantity = item.maxStockLevel - item.currentStock;
    console.log(`Restocking ${item.name} with ${restockQuantity} ${item.unit}`);
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR'
    }).format(amount);
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleString();
  }
}
```

---

## 🎯 **IMPLEMENTATION PRIORITY ORDER**

### **Week 1: Critical Fixes & Core Completion**
1. ✅ **TODO 1-3**: Stabilization & Testing (Days 1-2)
2. ✅ **TODO 4-5**: Complete Customer PWA (Days 3-4)

### **Week 2: Choose ONE Advanced Feature**
3. **TODO 6**: Analytics Dashboard (Business Intelligence)
4. **TODO 7**: Payment Integration (Revenue Generation)  
5. **TODO 8**: Inventory Management (Operational Efficiency)

---

## 📋 **EXECUTION CHECKLIST**

### **Before Starting Each TODO:**
- [ ] Mark todo as "in_progress" using todo_write tool
- [ ] Read all related documentation files
- [ ] Test current functionality before making changes
- [ ] Create backup of critical files if needed

### **During Implementation:**
- [ ] Follow exact code examples provided
- [ ] Test each step before moving to next
- [ ] Update documentation as you go
- [ ] Commit changes frequently

### **After Completing Each TODO:**
- [ ] Mark todo as "completed" using todo_write tool
- [ ] Run comprehensive tests
- [ ] Update any related documentation
- [ ] Verify no regressions introduced

---

## 🚀 **SUCCESS METRICS**

### **Priority 1 Success:**
- [ ] All interfaces load without errors
- [ ] Company-scoped filtering works correctly
- [ ] Customer PWA completes full order flow
- [ ] WebSocket updates work in real-time
- [ ] QR code scanning works with camera

### **Priority 2 Success:**
- [ ] Analytics dashboard shows real data
- [ ] Payment processing works end-to-end
- [ ] Inventory tracking is accurate
- [ ] All features integrate seamlessly

---

**This guide provides Cursor with exact, step-by-step instructions to complete the restaurant management system. Each TODO includes specific code examples, file paths, and implementation details for immediate execution.** 🎯
