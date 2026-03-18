# Customer PWA Implementation Script for Cursor
## Complete Step-by-Step Development Guide

---

## 📋 **Project Overview**

**Objective**: Build a standalone Customer PWA application that integrates with the existing restaurant management system, allowing customers to scan QR codes, browse menus, place orders, manage individual bills, and communicate with waiters.

**Technology Stack**:
- **Frontend**: Angular 17+ PWA with Angular Material
- **Backend**: Existing NestJS API (extend with new endpoints)
- **Database**: PostgreSQL with Prisma ORM (extend existing schema)
- **Real-time**: Socket.IO (existing WebSocket infrastructure)
- **Authentication**: JWT tokens for session management
- **QR Code**: ZXing library for QR scanning

---

## 🎯 **Phase 1: Project Setup & Foundation (Week 1)**

### **Step 1: Create Customer PWA Angular Application**

```bash
# Navigate to frontend directory
cd frontend

# Create new Angular application for customer PWA
ng new customer-pwa --routing --style=scss --standalone

# Navigate to customer PWA directory
cd customer-pwa

# Add Angular Material
ng add @angular/material

# Add PWA support
ng add @angular/pwa

# Add QR code scanner library
npm install @zxing/ngx-scanner @zxing/library

# Add Socket.IO client
npm install socket.io-client

# Add HTTP client and forms
# (Already included in Angular, but ensure imports)
```

### **Step 2: Configure PWA Manifest**

**File**: `customer-pwa/src/manifest.webmanifest`

```json
{
  "name": "Restaurant Customer App",
  "short_name": "Restaurant",
  "theme_color": "#1976d2",
  "background_color": "#fafafa",
  "display": "standalone",
  "scope": "./",
  "start_url": "./",
  "icons": [
    {
      "src": "assets/icons/icon-72x72.png",
      "sizes": "72x72",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "assets/icons/icon-96x96.png",
      "sizes": "96x96",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "assets/icons/icon-128x128.png",
      "sizes": "128x128",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "assets/icons/icon-144x144.png",
      "sizes": "144x144",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "assets/icons/icon-152x152.png",
      "sizes": "152x152",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "assets/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "assets/icons/icon-384x384.png",
      "sizes": "384x384",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "assets/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable any"
    }
  ]
}
```

### **Step 3: Configure Service Worker**

**File**: `customer-pwa/src/ngsw-config.json`

```json
{
  "$schema": "./node_modules/@angular/service-worker/config/schema.json",
  "index": "/index.html",
  "assetGroups": [
    {
      "name": "app",
      "installMode": "prefetch",
      "resources": {
        "files": [
          "/favicon.ico",
          "/index.html",
          "/manifest.webmanifest",
          "/*.css",
          "/*.js"
        ]
      }
    },
    {
      "name": "assets",
      "installMode": "lazy",
      "updateMode": "prefetch",
      "resources": {
        "files": [
          "/assets/**",
          "/*.(svg|cur|jpg|jpeg|png|apng|webp|avif|gif|otf|ttf|woff|woff2)"
        ]
      }
    }
  ],
  "dataGroups": [
    {
      "name": "menu-api",
      "urls": ["/api/menu/**"],
      "cacheConfig": {
        "maxSize": 100,
        "maxAge": "1h",
        "timeout": "10s",
        "strategy": "freshness"
      }
    },
    {
      "name": "orders-api",
      "urls": ["/api/orders/**", "/api/customer-orders/**"],
      "cacheConfig": {
        "maxSize": 50,
        "maxAge": "5m",
        "timeout": "5s",
        "strategy": "performance"
      }
    }
  ]
}
```

---

## 🏗️ **Phase 2: Backend Extensions (Week 1-2)**

### **Step 1: Extend Database Schema**

**File**: `backend/prisma/schema.prisma`

Add the following models to your existing schema:

```prisma
// Customer Sessions
model CustomerSession {
  id                  String   @id @default(uuid())
  tableId             String
  customerName        String
  phoneNumber         String?
  dietaryPreferences  String[]
  allergies           String[]
  sessionStart        DateTime @default(now())
  isActive            Boolean  @default(true)
  lastActivity        DateTime @default(now())
  
  table               Table    @relation(fields: [tableId], references: [id])
  orders              CustomerOrder[]
  waiterCalls         WaiterCall[]
  
  @@index([tableId])
  @@index([isActive])
}

// Customer Orders (Individual)
model CustomerOrder {
  id                    String   @id @default(uuid())
  customerSessionId     String
  tableId               String
  status                String   @default("PENDING")
  subtotal              Float
  serviceFee            Float    @default(0)
  serviceFeePercentage  Float    @default(0)
  total                 Float
  paymentStatus         String   @default("PENDING")
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
  
  customerSession       CustomerSession @relation(fields: [customerSessionId], references: [id])
  table                 Table           @relation(fields: [tableId], references: [id])
  items                 CustomerOrderItem[]
  
  @@index([customerSessionId])
  @@index([tableId])
  @@index([status])
}

// Customer Order Items
model CustomerOrderItem {
  id                  String   @id @default(uuid())
  customerOrderId     String
  menuItemId          String
  quantity            Int
  specialInstructions String?
  price               Float
  status              String   @default("PENDING")
  createdAt           DateTime @default(now())
  
  customerOrder       CustomerOrder @relation(fields: [customerOrderId], references: [id])
  menuItem            MenuItem      @relation(fields: [menuItemId], references: [id])
  
  @@index([customerOrderId])
  @@index([menuItemId])
}

// Waiter Calls
model WaiterCall {
  id                  String   @id @default(uuid())
  tableId             String
  customerSessionId   String
  callType            String
  message             String?
  status              String   @default("PENDING")
  createdAt           DateTime @default(now())
  acknowledgedAt      DateTime?
  acknowledgedBy      String?
  resolvedAt          DateTime?
  
  table               Table           @relation(fields: [tableId], references: [id])
  customerSession     CustomerSession @relation(fields: [customerSessionId], references: [id])
  
  @@index([tableId])
  @@index([status])
}

// Table Sessions
model TableSession {
  id            String   @id @default(uuid())
  tableId       String   @unique
  sessionStart  DateTime @default(now())
  lastActivity  DateTime @default(now())
  tableStatus   String   @default("ACTIVE")
  totalRevenue  Float    @default(0)
  
  table         Table    @relation(fields: [tableId], references: [id])
  
  @@index([tableId])
}

// Update existing Table model to add relations
model Table {
  // ... existing fields ...
  customerSessions  CustomerSession[]
  customerOrders    CustomerOrder[]
  waiterCalls       WaiterCall[]
  tableSession      TableSession?
}

// Update existing MenuItem model to add relation
model MenuItem {
  // ... existing fields ...
  customerOrderItems CustomerOrderItem[]
}
```

**Run migration**:
```bash
cd backend
npx prisma migrate dev --name add_customer_pwa_tables
npx prisma generate
```

### **Step 2: Create Backend Modules**

**Create Customer Sessions Module**:

```bash
cd backend/src/modules
nest g module customer-sessions
nest g controller customer-sessions
nest g service customer-sessions
```

**File**: `backend/src/modules/customer-sessions/customer-sessions.service.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CustomerSessionsService {
  constructor(private prisma: PrismaService) {}

  async createSession(data: {
    tableId: string;
    customerName: string;
    phoneNumber?: string;
    dietaryPreferences?: string[];
    allergies?: string[];
  }) {
    return this.prisma.customerSession.create({
      data: {
        ...data,
        isActive: true,
        sessionStart: new Date(),
        lastActivity: new Date(),
      },
      include: {
        table: true,
      },
    });
  }

  async getSession(sessionId: string) {
    return this.prisma.customerSession.findUnique({
      where: { id: sessionId },
      include: {
        table: true,
        orders: {
          include: {
            items: {
              include: {
                menuItem: true,
              },
            },
          },
        },
      },
    });
  }

  async updateActivity(sessionId: string) {
    return this.prisma.customerSession.update({
      where: { id: sessionId },
      data: { lastActivity: new Date() },
    });
  }

  async endSession(sessionId: string) {
    return this.prisma.customerSession.update({
      where: { id: sessionId },
      data: { isActive: false },
    });
  }

  async getActiveSessionsByTable(tableId: string) {
    return this.prisma.customerSession.findMany({
      where: {
        tableId,
        isActive: true,
      },
      include: {
        orders: {
          include: {
            items: {
              include: {
                menuItem: true,
              },
            },
          },
        },
      },
    });
  }
}
```

**File**: `backend/src/modules/customer-sessions/customer-sessions.controller.ts`

```typescript
import { Controller, Post, Get, Put, Param, Body } from '@nestjs/common';
import { CustomerSessionsService } from './customer-sessions.service';

@Controller('customer-sessions')
export class CustomerSessionsController {
  constructor(private readonly sessionService: CustomerSessionsService) {}

  @Post()
  createSession(@Body() data: any) {
    return this.sessionService.createSession(data);
  }

  @Get(':id')
  getSession(@Param('id') id: string) {
    return this.sessionService.getSession(id);
  }

  @Put(':id/activity')
  updateActivity(@Param('id') id: string) {
    return this.sessionService.updateActivity(id);
  }

  @Put(':id/end')
  endSession(@Param('id') id: string) {
    return this.sessionService.endSession(id);
  }

  @Get('table/:tableId')
  getSessionsByTable(@Param('tableId') tableId: string) {
    return this.sessionService.getActiveSessionsByTable(tableId);
  }
}
```

**Create Customer Orders Module**:

```bash
nest g module customer-orders
nest g controller customer-orders
nest g service customer-orders
```

**File**: `backend/src/modules/customer-orders/customer-orders.service.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RestaurantWebSocketGateway } from '../websocket/websocket.gateway';

@Injectable()
export class CustomerOrdersService {
  constructor(
    private prisma: PrismaService,
    private webSocketGateway: RestaurantWebSocketGateway,
  ) {}

  async createOrder(data: {
    customerSessionId: string;
    tableId: string;
    items: Array<{
      menuItemId: string;
      quantity: number;
      specialInstructions?: string;
      price: number;
    }>;
    serviceFeePercentage: number;
  }) {
    const subtotal = data.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );
    const serviceFee = (subtotal * data.serviceFeePercentage) / 100;
    const total = subtotal + serviceFee;

    const order = await this.prisma.customerOrder.create({
      data: {
        customerSessionId: data.customerSessionId,
        tableId: data.tableId,
        subtotal,
        serviceFee,
        serviceFeePercentage: data.serviceFeePercentage,
        total,
        status: 'PENDING',
        items: {
          create: data.items.map((item) => ({
            menuItemId: item.menuItemId,
            quantity: item.quantity,
            specialInstructions: item.specialInstructions,
            price: item.price,
            status: 'PENDING',
          })),
        },
      },
      include: {
        items: {
          include: {
            menuItem: true,
          },
        },
        customerSession: true,
        table: true,
      },
    });

    // Categorize items and emit to kitchen/bar
    const { barItems, kitchenItems } = this.categorizeOrderItems(order.items);

    if (barItems.length > 0) {
      this.webSocketGateway.server.to('bar').emit('order_created_bar', {
        order,
        drinkItems: barItems,
      });
    }

    if (kitchenItems.length > 0) {
      this.webSocketGateway.server.to('kitchen').emit('order_created_kitchen', {
        order,
        foodItems: kitchenItems,
      });
    }

    // Notify waiter
    this.webSocketGateway.server.to('waiter').emit('customer_order_created', {
      order,
      customerName: order.customerSession.customerName,
      tableNumber: order.table.number,
    });

    return order;
  }

  private categorizeOrderItems(items: any[]) {
    const drinkCategories = [
      'beverage',
      'beverages',
      'soft drinks',
      'beer',
      'cocktails',
      'cocktail',
      'wine',
      'wines',
      'beers',
      'whiskeys',
      'vodkas',
      'spirits',
      'tequilas',
      'shots',
      'neat',
      'brandies',
    ];

    const barItems: any[] = [];
    const kitchenItems: any[] = [];

    items.forEach((item) => {
      const category = (item.menuItem?.category || '').toLowerCase();
      const isDrink = drinkCategories.some((drinkCat) =>
        category.includes(drinkCat.toLowerCase()),
      );

      if (isDrink) {
        barItems.push(item);
      } else {
        kitchenItems.push(item);
      }
    });

    return { barItems, kitchenItems };
  }

  async getOrdersBySession(sessionId: string) {
    return this.prisma.customerOrder.findMany({
      where: { customerSessionId: sessionId },
      include: {
        items: {
          include: {
            menuItem: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getOrder(orderId: string) {
    return this.prisma.customerOrder.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            menuItem: true,
          },
        },
        customerSession: true,
        table: true,
      },
    });
  }

  async updateOrderStatus(orderId: string, status: string) {
    const order = await this.prisma.customerOrder.update({
      where: { id: orderId },
      data: { status },
      include: {
        items: {
          include: {
            menuItem: true,
          },
        },
        customerSession: true,
      },
    });

    // Notify customer via WebSocket
    this.webSocketGateway.server
      .to(`customer-${order.customerSessionId}`)
      .emit('order_status_updated', {
        orderId: order.id,
        status: order.status,
        timestamp: new Date(),
      });

    return order;
  }
}
```

**File**: `backend/src/modules/customer-orders/customer-orders.controller.ts`

```typescript
import { Controller, Post, Get, Put, Param, Body } from '@nestjs/common';
import { CustomerOrdersService } from './customer-orders.service';

@Controller('customer-orders')
export class CustomerOrdersController {
  constructor(private readonly orderService: CustomerOrdersService) {}

  @Post()
  createOrder(@Body() data: any) {
    return this.orderService.createOrder(data);
  }

  @Get('session/:sessionId')
  getOrdersBySession(@Param('sessionId') sessionId: string) {
    return this.orderService.getOrdersBySession(sessionId);
  }

  @Get(':id')
  getOrder(@Param('id') id: string) {
    return this.orderService.getOrder(id);
  }

  @Put(':id/status')
  updateOrderStatus(@Param('id') id: string, @Body() data: { status: string }) {
    return this.orderService.updateOrderStatus(id, data.status);
  }
}
```

**Create Waiter Calls Module**:

```bash
nest g module waiter-calls
nest g controller waiter-calls
nest g service waiter-calls
```

**File**: `backend/src/modules/waiter-calls/waiter-calls.service.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RestaurantWebSocketGateway } from '../websocket/websocket.gateway';

@Injectable()
export class WaiterCallsService {
  constructor(
    private prisma: PrismaService,
    private webSocketGateway: RestaurantWebSocketGateway,
  ) {}

  async createCall(data: {
    tableId: string;
    customerSessionId: string;
    callType: string;
    message?: string;
  }) {
    const call = await this.prisma.waiterCall.create({
      data: {
        ...data,
        status: 'PENDING',
      },
      include: {
        table: true,
        customerSession: true,
      },
    });

    // Notify waiter via WebSocket
    this.webSocketGateway.server.to('waiter').emit('waiter_call_created', {
      call,
      customerName: call.customerSession.customerName,
      tableNumber: call.table.number,
    });

    return call;
  }

  async acknowledgeCall(callId: string, acknowledgedBy: string) {
    const call = await this.prisma.waiterCall.update({
      where: { id: callId },
      data: {
        status: 'ACKNOWLEDGED',
        acknowledgedBy,
        acknowledgedAt: new Date(),
      },
      include: {
        customerSession: true,
      },
    });

    // Notify customer
    this.webSocketGateway.server
      .to(`customer-${call.customerSessionId}`)
      .emit('waiter_call_acknowledged', {
        callId: call.id,
        acknowledgedBy: call.acknowledgedBy,
        timestamp: call.acknowledgedAt,
      });

    return call;
  }

  async resolveCall(callId: string) {
    const call = await this.prisma.waiterCall.update({
      where: { id: callId },
      data: {
        status: 'RESOLVED',
        resolvedAt: new Date(),
      },
      include: {
        customerSession: true,
      },
    });

    // Notify customer
    this.webSocketGateway.server
      .to(`customer-${call.customerSessionId}`)
      .emit('waiter_call_resolved', {
        callId: call.id,
        timestamp: call.resolvedAt,
      });

    return call;
  }

  async getCallsByTable(tableId: string) {
    return this.prisma.waiterCall.findMany({
      where: { tableId },
      include: {
        customerSession: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getPendingCalls() {
    return this.prisma.waiterCall.findMany({
      where: { status: 'PENDING' },
      include: {
        table: true,
        customerSession: true,
      },
      orderBy: { createdAt: 'asc' },
    });
  }
}
```

**File**: `backend/src/modules/waiter-calls/waiter-calls.controller.ts`

```typescript
import { Controller, Post, Get, Put, Param, Body } from '@nestjs/common';
import { WaiterCallsService } from './waiter-calls.service';

@Controller('waiter-calls')
export class WaiterCallsController {
  constructor(private readonly callService: WaiterCallsService) {}

  @Post()
  createCall(@Body() data: any) {
    return this.callService.createCall(data);
  }

  @Put(':id/acknowledge')
  acknowledgeCall(@Param('id') id: string, @Body() data: { acknowledgedBy: string }) {
    return this.callService.acknowledgeCall(id, data.acknowledgedBy);
  }

  @Put(':id/resolve')
  resolveCall(@Param('id') id: string) {
    return this.callService.resolveCall(id);
  }

  @Get('table/:tableId')
  getCallsByTable(@Param('tableId') tableId: string) {
    return this.callService.getCallsByTable(tableId);
  }

  @Get('pending')
  getPendingCalls() {
    return this.callService.getPendingCalls();
  }
}
```

---

## 🎨 **Phase 3: Frontend Implementation (Week 2-4)**

### **Step 1: Create Core Services**

**File**: `customer-pwa/src/app/services/api.service.ts`

```typescript
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // Customer Sessions
  createSession(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/customer-sessions`, data);
  }

  getSession(sessionId: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/customer-sessions/${sessionId}`);
  }

  updateActivity(sessionId: string): Observable<any> {
    return this.http.put(`${this.baseUrl}/customer-sessions/${sessionId}/activity`, {});
  }

  endSession(sessionId: string): Observable<any> {
    return this.http.put(`${this.baseUrl}/customer-sessions/${sessionId}/end`, {});
  }

  // Menu
  getMenu(): Observable<any> {
    return this.http.get(`${this.baseUrl}/menu`);
  }

  getMenuItem(itemId: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/menu/${itemId}`);
  }

  // Tables
  validateTable(tableId: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/tables/${tableId}`);
  }

  // Customer Orders
  createOrder(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/customer-orders`, data);
  }

  getOrdersBySession(sessionId: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/customer-orders/session/${sessionId}`);
  }

  getOrder(orderId: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/customer-orders/${orderId}`);
  }

  // Waiter Calls
  createWaiterCall(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/waiter-calls`, data);
  }

  getCallsByTable(tableId: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/waiter-calls/table/${tableId}`);
  }
}
```

**File**: `customer-pwa/src/app/services/websocket.service.ts`

```typescript
import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private socket: Socket;

  constructor() {
    this.socket = io(environment.wsUrl);
  }

  // Join customer room
  joinCustomerRoom(sessionId: string) {
    this.socket.emit('joinRoom', `customer-${sessionId}`);
  }

  // Leave customer room
  leaveCustomerRoom(sessionId: string) {
    this.socket.emit('leaveRoom', `customer-${sessionId}`);
  }

  // Listen for order status updates
  onOrderStatusUpdated(): Observable<any> {
    return new Observable((observer) => {
      this.socket.on('order_status_updated', (data) => {
        observer.next(data);
      });
    });
  }

  // Listen for waiter call acknowledgments
  onWaiterCallAcknowledged(): Observable<any> {
    return new Observable((observer) => {
      this.socket.on('waiter_call_acknowledged', (data) => {
        observer.next(data);
      });
    });
  }

  // Listen for waiter call resolutions
  onWaiterCallResolved(): Observable<any> {
    return new Observable((observer) => {
      this.socket.on('waiter_call_resolved', (data) => {
        observer.next(data);
      });
    });
  }

  // Disconnect
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
    }
  }
}
```

**File**: `customer-pwa/src/app/services/session.service.ts`

```typescript
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

interface CustomerSession {
  id: string;
  tableId: string;
  customerName: string;
  phoneNumber?: string;
  dietaryPreferences?: string[];
  allergies?: string[];
  sessionStart: Date;
  isActive: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class SessionService {
  private sessionSubject = new BehaviorSubject<CustomerSession | null>(null);
  public session$ = this.sessionSubject.asObservable();

  constructor() {
    // Load session from localStorage if exists
    const savedSession = localStorage.getItem('customerSession');
    if (savedSession) {
      this.sessionSubject.next(JSON.parse(savedSession));
    }
  }

  setSession(session: CustomerSession) {
    this.sessionSubject.next(session);
    localStorage.setItem('customerSession', JSON.stringify(session));
  }

  getSession(): CustomerSession | null {
    return this.sessionSubject.value;
  }

  clearSession() {
    this.sessionSubject.next(null);
    localStorage.removeItem('customerSession');
  }

  isSessionActive(): boolean {
    const session = this.getSession();
    return session !== null && session.isActive;
  }
}
```

**File**: `customer-pwa/src/app/services/cart.service.ts`

```typescript
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

interface CartItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  specialInstructions?: string;
  imageUrl?: string;
}

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private cartSubject = new BehaviorSubject<CartItem[]>([]);
  public cart$ = this.cartSubject.asObservable();

  constructor() {
    // Load cart from localStorage if exists
    const savedCart = localStorage.getItem('customerCart');
    if (savedCart) {
      this.cartSubject.next(JSON.parse(savedCart));
    }
  }

  addItem(item: CartItem) {
    const currentCart = this.cartSubject.value;
    const existingItemIndex = currentCart.findIndex(
      (i) => i.menuItemId === item.menuItemId
    );

    if (existingItemIndex !== -1) {
      currentCart[existingItemIndex].quantity += item.quantity;
    } else {
      currentCart.push(item);
    }

    this.updateCart(currentCart);
  }

  removeItem(menuItemId: string) {
    const currentCart = this.cartSubject.value.filter(
      (item) => item.menuItemId !== menuItemId
    );
    this.updateCart(currentCart);
  }

  updateQuantity(menuItemId: string, quantity: number) {
    const currentCart = this.cartSubject.value;
    const itemIndex = currentCart.findIndex((i) => i.menuItemId === menuItemId);

    if (itemIndex !== -1) {
      if (quantity <= 0) {
        this.removeItem(menuItemId);
      } else {
        currentCart[itemIndex].quantity = quantity;
        this.updateCart(currentCart);
      }
    }
  }

  updateSpecialInstructions(menuItemId: string, instructions: string) {
    const currentCart = this.cartSubject.value;
    const itemIndex = currentCart.findIndex((i) => i.menuItemId === menuItemId);

    if (itemIndex !== -1) {
      currentCart[itemIndex].specialInstructions = instructions;
      this.updateCart(currentCart);
    }
  }

  clearCart() {
    this.updateCart([]);
  }

  getCart(): CartItem[] {
    return this.cartSubject.value;
  }

  getSubtotal(): number {
    return this.cartSubject.value.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
  }

  getItemCount(): number {
    return this.cartSubject.value.reduce((sum, item) => sum + item.quantity, 0);
  }

  private updateCart(cart: CartItem[]) {
    this.cartSubject.next(cart);
    localStorage.setItem('customerCart', JSON.stringify(cart));
  }
}
```

### **Step 2: Create Routing Structure**

**File**: `customer-pwa/src/app/app.routes.ts`

```typescript
import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/welcome',
    pathMatch: 'full'
  },
  {
    path: 'welcome',
    loadComponent: () => import('./pages/welcome/welcome.component').then(m => m.WelcomeComponent)
  },
  {
    path: 'scan-table',
    loadComponent: () => import('./pages/scan-table/scan-table.component').then(m => m.ScanTableComponent)
  },
  {
    path: 'register',
    loadComponent: () => import('./pages/register/register.component').then(m => m.RegisterComponent)
  },
  {
    path: 'menu',
    loadComponent: () => import('./pages/menu/menu.component').then(m => m.MenuComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'item/:id',
    loadComponent: () => import('./pages/item-detail/item-detail.component').then(m => m.ItemDetailComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'cart',
    loadComponent: () => import('./pages/cart/cart.component').then(m => m.CartComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'orders',
    loadComponent: () => import('./pages/orders/orders.component').then(m => m.OrdersComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'bill',
    loadComponent: () => import('./pages/bill/bill.component').then(m => m.BillComponent),
    canActivate: [AuthGuard]
  },
  {
    path: '**',
    redirectTo: '/welcome'
  }
];
```

### **Step 3: Create Auth Guard**

**File**: `customer-pwa/src/app/guards/auth.guard.ts`

```typescript
import { Injectable } from '@angular/core';
import { Router, CanActivate } from '@angular/router';
import { SessionService } from '../services/session.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(
    private sessionService: SessionService,
    private router: Router
  ) {}

  canActivate(): boolean {
    if (this.sessionService.isSessionActive()) {
      return true;
    } else {
      this.router.navigate(['/welcome']);
      return false;
    }
  }
}
```

### **Step 4: Create Page Components**

**File**: `customer-pwa/src/app/pages/welcome/welcome.component.ts`

```typescript
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-welcome',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatCardModule, MatIconModule],
  template: `
    <div class="welcome-container">
      <mat-card class="welcome-card">
        <mat-card-header>
          <mat-card-title>Welcome to Our Restaurant</mat-card-title>
          <mat-card-subtitle>Order from your table</mat-card-subtitle>
        </mat-card-header>
        
        <mat-card-content>
          <div class="features">
            <div class="feature">
              <mat-icon>qr_code_scanner</mat-icon>
              <h3>Scan QR Code</h3>
              <p>Scan the QR code on your table to get started</p>
            </div>
            <div class="feature">
              <mat-icon>restaurant_menu</mat-icon>
              <h3>Browse Menu</h3>
              <p>Explore our delicious menu items</p>
            </div>
            <div class="feature">
              <mat-icon>shopping_cart</mat-icon>
              <h3>Order Easily</h3>
              <p>Add items to your cart and place orders</p>
            </div>
          </div>
        </mat-card-content>
        
        <mat-card-actions>
          <button mat-raised-button color="primary" (click)="scanTable()">
            <mat-icon>qr_code_scanner</mat-icon>
            Scan Table QR Code
          </button>
          <button mat-button (click)="enterTableNumber()">
            Enter Table Number
          </button>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: [`
    .welcome-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      padding: 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }

    .welcome-card {
      max-width: 500px;
      width: 100%;
    }

    .features {
      display: grid;
      gap: 20px;
      margin: 20px 0;
    }

    .feature {
      text-align: center;
    }

    .feature mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: #667eea;
    }

    mat-card-actions {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    mat-card-actions button {
      width: 100%;
    }
  `]
})
export class WelcomeComponent {
  constructor(private router: Router) {}

  scanTable() {
    this.router.navigate(['/scan-table']);
  }

  enterTableNumber() {
    this.router.navigate(['/scan-table'], { queryParams: { manual: true } });
  }
}
```

**File**: `customer-pwa/src/app/pages/scan-table/scan-table.component.ts`

```typescript
import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { ZXingScannerModule } from '@zxing/ngx-scanner';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-scan-table',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    ZXingScannerModule
  ],
  template: `
    <div class="scan-container">
      <mat-card *ngIf="!manualEntry">
        <mat-card-header>
          <mat-card-title>Scan Table QR Code</mat-card-title>
        </mat-card-header>
        
        <mat-card-content>
          <zxing-scanner
            [formats]="['QR_CODE']"
            (scanSuccess)="onScanSuccess($event)"
            (scanError)="onScanError($event)"
          ></zxing-scanner>
          
          <p class="scan-hint">Point your camera at the QR code on your table</p>
        </mat-card-content>
        
        <mat-card-actions>
          <button mat-button (click)="switchToManual()">
            Enter Table Number Manually
          </button>
        </mat-card-actions>
      </mat-card>

      <mat-card *ngIf="manualEntry">
        <mat-card-header>
          <mat-card-title>Enter Table Number</mat-card-title>
        </mat-card-header>
        
        <mat-card-content>
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Table Number</mat-label>
            <input matInput type="number" [(ngModel)]="tableNumber" placeholder="Enter table number">
          </mat-form-field>
          
          <p *ngIf="error" class="error">{{ error }}</p>
        </mat-card-content>
        
        <mat-card-actions>
          <button mat-raised-button color="primary" (click)="validateTable()" [disabled]="!tableNumber">
            Continue
          </button>
          <button mat-button (click)="switchToScan()">
            Scan QR Code Instead
          </button>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: [`
    .scan-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      padding: 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }

    mat-card {
      max-width: 500px;
      width: 100%;
    }

    .scan-hint {
      text-align: center;
      margin-top: 20px;
      color: #666;
    }

    .full-width {
      width: 100%;
    }

    .error {
      color: #f44336;
      margin-top: 10px;
    }

    mat-card-actions {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    mat-card-actions button {
      width: 100%;
    }
  `]
})
export class ScanTableComponent implements OnInit {
  manualEntry = false;
  tableNumber: number | null = null;
  error: string | null = null;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private apiService: ApiService
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['manual']) {
        this.manualEntry = true;
      }
    });
  }

  onScanSuccess(result: string) {
    // Extract table ID from QR code
    const tableId = this.extractTableId(result);
    if (tableId) {
      this.validateTableAndProceed(tableId);
    } else {
      this.error = 'Invalid QR code. Please try again.';
    }
  }

  onScanError(error: any) {
    console.error('Scan error:', error);
  }

  switchToManual() {
    this.manualEntry = true;
  }

  switchToScan() {
    this.manualEntry = false;
  }

  validateTable() {
    if (this.tableNumber) {
      this.validateTableAndProceed(this.tableNumber.toString());
    }
  }

  private validateTableAndProceed(tableId: string) {
    this.apiService.validateTable(tableId).subscribe({
      next: (table) => {
        if (table) {
          // Store table ID and proceed to registration
          localStorage.setItem('tableId', tableId);
          this.router.navigate(['/register']);
        } else {
          this.error = 'Table not found. Please check the number.';
        }
      },
      error: (error) => {
        console.error('Table validation error:', error);
        this.error = 'Failed to validate table. Please try again.';
      }
    });
  }

  private extractTableId(qrCode: string): string | null {
    // Implement your QR code parsing logic here
    // For example, if QR code is in format "TABLE-123", extract "123"
    const match = qrCode.match(/TABLE-(\d+)/);
    return match ? match[1] : null;
  }
}
```

**File**: `customer-pwa/src/app/pages/register/register.component.ts`

```typescript
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { ApiService } from '../../services/api.service';
import { SessionService } from '../../services/session.service';
import { WebSocketService } from '../../services/websocket.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
    MatChipsModule,
    MatIconModule
  ],
  template: `
    <div class="register-container">
      <mat-card>
        <mat-card-header>
          <mat-card-title>Welcome!</mat-card-title>
          <mat-card-subtitle>Tell us about yourself</mat-card-subtitle>
        </mat-card-header>
        
        <mat-card-content>
          <form [formGroup]="registerForm">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Your Name</mat-label>
              <input matInput formControlName="customerName" placeholder="Enter your name">
              <mat-error *ngIf="registerForm.get('customerName')?.hasError('required')">
                Name is required
              </mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Phone Number (Optional)</mat-label>
              <input matInput formControlName="phoneNumber" placeholder="Enter your phone number">
            </mat-form-field>

            <div class="dietary-section">
              <h3>Dietary Preferences (Optional)</h3>
              <mat-chip-listbox [(value)]="selectedDietaryPreferences" multiple>
                <mat-chip-option *ngFor="let pref of dietaryOptions" [value]="pref">
                  {{ pref }}
                </mat-chip-option>
              </mat-chip-listbox>
            </div>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Allergies (Optional)</mat-label>
              <textarea matInput formControlName="allergies" placeholder="List any allergies" rows="3"></textarea>
            </mat-form-field>

            <mat-checkbox formControlName="acceptTerms" class="full-width">
              I accept the terms and conditions
            </mat-checkbox>
          </form>

          <p *ngIf="error" class="error">{{ error }}</p>
        </mat-card-content>
        
        <mat-card-actions>
          <button 
            mat-raised-button 
            color="primary" 
            (click)="register()" 
            [disabled]="!registerForm.valid || loading"
          >
            {{ loading ? 'Creating Session...' : 'Start Ordering' }}
          </button>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: [`
    .register-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      padding: 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }

    mat-card {
      max-width: 500px;
      width: 100%;
    }

    .full-width {
      width: 100%;
      margin-bottom: 16px;
    }

    .dietary-section {
      margin-bottom: 20px;
    }

    .dietary-section h3 {
      margin-bottom: 10px;
      font-size: 14px;
      color: #666;
    }

    .error {
      color: #f44336;
      margin-top: 10px;
    }

    mat-card-actions button {
      width: 100%;
    }
  `]
})
export class RegisterComponent implements OnInit {
  registerForm: FormGroup;
  loading = false;
  error: string | null = null;
  tableId: string | null = null;
  selectedDietaryPreferences: string[] = [];
  dietaryOptions = ['Vegetarian', 'Vegan', 'Gluten-Free', 'Dairy-Free', 'Halal', 'Kosher'];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private apiService: ApiService,
    private sessionService: SessionService,
    private webSocketService: WebSocketService
  ) {
    this.registerForm = this.fb.group({
      customerName: ['', Validators.required],
      phoneNumber: [''],
      allergies: [''],
      acceptTerms: [false, Validators.requiredTrue]
    });
  }

  ngOnInit() {
    this.tableId = localStorage.getItem('tableId');
    if (!this.tableId) {
      this.router.navigate(['/scan-table']);
    }
  }

  register() {
    if (this.registerForm.valid && this.tableId) {
      this.loading = true;
      this.error = null;

      const allergiesArray = this.registerForm.value.allergies
        ? this.registerForm.value.allergies.split(',').map((a: string) => a.trim())
        : [];

      const sessionData = {
        tableId: this.tableId,
        customerName: this.registerForm.value.customerName,
        phoneNumber: this.registerForm.value.phoneNumber || undefined,
        dietaryPreferences: this.selectedDietaryPreferences,
        allergies: allergiesArray
      };

      this.apiService.createSession(sessionData).subscribe({
        next: (session) => {
          // Store session
          this.sessionService.setSession(session);
          
          // Join WebSocket room
          this.webSocketService.joinCustomerRoom(session.id);
          
          // Navigate to menu
          this.router.navigate(['/menu']);
        },
        error: (error) => {
          console.error('Registration error:', error);
          this.error = 'Failed to create session. Please try again.';
          this.loading = false;
        }
      });
    }
  }
}
```

**Continue with Menu, Cart, Orders, and Bill components following similar patterns...**

---

## 📱 **Phase 4: UI/UX Implementation (Week 3-4)**

### **Key UI Components to Implement:**

1. **Menu Component**: Category filtering, search, item grid/list
2. **Item Detail Component**: Image, description, quantity selector, special instructions
3. **Cart Component**: Item list, quantity controls, subtotal, service fee selector
4. **Orders Component**: Order history, status tracking, reorder functionality
5. **Bill Component**: Itemized bill, service fee management, payment status

### **Material Design Components to Use:**
- `MatCard` for content containers
- `MatButton` for actions
- `MatFormField` and `MatInput` for forms
- `MatChip` for categories and filters
- `MatBadge` for cart item count
- `MatBottomSheet` for quick actions
- `MatSnackBar` for notifications
- `MatDialog` for confirmations

---

## 🚀 **Phase 5: Testing & Deployment (Week 5)**

### **Testing Checklist:**
- [ ] QR code scanning works on different devices
- [ ] Manual table number entry works
- [ ] Session persistence across page refreshes
- [ ] Cart persists across sessions
- [ ] Orders are correctly routed to kitchen/bar
- [ ] Real-time updates work via WebSocket
- [ ] Waiter calls are received and acknowledged
- [ ] Offline mode works for menu browsing
- [ ] Service worker caches menu data
- [ ] PWA can be installed on mobile devices

### **Deployment Steps:**

1. **Build Production PWA**:
```bash
cd customer-pwa
ng build --configuration production
```

2. **Deploy Frontend**:
- Deploy to Vercel, Netlify, or Firebase Hosting
- Configure custom domain
- Enable HTTPS

3. **Deploy Backend**:
- Ensure all new endpoints are deployed
- Run database migrations
- Test WebSocket connections

4. **Generate QR Codes**:
- Create QR codes for each table
- Format: `https://your-domain.com/scan-table?table=TABLE_ID`
- Print and place on tables

---

## 📊 **Success Metrics to Track:**

- Session creation rate
- Order completion rate
- Average order value
- Cart abandonment rate
- Waiter call response time
- Customer satisfaction ratings
- Feature adoption rates
- PWA installation rate

---

## 🔧 **Environment Configuration:**

**File**: `customer-pwa/src/environments/environment.ts`

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api',
  wsUrl: 'http://localhost:3000'
};
```

**File**: `customer-pwa/src/environments/environment.prod.ts`

```typescript
export const environment = {
  production: true,
  apiUrl: 'https://your-api-domain.com/api',
  wsUrl: 'https://your-api-domain.com'
};
```

---

## 📝 **Next Steps After Base Implementation:**

1. **Add Advanced Features** (from Enhanced User Stories):
   - Popularity indicators
   - Spice level indicators
   - Order history and favorites
   - Bill splitting
   - Payment integration

2. **Optimize Performance**:
   - Implement lazy loading for images
   - Add progressive loading for menu
   - Optimize bundle size
   - Improve offline capabilities

3. **Enhance UX**:
   - Add animations and transitions
   - Implement haptic feedback
   - Add voice search
   - Improve accessibility

4. **Add Analytics**:
   - Track user behavior
   - Monitor feature usage
   - Analyze order patterns
   - Generate insights

---

This comprehensive implementation script provides everything needed to build the base Customer PWA that integrates seamlessly with your existing restaurant management system. Follow the phases sequentially for best results.
