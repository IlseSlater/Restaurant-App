# Customer PWA Implementation Guide

## ✅ **Phase 2 Completed: Backend Extensions**

The backend has been successfully extended with Customer PWA functionality.

### **What's Been Implemented:**

#### **1. Database Schema Extensions**
- ✅ `CustomerSession` - Track individual customer sessions at tables
- ✅ `CustomerOrder` - Individual customer orders with service fees
- ✅ `CustomerOrderItem` - Order line items with special instructions
- ✅ `WaiterCall` - Customer-to-waiter communication system
- ✅ `TableSession` - Table-level session management

#### **2. Backend Modules Created**
- ✅ **Customer Sessions Module** (`backend/src/modules/customer-sessions/`)
  - Create and manage customer sessions
  - Track dietary preferences and allergies
  - Session activity tracking
  
- ✅ **Customer Orders Module** (`backend/src/modules/customer-orders/`)
  - Create orders with service fee calculation
  - Automatic routing to kitchen/bar based on item category
  - Real-time order status updates via WebSocket
  
- ✅ **Waiter Calls Module** (`backend/src/modules/waiter-calls/`)
  - Create waiter call requests
  - Acknowledge and resolve calls
  - Real-time notifications to waiters and customers

#### **3. API Endpoints Available**

**Customer Sessions:**
- `POST /customer-sessions` - Create new customer session
- `GET /customer-sessions/:id` - Get session details
- `PUT /customer-sessions/:id/activity` - Update session activity
- `PUT /customer-sessions/:id/end` - End customer session
- `GET /customer-sessions/table/:tableId` - Get all sessions for a table

**Customer Orders:**
- `POST /customer-orders` - Create new order
- `GET /customer-orders/session/:sessionId` - Get orders by session
- `GET /customer-orders/:id` - Get order details
- `PUT /customer-orders/:id/status` - Update order status

**Waiter Calls:**
- `POST /waiter-calls` - Create waiter call
- `PUT /waiter-calls/:id/acknowledge` - Acknowledge call
- `PUT /waiter-calls/:id/resolve` - Resolve call
- `GET /waiter-calls/table/:tableId` - Get calls by table
- `GET /waiter-calls/pending` - Get all pending calls

---

## 🚀 **Next Steps: Run Database Migration**

### **Option 1: Using PowerShell Script (Recommended for Windows)**

```powershell
# Run the migration script
.\run-migration.ps1
```

### **Option 2: Manual Commands**

```powershell
# Navigate to backend directory
cd backend

# Run Prisma migration
npx prisma migrate dev --name add_customer_pwa_tables

# Generate Prisma client
npx prisma generate

# Return to root
cd ..
```

---

## 📱 **Phase 3: Frontend Implementation (Next)**

After running the migration, we'll implement the frontend Customer PWA with:

### **Services to Create:**
1. **API Service** - HTTP communication with backend
2. **WebSocket Service** - Real-time updates
3. **Session Service** - Customer session management
4. **Cart Service** - Shopping cart functionality

### **Components to Create:**
1. **Welcome Component** - Landing page with QR scan option
2. **Scan Table Component** - QR scanner + manual table entry
3. **Register Component** - Customer registration
4. **Menu Component** - Browse menu with categories
5. **Item Detail Component** - View item details and add to cart
6. **Cart Component** - Review cart and place order
7. **Orders Component** - View order history and status
8. **Bill Component** - View bill and manage service fees

### **Features:**
- ✅ QR code scanning for table identification
- ✅ Customer registration with dietary preferences
- ✅ Real-time menu browsing
- ✅ Shopping cart with localStorage persistence
- ✅ Order placement with kitchen/bar routing
- ✅ Real-time order status updates
- ✅ Waiter call system
- ✅ Individual billing with service fee management
- ✅ PWA with offline support

---

## 🔧 **Development Workflow**

### **1. Start Backend Server**

```powershell
cd backend
npm run start:dev
```

### **2. Start Frontend Server**

```powershell
cd frontend
npm start
```

### **3. Access Applications**

- **Admin Dashboard**: http://localhost:4200
- **Kitchen Dashboard**: http://localhost:4200/kitchen
- **Bar Dashboard**: http://localhost:4200/bar
- **Waiter Dashboard**: http://localhost:4200/waiter
- **Customer PWA**: http://localhost:4200/customer (to be implemented)

---

## 📊 **Database Schema Overview**

### **Customer Session Flow:**
1. Customer scans QR code or enters table number
2. `CustomerSession` created with customer details
3. Customer browses menu and adds items to cart
4. `CustomerOrder` created with `CustomerOrderItems`
5. Order routed to kitchen/bar based on item categories
6. Customer can create `WaiterCall` for assistance
7. Order status updates sent via WebSocket
8. Customer views bill and manages service fees

### **Multi-User Support:**
- Multiple customers can have active sessions at the same table
- Each customer has independent orders and billing
- `TableSession` tracks overall table activity

---

## 🎯 **WebSocket Events**

### **Events Emitted by Backend:**

**To Bar:**
- `order_created_bar` - New drink order

**To Kitchen:**
- `order_created_kitchen` - New food order

**To Waiter:**
- `customer_order_created` - New customer order
- `waiter_call_created` - Customer calling for assistance

**To Customer (specific session):**
- `order_status_updated` - Order status changed
- `waiter_call_acknowledged` - Waiter acknowledged call
- `waiter_call_resolved` - Call resolved

---

## 🔐 **Security Considerations**

- Customer sessions use unique IDs for identification
- No authentication required for customer PWA (table-based access)
- Session activity tracked for timeout management
- WebSocket rooms ensure customers only receive their own updates

---

## 📝 **Testing the Backend**

### **Test Customer Session Creation:**

```bash
curl -X POST http://localhost:3000/customer-sessions \
  -H "Content-Type: application/json" \
  -d '{
    "tableId": "YOUR_TABLE_ID",
    "customerName": "John Doe",
    "phoneNumber": "+27123456789",
    "dietaryPreferences": ["Vegetarian"],
    "allergies": ["Peanuts"]
  }'
```

### **Test Order Creation:**

```bash
curl -X POST http://localhost:3000/customer-orders \
  -H "Content-Type: application/json" \
  -d '{
    "customerSessionId": "YOUR_SESSION_ID",
    "tableId": "YOUR_TABLE_ID",
    "serviceFeePercentage": 15,
    "items": [
      {
        "menuItemId": "YOUR_MENU_ITEM_ID",
        "quantity": 2,
        "price": 55.00,
        "specialInstructions": "No onions please"
      }
    ]
  }'
```

### **Test Waiter Call:**

```bash
curl -X POST http://localhost:3000/waiter-calls \
  -H "Content-Type: application/json" \
  -d '{
    "tableId": "YOUR_TABLE_ID",
    "customerSessionId": "YOUR_SESSION_ID",
    "callType": "ASSISTANCE",
    "message": "Need help with menu"
  }'
```

---

## 🐛 **Troubleshooting**

### **Migration Errors:**
- Ensure PostgreSQL is running
- Check DATABASE_URL in `.env` file
- Verify no existing tables conflict with new schema

### **Module Import Errors:**
- Run `npm install` in backend directory
- Ensure all dependencies are installed
- Check TypeScript compilation errors

### **WebSocket Connection Issues:**
- Verify WebSocket gateway is properly configured
- Check CORS settings in `main.ts`
- Ensure Socket.IO versions match between frontend and backend

---

## 📚 **Resources**

- [Prisma Documentation](https://www.prisma.io/docs/)
- [NestJS Documentation](https://docs.nestjs.com/)
- [Socket.IO Documentation](https://socket.io/docs/)
- [Angular PWA Guide](https://angular.io/guide/service-worker-intro)

---

## ✅ **Implementation Checklist**

### **Phase 2: Backend (COMPLETED)**
- [x] Extend Prisma schema with Customer PWA tables
- [x] Create Customer Sessions module
- [x] Create Customer Orders module
- [x] Create Waiter Calls module
- [x] Update app.module.ts with new modules
- [x] Add WebSocket event handling

### **Phase 3: Frontend (NEXT)**
- [ ] Create customer PWA services
- [ ] Create customer PWA components
- [ ] Implement QR code scanning
- [ ] Implement shopping cart
- [ ] Implement order placement
- [ ] Implement waiter call system
- [ ] Add PWA configuration
- [ ] Add offline support

### **Phase 4: UI/UX**
- [ ] Implement Material Design components
- [ ] Add responsive mobile design
- [ ] Add loading states and animations
- [ ] Implement error handling
- [ ] Add success notifications

### **Phase 5: Testing & Deployment**
- [ ] Test QR code scanning
- [ ] Test order flow
- [ ] Test WebSocket connections
- [ ] Test offline functionality
- [ ] Deploy to production

---

**Ready to proceed with Phase 3: Frontend Implementation!**
