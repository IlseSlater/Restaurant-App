# Customer PWA User Story & System Architecture
## Restaurant Ordering System

---

## 📋 **Executive Summary**

This document outlines the comprehensive user story and technical architecture for developing a Customer Progressive Web Application (PWA) that integrates with the existing restaurant management system. The PWA will enable customers to place individual orders, manage personal bills, and communicate with waiters through a modern, mobile-first interface.

---

## 🎯 **Core User Story**

### **Primary User Story**
**As a customer at a restaurant table, I want to:**
- Access the ordering system via QR code or table number
- Register my identity for personalized service
- Browse categorized menu with real-time availability
- Build my personal order with add/remove functionality
- Manage my individual bill with service fee options
- Call for waiter assistance when needed
- Share the table experience with other diners while maintaining separate orders

### **Business Value**
- **Enhanced Customer Experience**: Self-service ordering reduces wait times
- **Increased Revenue**: Service fee options and easier upselling
- **Operational Efficiency**: Reduced waiter workload for order-taking
- **Data Insights**: Better understanding of customer preferences and ordering patterns

---

## 🏗️ **System Architecture Overview**

### **Frontend Structure**
```
Customer PWA (Standalone)
├── Authentication Module
│   ├── QR Code Scanner
│   ├── Table Number Entry
│   └── Customer Registration
├── Menu & Ordering Module
│   ├── Category Filtering
│   ├── Search Functionality
│   ├── Item Management
│   └── Special Instructions
├── Billing & Payment Module
│   ├── Individual Bill Calculation
│   ├── Service Fee Management
│   ├── Tax Calculations
│   └── Receipt Generation
├── Waiter Communication Module
│   ├── Bell System
│   ├── Call Types
│   └── Message System
└── Real-time Sync Module
    ├── WebSocket Integration
    ├── Order Status Updates
    └── Menu Availability
```

### **Backend Integration**
```
Existing Restaurant System
├── Table Management
│   ├── QR Code Generation
│   ├── Table Status Tracking
│   └── Session Management
├── Menu Management
│   ├── Category Organization
│   ├── Real-time Availability
│   └── Item Details
├── Order Processing
│   ├── Kitchen/Bar Routing
│   ├── Status Updates
│   └── Special Instructions
├── Waiter Notifications
│   ├── Bell System Integration
│   ├── Call Management
│   └── Response Tracking
└── Billing System
    ├── Individual Bills
    ├── Service Fee Calculation
    └── Payment Integration
```

---

## 📱 **Detailed User Journey**

### **Phase 1: Table Access & Registration**

#### **Step 1: Table Access**
**User Story**: As a customer, I want to easily access the ordering system when I sit down at my table.

**Acceptance Criteria**:
- Customer can scan QR code on table to access system
- Fallback option to manually enter table number
- System validates table exists and is available
- Unique session ID is generated for this customer
- Error handling for invalid QR codes or table numbers

**Technical Implementation**:
```typescript
interface TableAccess {
  method: 'QR_SCAN' | 'MANUAL_ENTRY';
  tableId: string;
  qrCode?: string;
  validationStatus: 'VALID' | 'INVALID' | 'OCCUPIED';
  sessionId: string;
}
```

#### **Step 2: Customer Registration**
**User Story**: As a customer, I want to provide my name and preferences to personalize my dining experience.

**Acceptance Criteria**:
- Customer name is required field
- Optional phone number for notifications
- Optional dietary preferences/allergies
- Terms and conditions acceptance
- Session persistence throughout dining experience

**Registration Form Fields**:
- Customer Name (required)
- Phone Number (optional)
- Dietary Preferences (optional)
- Allergies (optional)
- Terms Acceptance (required)

**Data Model**:
```typescript
interface CustomerSession {
  id: string;
  tableId: string;
  customerName: string;
  phoneNumber?: string;
  dietaryPreferences?: string[];
  allergies?: string[];
  sessionStartTime: Date;
  isActive: boolean;
  orderId?: string;
}
```

### **Phase 2: Menu Browsing & Ordering**

#### **Menu Structure & Navigation**
**User Story**: As a customer, I want to easily browse the menu by categories and find items that meet my preferences.

**Acceptance Criteria**:
- Menu organized by categories (All, Appetizers, Main Courses, Desserts, Beverages)
- Search functionality by name, ingredients, dietary preferences
- Real-time availability indicators
- Detailed item information including allergens and preparation time
- High-quality food photography

**Menu Data Structure**:
```typescript
interface MenuCategory {
  id: string;
  name: string;
  displayOrder: number;
  items: MenuItem[];
}

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl?: string;
  isAvailable: boolean;
  preparationTime: number; // minutes
  allergens?: string[];
  dietaryTags?: string[]; // vegetarian, vegan, gluten-free
  ingredients?: string[];
  calories?: number;
}
```

#### **Ordering Interface**
**User Story**: As a customer, I want to easily add items to my order, modify quantities, and add special instructions.

**Acceptance Criteria**:
- Tap item to add to personal cart
- Quantity control with +/- buttons
- Special instructions text field
- Remove items with swipe or trash icon
- Real-time order summary and total calculation
- Order persistence across session

**Order Management Features**:
- **Add to Order**: Single tap to add item
- **Quantity Control**: Intuitive +/- interface
- **Special Instructions**: Free text field for modifications
- **Remove Items**: Swipe gesture or dedicated remove button
- **Order Summary**: Live updating cart with totals
- **Order History**: View previous orders in session

**Order Data Model**:
```typescript
interface CustomerOrderItem {
  id: string;
  menuItemId: string;
  quantity: number;
  specialInstructions?: string;
  price: number;
  addedAt: Date;
  status: 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'SERVED';
}
```

### **Phase 3: Individual Billing System**

#### **Personal Bill Management**
**User Story**: As a customer, I want to see my individual bill, add service fees, and understand exactly what I'm paying for.

**Acceptance Criteria**:
- Real-time bill updates as items are added/removed
- Clear breakdown of subtotal, service fee, and total
- Service fee options with percentage or custom amount
- Itemized receipt with all details
- Service fee toggle for easy on/off
- Currency formatting in South African Rand (ZAR)

**Bill Features**:
- **Real-time Updates**: Total updates as items are added/removed
- **Itemized Receipt**: Detailed breakdown of all items
- **Service Fee Management**: Multiple percentage options + custom amount
- **Fee Breakdown**: Clear display of subtotal + service fee = total
- **Receipt Generation**: Printable/downloadable receipt

**Billing Data Model**:
```typescript
interface CustomerBill {
  customerId: string;
  tableId: string;
  orderItems: CustomerOrderItem[];
  subtotal: number;
  serviceFee: number;
  serviceFeePercentage: number;
  total: number;
  taxAmount: number;
  paymentStatus: 'PENDING' | 'PAID' | 'SPLIT';
  createdAt: Date;
  updatedAt: Date;
}
```

#### **Service Fee System**
**Service Fee Options**:
- **Default Percentages**: 10%, 15%, 18%, 20%
- **Custom Amount**: Manual entry option
- **No Service Fee**: Option to remove service fee
- **Fee Calculator**: Real-time total updates
- **Fee Breakdown**: Clear display of subtotal + service fee = total

### **Phase 4: Waiter Communication System**

#### **Waiter Bell Feature**
**User Story**: As a customer, I want to easily call for waiter assistance when I need help with my order, bill, or have questions.

**Acceptance Criteria**:
- Prominent bell button always visible
- Multiple call types for different needs
- Custom message option for specific requests
- Confirmation that call was sent
- Real-time status updates on call acknowledgment

**Call Types**:
- **General Assistance**: "Need help with menu"
- **Bill Request**: "Ready to pay"
- **Order Help**: "Have questions about my order"
- **Custom Message**: Free text field for specific requests

**Waiter Call Data Model**:
```typescript
interface WaiterCall {
  id: string;
  tableId: string;
  customerName: string;
  customerId: string;
  callType: 'ASSISTANCE' | 'BILL' | 'ORDER_HELP' | 'OTHER';
  message?: string;
  timestamp: Date;
  status: 'PENDING' | 'ACKNOWLEDGED' | 'RESOLVED';
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  resolvedAt?: Date;
}
```

#### **Waiter Notification System**
**Integration Requirements**:
- **Real-time Alerts**: WebSocket notifications to waiter dashboard
- **Table Display**: Shows customer name and table number
- **Call History**: Track all calls for service quality
- **Acknowledgment System**: Waiter can acknowledge calls
- **Priority System**: Different urgency levels for different call types

---

## 🔄 **Multi-User Table Management**

### **Table Session Management**
**User Story**: As multiple customers at the same table, we want to each manage our own orders while sharing the table experience.

**Acceptance Criteria**:
- Each customer has independent order and billing
- All customers see table status and shared information
- Individual orders don't interfere with each other
- Table coordination for shared items (future feature)
- Independent payment processing

**Table Session Data Model**:
```typescript
interface TableSession {
  tableId: string;
  customers: CustomerSession[];
  sharedItems?: SharedOrderItem[];
  tableStatus: 'ACTIVE' | 'CLOSED' | 'PAYMENT_PENDING';
  sessionStartTime: Date;
  lastActivity: Date;
  totalTableRevenue: number;
}
```

### **Individual vs Shared Orders**
- **Individual Orders**: Each customer manages their own order independently
- **Shared Items**: Optional shared appetizers, drinks (future enhancement)
- **Independent Billing**: Each customer pays their own bill separately
- **Table Coordination**: All customers see table status and shared information

---

## 🛠️ **Technical Implementation Plan**

### **Phase 1: Customer PWA Setup (Weeks 1-2)**

#### **Sprint 1.1: Foundation**
- [ ] Create standalone Angular PWA application
- [ ] Implement PWA manifest and service worker
- [ ] Set up offline capability for menu browsing
- [ ] Create responsive design for mobile/tablet
- [ ] Implement basic routing and navigation

#### **Sprint 1.2: Authentication System**
- [ ] QR code scanner integration using ZXing library
- [ ] Table number validation system
- [ ] Customer session management
- [ ] JWT token implementation for API access
- [ ] Session persistence and recovery

### **Phase 2: Menu Integration (Weeks 3-4)**

#### **Sprint 2.1: Menu API Integration**
- [ ] Connect to existing menu service
- [ ] Implement real-time availability updates
- [ ] Create category filtering and search functionality
- [ ] Set up image optimization and CDN integration
- [ ] Implement offline menu caching

#### **Sprint 2.2: Order Management**
- [ ] Individual order creation system
- [ ] Real-time order status updates via WebSocket
- [ ] Special instructions handling
- [ ] Order modification capabilities
- [ ] Order persistence and recovery

### **Phase 3: Billing System (Weeks 5-6)**

#### **Sprint 3.1: Individual Billing**
- [ ] Personal bill calculation engine
- [ ] Service fee management system
- [ ] Tax calculations integration
- [ ] Real-time bill updates
- [ ] Currency formatting (ZAR)

#### **Sprint 3.2: Bill Management**
- [ ] Individual bill display interface
- [ ] Service fee customization options
- [ ] Receipt generation and display
- [ ] Payment status tracking
- [ ] Bill sharing capabilities (future)

### **Phase 4: Waiter Communication (Weeks 7-8)**

#### **Sprint 4.1: Bell System**
- [ ] Call creation and management system
- [ ] Real-time notification system
- [ ] Waiter acknowledgment system
- [ ] Call history and analytics
- [ ] Message customization options

#### **Sprint 4.2: Integration**
- [ ] Waiter dashboard integration
- [ ] Table status updates
- [ ] Order routing to kitchen/bar
- [ ] Real-time synchronization
- [ ] Performance optimization

### **Phase 5: Integration & Testing (Weeks 9-10)**

#### **Sprint 5.1: Full Integration**
- [ ] Complete system integration testing
- [ ] Real-time synchronization testing
- [ ] Performance optimization
- [ ] Security testing and validation
- [ ] Cross-browser compatibility testing

#### **Sprint 5.2: User Acceptance Testing**
- [ ] End-to-end user journey testing
- [ ] Multi-user table scenario testing
- [ ] Waiter workflow testing
- [ ] Performance under load testing
- [ ] Bug fixes and refinements

---

## 📊 **Database Schema Extensions**

### **New Tables Required**

#### **Customer Sessions Table**
```sql
CREATE TABLE customer_sessions (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    table_id TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    phone_number TEXT,
    dietary_preferences TEXT[],
    allergies TEXT[],
    session_start TIMESTAMP DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    last_activity TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (table_id) REFERENCES tables(id)
);
```

#### **Customer Orders Table**
```sql
CREATE TABLE customer_orders (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    customer_session_id TEXT NOT NULL,
    table_id TEXT NOT NULL,
    status TEXT DEFAULT 'PENDING',
    subtotal DECIMAL(10,2) NOT NULL,
    service_fee DECIMAL(10,2) DEFAULT 0,
    service_fee_percentage DECIMAL(5,2) DEFAULT 0,
    total DECIMAL(10,2) NOT NULL,
    payment_status TEXT DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (customer_session_id) REFERENCES customer_sessions(id),
    FOREIGN KEY (table_id) REFERENCES tables(id)
);
```

#### **Customer Order Items Table**
```sql
CREATE TABLE customer_order_items (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    customer_order_id TEXT NOT NULL,
    menu_item_id TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    special_instructions TEXT,
    price DECIMAL(10,2) NOT NULL,
    status TEXT DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (customer_order_id) REFERENCES customer_orders(id),
    FOREIGN KEY (menu_item_id) REFERENCES menu_items(id)
);
```

#### **Waiter Calls Table**
```sql
CREATE TABLE waiter_calls (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    table_id TEXT NOT NULL,
    customer_session_id TEXT NOT NULL,
    call_type TEXT NOT NULL,
    message TEXT,
    status TEXT DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT NOW(),
    acknowledged_at TIMESTAMP,
    acknowledged_by TEXT,
    resolved_at TIMESTAMP,
    FOREIGN KEY (table_id) REFERENCES tables(id),
    FOREIGN KEY (customer_session_id) REFERENCES customer_sessions(id)
);
```

#### **Table Sessions Table**
```sql
CREATE TABLE table_sessions (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    table_id TEXT NOT NULL UNIQUE,
    session_start TIMESTAMP DEFAULT NOW(),
    last_activity TIMESTAMP DEFAULT NOW(),
    table_status TEXT DEFAULT 'ACTIVE',
    total_revenue DECIMAL(10,2) DEFAULT 0,
    FOREIGN KEY (table_id) REFERENCES tables(id)
);
```

---

## 🎯 **Success Metrics & KPIs**

### **Customer Experience Metrics**
- **Order Accuracy**: Target 95%+ orders without modifications
- **Service Speed**: 30% faster order processing compared to traditional ordering
- **Customer Satisfaction**: 4.5+ star rating in customer feedback
- **Waiter Efficiency**: 40% reduction in table visits for order-taking
- **Session Duration**: Average session time and engagement metrics

### **Business Impact Metrics**
- **Revenue Increase**: 15-20% increase from service fees and upselling
- **Order Volume**: 25% increase in orders per table
- **Staff Efficiency**: 30% reduction in order-taking time
- **Customer Retention**: 20% increase in repeat visits
- **Table Turnover**: Improved table turnover rates

### **Technical Performance Metrics**
- **Page Load Time**: < 3 seconds for initial load
- **Offline Capability**: 100% menu availability offline
- **Real-time Updates**: < 1 second latency for order status updates
- **Uptime**: 99.9% system availability
- **Mobile Performance**: 90+ Lighthouse score for mobile

---

## 🔧 **Technical Considerations**

### **Performance Optimization**
- **Offline Capability**: Complete menu available offline with service worker
- **Real-time Updates**: WebSocket implementation for live data synchronization
- **Image Optimization**: Lazy loading, compression, and CDN integration
- **Caching Strategy**: Aggressive caching for menu data and static assets
- **Bundle Optimization**: Code splitting and tree shaking for optimal bundle size

### **Security Implementation**
- **Session Management**: Secure customer session handling with JWT tokens
- **Data Privacy**: GDPR compliance for customer data collection and storage
- **Payment Security**: PCI compliance preparation for future payment integration
- **API Security**: Rate limiting, authentication, and input validation
- **Data Encryption**: End-to-end encryption for sensitive customer data

### **Scalability Planning**
- **Multi-tenant Architecture**: Support for multiple restaurant locations
- **Load Balancing**: Handle peak dining hours and concurrent users
- **Database Optimization**: Efficient queries, indexing, and connection pooling
- **CDN Integration**: Fast image and asset delivery globally
- **Microservices**: Modular architecture for independent scaling

### **Accessibility & Usability**
- **WCAG Compliance**: Meet accessibility standards for all users
- **Mobile-First Design**: Optimized for smartphone and tablet usage
- **Intuitive Navigation**: Simple, clear user interface design
- **Error Handling**: Comprehensive error messages and recovery options
- **Multi-language Support**: Future support for multiple languages

---

## 🚀 **Deployment Strategy**

### **Development Environment**
- **Local Development**: Docker containers for consistent development environment
- **API Mocking**: Mock services for frontend development
- **Testing Framework**: Unit, integration, and e2e testing setup
- **Code Quality**: ESLint, Prettier, and automated code review

### **Staging Environment**
- **Integration Testing**: Full system integration testing
- **Performance Testing**: Load testing and performance optimization
- **User Acceptance Testing**: Stakeholder testing and feedback collection
- **Security Testing**: Penetration testing and vulnerability assessment

### **Production Deployment**
- **Blue-Green Deployment**: Zero-downtime deployment strategy
- **Monitoring**: Comprehensive application and infrastructure monitoring
- **Backup Strategy**: Regular database backups and disaster recovery
- **Rollback Plan**: Quick rollback capability for production issues

---

## 📈 **Future Enhancements**

### **Phase 2 Features (Future Releases)**
- **Payment Integration**: Credit card and mobile payment processing
- **Loyalty Program**: Customer rewards and points system
- **Social Features**: Share orders and recommendations
- **AI Recommendations**: Personalized menu suggestions
- **Multi-language Support**: Support for multiple languages

### **Advanced Features**
- **Voice Ordering**: Voice-activated ordering system
- **AR Menu**: Augmented reality menu visualization
- **Predictive Ordering**: AI-powered order suggestions
- **Social Dining**: Group ordering and bill splitting
- **Analytics Dashboard**: Customer behavior analytics

---

## 📋 **Risk Assessment & Mitigation**

### **Technical Risks**
- **WebSocket Reliability**: Implement fallback to polling for real-time updates
- **Offline Synchronization**: Robust conflict resolution for offline/online sync
- **Performance Issues**: Comprehensive performance monitoring and optimization
- **Security Vulnerabilities**: Regular security audits and penetration testing

### **Business Risks**
- **User Adoption**: Comprehensive user training and support materials
- **Staff Resistance**: Change management and staff training programs
- **Technical Support**: 24/7 support system for customer issues
- **Data Privacy**: Compliance with local and international privacy laws

### **Mitigation Strategies**
- **Phased Rollout**: Gradual deployment to minimize risk
- **Comprehensive Testing**: Extensive testing at each phase
- **Backup Systems**: Fallback to traditional ordering methods
- **Training Programs**: Staff and customer training initiatives

---

## 📞 **Support & Maintenance**

### **Support Structure**
- **Level 1 Support**: Basic customer support and issue triage
- **Level 2 Support**: Technical issue resolution and escalation
- **Level 3 Support**: Development team for complex issues
- **Emergency Support**: 24/7 support for critical issues

### **Maintenance Schedule**
- **Daily Monitoring**: System health and performance monitoring
- **Weekly Updates**: Security patches and minor updates
- **Monthly Releases**: Feature updates and improvements
- **Quarterly Reviews**: Performance analysis and optimization

---

## 📝 **Conclusion**

This comprehensive Customer PWA system will revolutionize the restaurant dining experience by providing customers with a modern, intuitive ordering platform while maintaining seamless integration with the existing restaurant management system. The multi-user, individual billing approach offers flexibility while preserving the collaborative table experience.

The phased implementation approach ensures manageable development cycles while delivering value incrementally. The system's architecture supports future enhancements and scalability, positioning the restaurant for continued growth and innovation.

**Key Success Factors:**
- User-centered design approach
- Robust technical architecture
- Comprehensive testing strategy
- Strong change management
- Continuous monitoring and optimization

**Expected Outcomes:**
- Enhanced customer experience
- Increased operational efficiency
- Higher revenue generation
- Improved staff productivity
- Better customer insights and analytics

---

*Document Version: 1.0*  
*Last Updated: [Current Date]*  
*Prepared by: Development Team*  
*Review Date: [Next Review Date]*
