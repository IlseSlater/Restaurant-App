# Multi-Restaurant GUID-Based System - Detailed User Story

## 📋 **Project Overview**

**Project Name:** Restaurant App Multi-Tenant SaaS Platform  
**Version:** 2.0  
**Date:** December 2024  
**Architecture:** GUID-Based Company Isolation System  

---

## 🎯 **Executive Summary**

The Restaurant App will evolve from a single-restaurant system to a multi-tenant SaaS platform where each restaurant operates independently using unique Company GUIDs. This enables multiple restaurants to use the same application while maintaining complete data isolation and personalized branding.

---

## 👥 **User Personas**

### **Primary Users:**
1. **Restaurant Owner/Manager** - Sets up company profile and manages operations
2. **Kitchen Staff** - Prepares food orders for their specific restaurant
3. **Bar Staff** - Manages drink orders for their specific restaurant
4. **Waiters** - Serves customers and manages table service
5. **Customers** - Orders food and drinks via QR code scanning
6. **System Administrator** - Manages the multi-tenant platform

### **Secondary Users:**
1. **Franchise Manager** - Oversees multiple restaurant locations
2. **Regional Manager** - Manages restaurants in specific regions
3. **Support Staff** - Provides technical support to restaurants

---

## 🏢 **Company GUID System Architecture**

### **Core Concept:**
Each restaurant/company receives a unique GUID (Globally Unique Identifier) that serves as the universal identifier across all system components. This GUID ensures complete data isolation and enables seamless multi-tenant operations.

### **GUID Format:**
```
Format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
Example: 550e8400-e29b-41d4-a716-446655440000
```

### **System Components Using GUID:**
- **Admin Dashboard** - Company management and settings
- **Kitchen Interface** - Food order preparation
- **Bar Interface** - Drink order management
- **Waiter Interface** - Table service management
- **Customer PWA** - Mobile ordering interface
- **WebSocket Rooms** - Real-time communication
- **Database Records** - All data scoped by company GUID

---

## 📱 **User Stories by Persona**

## **1. Restaurant Owner/Manager Stories**

### **Story 1.1: Company Profile Setup**
**As a** restaurant owner  
**I want to** create and configure my restaurant's company profile  
**So that** I can establish my brand identity and operational settings  

**Acceptance Criteria:**
- [ ] Can create a new company profile with unique GUID
- [ ] Can set company name, logo, and branding colors
- [ ] Can configure contact information (address, phone, email)
- [ ] Can set timezone and currency preferences
- [ ] Can upload company logo for branding
- [ ] Can set primary and secondary brand colors
- [ ] Can activate/deactivate company profile
- [ ] System generates unique GUID automatically
- [ ] Can preview how branding will appear to customers

**Technical Requirements:**
- Company GUID generated using UUID v4
- Logo upload with image optimization
- Color picker for brand customization
- Form validation for required fields
- Preview functionality for branding

### **Story 1.2: QR Code Generation**
**As a** restaurant owner  
**I want to** generate branded QR codes for each table  
**So that** customers can easily access my restaurant's ordering system  

**Acceptance Criteria:**
- [ ] Can generate QR codes for all tables
- [ ] QR codes contain company GUID and table number
- [ ] QR codes include company branding (logo, colors)
- [ ] Can download individual QR codes or batch download
- [ ] QR codes are print-ready with proper sizing
- [ ] Table number is clearly visible on QR code
- [ ] Company name appears on QR code
- [ ] Can regenerate QR codes if needed
- [ ] QR codes work offline after initial scan

**Technical Requirements:**
- QR code generation using company GUID + table number
- PDF generation for printing
- High-resolution output for clear scanning
- Batch processing for multiple tables
- Download functionality for individual/bulk QR codes

### **Story 1.3: Table Management**
**As a** restaurant owner  
**I want to** manage tables specific to my restaurant  
**So that** I can organize my dining area and assign waiters  

**Acceptance Criteria:**
- [ ] Can create/edit/delete tables for my company
- [ ] Each table has unique number within my company
- [ ] Can assign waiters to specific tables
- [ ] Can set table status (available, occupied, reserved)
- [ ] Can generate QR codes for new tables
- [ ] Can view table layout and status
- [ ] Can manage table capacity and seating
- [ ] Can set table-specific notes or special instructions

**Technical Requirements:**
- Table records scoped by company GUID
- Waiter assignment functionality
- Status management system
- QR code integration per table

---

## **2. Kitchen Staff Stories**

### **Story 2.1: Company-Scoped Order Management**
**As a** kitchen staff member  
**I want to** see only food orders from my restaurant  
**So that** I can focus on preparing orders for my location  

**Acceptance Criteria:**
- [ ] Only see orders from my company GUID
- [ ] Orders display company branding and colors
- [ ] Can filter orders by status (pending, preparing, ready)
- [ ] Can update order status for my company only
- [ ] Real-time updates only from my restaurant
- [ ] Can view order details with company context
- [ ] Can mark individual items as ready
- [ ] Can communicate with waiters from same company

**Technical Requirements:**
- WebSocket rooms scoped by company GUID
- Order filtering by company ID
- Real-time updates per company
- Status update APIs scoped by company

### **Story 2.2: Company-Specific Menu Management**
**As a** kitchen staff member  
**I want to** see only menu items from my restaurant  
**So that** I can prepare the correct items for my location  

**Acceptance Criteria:**
- [ ] Only see menu items from my company
- [ ] Menu items display with company branding
- [ ] Can view item preparation instructions
- [ ] Can see item availability status
- [ ] Can update item availability
- [ ] Can view item categories specific to my restaurant
- [ ] Can see preparation times for items

**Technical Requirements:**
- Menu items scoped by company GUID
- Availability management per company
- Category filtering by company
- Preparation time tracking

---

## **3. Bar Staff Stories**

### **Story 3.1: Company-Scoped Drink Orders**
**As a** bar staff member  
**I want to** manage drink orders only from my restaurant  
**So that** I can prepare beverages for my location's customers  

**Acceptance Criteria:**
- [ ] Only see drink orders from my company GUID
- [ ] Orders display with company branding
- [ ] Can filter by drink categories (beer, wine, cocktails)
- [ ] Can update drink order status
- [ ] Can see special drink instructions
- [ ] Can manage drink inventory for my company
- [ ] Can communicate with waiters from same company
- [ ] Can view drink preparation times

**Technical Requirements:**
- Drink orders scoped by company GUID
- Category filtering by company
- Inventory management per company
- Real-time communication per company

---

## **4. Waiter Stories**

### **Story 4.1: Company-Specific Table Service**
**As a** waiter  
**I want to** manage tables and orders only from my restaurant  
**So that** I can provide service to customers at my location  

**Acceptance Criteria:**
- [ ] Only see tables assigned to my company
- [ ] Can view table status and customer information
- [ ] Can manage orders for my company's tables
- [ ] Can update order status (served, collected)
- [ ] Can communicate with kitchen/bar from same company
- [ ] Can view customer session information
- [ ] Can manage waiter calls from customers
- [ ] Can see company-specific branding in interface

**Technical Requirements:**
- Table management scoped by company GUID
- Order management per company
- Waiter call system per company
- Customer session management per company

---

## **5. Customer Stories**

### **Story 5.1: QR Code Scanning and Company Loading**
**As a** customer  
**I want to** scan a QR code and automatically load the correct restaurant  
**So that** I can order from the right location without confusion  

**Acceptance Criteria:**
- [ ] QR code scan loads correct restaurant automatically
- [ ] Restaurant branding appears immediately (colors, logo, name)
- [ ] Table number is pre-filled from QR code
- [ ] Can see restaurant-specific menu items
- [ ] Can place orders for the correct restaurant
- [ ] Can view order status in real-time
- [ ] Can call waiter for the correct restaurant
- [ ] Can view bill for the correct restaurant

**Technical Requirements:**
- QR code contains company GUID + table number
- Company context loading from GUID
- Branding application based on company settings
- Real-time updates scoped by company GUID

### **Story 5.2: Restaurant-Specific Ordering**
**As a** customer  
**I want to** order food and drinks specific to the restaurant I'm at  
**So that** I receive the correct items from the right location  

**Acceptance Criteria:**
- [ ] Menu items are specific to scanned restaurant
- [ ] Prices are correct for the restaurant
- [ ] Can add items to cart for the restaurant
- [ ] Can view order status specific to restaurant
- [ ] Can modify orders for the restaurant
- [ ] Can view bill with restaurant branding
- [ ] Can pay for orders at the restaurant
- [ ] Can receive real-time updates from restaurant

**Technical Requirements:**
- Menu items scoped by company GUID
- Order management per company
- Real-time updates per company
- Payment processing per company

### **Story 5.3: Multi-Restaurant Support**
**As a** customer  
**I want to** visit different restaurants using the same app  
**So that** I can order from multiple locations seamlessly  

**Acceptance Criteria:**
- [ ] Can scan QR codes from different restaurants
- [ ] App switches context between restaurants
- [ ] Previous restaurant data is preserved
- [ ] Can view order history per restaurant
- [ ] Can have active sessions at multiple restaurants
- [ ] Can switch between restaurant contexts
- [ ] Can see different branding per restaurant

**Technical Requirements:**
- Multi-company context management
- Session management per company
- Order history scoped by company
- Context switching functionality

---

## **6. System Administrator Stories**

### **Story 6.1: Multi-Tenant Platform Management**
**As a** system administrator  
**I want to** manage multiple restaurants on the platform  
**So that** I can provide SaaS services to restaurant clients  

**Acceptance Criteria:**
- [ ] Can view all companies on the platform
- [ ] Can create new company profiles
- [ ] Can manage company subscriptions and billing
- [ ] Can monitor system usage per company
- [ ] Can provide technical support to companies
- [ ] Can manage platform-wide settings
- [ ] Can view analytics across all companies
- [ ] Can manage user access per company

**Technical Requirements:**
- Multi-tenant dashboard
- Company management system
- Billing and subscription management
- Analytics aggregation
- User access control per company

---

## 🔧 **Technical Implementation Stories**

### **Story T.1: Database Schema Migration**
**As a** developer  
**I want to** migrate the existing single-tenant database to multi-tenant  
**So that** the system can support multiple restaurants  

**Acceptance Criteria:**
- [ ] Create Company model with GUID primary key
- [ ] Add companyId foreign key to all existing models
- [ ] Migrate existing data to default company
- [ ] Ensure data integrity during migration
- [ ] Create database indexes for company-scoped queries
- [ ] Implement data isolation constraints
- [ ] Create migration scripts for production deployment
- [ ] Test migration with existing data

**Technical Requirements:**
- Prisma schema updates
- Database migration scripts
- Data integrity validation
- Index optimization for company queries

### **Story T.2: Company Context Service**
**As a** developer  
**I want to** create a service to manage company context  
**So that** all components can access company information consistently  

**Acceptance Criteria:**
- [ ] Service manages current company state
- [ ] Service handles company switching
- [ ] Service applies company branding
- [ ] Service provides company-scoped API calls
- [ ] Service manages company persistence
- [ ] Service handles company validation
- [ ] Service provides company context to components
- [ ] Service manages company-specific settings

**Technical Requirements:**
- Angular service implementation
- State management with RxJS
- Local storage integration
- API service integration
- Branding application system

### **Story T.3: WebSocket Room Management**
**As a** developer  
**I want to** implement company-scoped WebSocket rooms  
**So that** real-time communication is isolated per restaurant  

**Acceptance Criteria:**
- [ ] WebSocket rooms scoped by company GUID
- [ ] Kitchen rooms per company
- [ ] Bar rooms per company
- [ ] Waiter rooms per company
- [ ] Customer rooms per company
- [ ] Admin rooms per company
- [ ] Room joining/leaving per company
- [ ] Message broadcasting per company

**Technical Requirements:**
- Socket.IO room management
- Company GUID-based room naming
- Room isolation and security
- Message routing per company

### **Story T.4: QR Code Generation System**
**As a** developer  
**I want to** create a system to generate branded QR codes  
**So that** restaurants can create table-specific QR codes  

**Acceptance Criteria:**
- [ ] QR code generation with company GUID
- [ ] QR code branding with company logo
- [ ] QR code layout with table number
- [ ] PDF generation for printing
- [ ] Batch QR code generation
- [ ] QR code validation and testing
- [ ] Download functionality
- [ ] QR code regeneration capability

**Technical Requirements:**
- QR code generation library
- PDF generation system
- Image processing for branding
- Batch processing functionality
- Download and file management

---

## 📊 **Success Metrics**

### **Business Metrics:**
- **Number of Active Companies:** Track restaurants using the platform
- **Revenue per Company:** Monitor SaaS subscription revenue
- **Customer Orders per Company:** Measure platform usage
- **Company Retention Rate:** Track restaurant satisfaction
- **Platform Uptime:** Ensure system reliability

### **Technical Metrics:**
- **Data Isolation:** Ensure complete separation between companies
- **Performance:** Maintain response times with multiple companies
- **Scalability:** Support growing number of restaurants
- **Security:** Prevent cross-company data access
- **Real-time Performance:** WebSocket communication efficiency

### **User Experience Metrics:**
- **QR Code Scan Success Rate:** Measure QR code effectiveness
- **Customer Order Completion Rate:** Track ordering success
- **Staff Efficiency:** Measure kitchen/bar/waiter productivity
- **Brand Consistency:** Ensure proper branding application
- **Multi-Restaurant Usage:** Track customers using multiple restaurants

---

## 🚀 **Implementation Roadmap**

### **Phase 1: Foundation (Weeks 1-2)**
- Database schema design and migration
- Company model implementation
- Basic company context service
- GUID generation system

### **Phase 2: Core Features (Weeks 3-4)**
- Company profile management
- QR code generation system
- Company-scoped API updates
- Basic multi-tenant functionality

### **Phase 3: User Interfaces (Weeks 5-6)**
- Admin company management interface
- Customer PWA company loading
- Staff interfaces company scoping
- Branding application system

### **Phase 4: Advanced Features (Weeks 7-8)**
- WebSocket room management
- Multi-restaurant customer support
- Analytics and reporting
- Performance optimization

### **Phase 5: Testing & Deployment (Weeks 9-10)**
- Comprehensive testing
- Migration testing
- Performance testing
- Production deployment

---

## 🔒 **Security Considerations**

### **Data Isolation:**
- Complete separation of company data
- GUID-based access control
- API endpoint security per company
- WebSocket room isolation

### **Access Control:**
- User authentication per company
- Role-based permissions per company
- Admin access control
- Cross-company access prevention

### **Privacy:**
- Customer data isolation per company
- Order history privacy per company
- Payment data separation
- Analytics data anonymization

---

## 📈 **Future Enhancements**

### **Advanced Features:**
- **Franchise Management:** Support for restaurant chains
- **Regional Management:** Multi-location restaurant support
- **White-label Solutions:** Custom branding per company
- **API Access:** Third-party integrations per company
- **Advanced Analytics:** Cross-company insights
- **Mobile Apps:** Native apps per company
- **Integration Hub:** Third-party service connections

### **Business Model Extensions:**
- **Subscription Tiers:** Different feature levels
- **Usage-based Pricing:** Pay per order/transaction
- **Enterprise Solutions:** Custom implementations
- **Marketplace:** Third-party app integrations
- **Franchise Licensing:** Revenue sharing models

---

## 📝 **Conclusion**

The GUID-based multi-restaurant system transforms the Restaurant App from a single-tenant application to a robust, scalable SaaS platform. This architecture enables unlimited restaurants to operate independently while sharing the same application infrastructure, creating a powerful and flexible solution for the restaurant industry.

The system ensures complete data isolation, personalized branding, and seamless user experiences across all touchpoints, making it an ideal solution for restaurants of all sizes, from independent establishments to large franchise chains.

---

**Document Version:** 1.0  
**Last Updated:** December 2024  
**Next Review:** January 2025
