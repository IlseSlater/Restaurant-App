# Cursor Implementation Prompt: Multi-Restaurant GUID-Based System

## 🎯 **Project Overview**

Implement a multi-tenant SaaS restaurant management system using GUID-based company isolation. Transform the existing single-restaurant app into a scalable platform where multiple restaurants can operate independently with complete data isolation.

## 📋 **Implementation Requirements**

### **Core Architecture Principles:**
- **Multi-Tenant SaaS Architecture** with GUID-based isolation
- **Domain-Driven Design (DDD)** with clear bounded contexts
- **Clean Architecture** with separation of concerns
- **Event-Driven Architecture** for real-time updates
- **Microservices-Ready** design patterns
- **Security-First** approach with data isolation

### **Technology Stack:**
- **Backend:** Node.js + NestJS + TypeScript + Prisma + PostgreSQL
- **Frontend:** Angular 17+ + TypeScript + Material Design
- **Real-time:** Socket.IO with company-scoped rooms
- **Authentication:** JWT with company context
- **Caching:** Redis for session management
- **File Storage:** AWS S3 or local storage for QR codes

---

## 🏗️ **Phase 1: Database & Backend Foundation**

### **1.1 Database Schema Design**

**Create comprehensive Prisma schema with company GUID isolation:**

```prisma
// Core Company Model
model Company {
  id          String   @id @default(uuid()) // Company GUID
  name        String
  slug        String   @unique
  logo        String?
  primaryColor String?
  secondaryColor String?
  address     String?
  phone       String?
  email       String?
  website     String?
  timezone    String   @default("UTC")
  currency    String   @default("ZAR")
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // Relations
  tables      Table[]
  menuItems   MenuItem[]
  orders      Order[]
  users       User[]
  customerSessions CustomerSession[]
  customerOrders   CustomerOrder[]
  waiterCalls      WaiterCall[]
  
  @@map("companies")
}

// Updated Models with Company GUID
model Table {
  id        String @id @default(uuid())
  companyId String
  number    Int
  qrCode    String @unique
  status    String @default("AVAILABLE")
  waiterId  String?
  
  company   Company @relation(fields: [companyId], references: [id])
  orders    Order[]
  customerSessions CustomerSession[]
  
  @@unique([companyId, number])
  @@map("tables")
}

model MenuItem {
  id        String @id @default(uuid())
  companyId String
  name      String
  description String?
  price     Decimal
  category  String
  isAvailable Boolean @default(true)
  imageUrl  String?
  preparationTime Int? // minutes
  
  company   Company @relation(fields: [companyId], references: [id])
  
  @@map("menu_items")
}

// Add companyId to all existing models
model Order {
  id        String @id @default(uuid())
  companyId String
  tableId   String
  // ... existing fields
  
  company   Company @relation(fields: [companyId], references: [id])
  // ... existing relations
}

model User {
  id        String @id @default(uuid())
  companyId String
  // ... existing fields
  
  company   Company @relation(fields: [companyId], references: [id])
  // ... existing relations
}
```

**Migration Strategy:**
1. Create Company model with default company
2. Add companyId to all existing models
3. Migrate existing data to default company
4. Create database indexes for company-scoped queries
5. Implement data isolation constraints

### **1.2 Backend API Architecture**

**Create company-scoped API endpoints:**

```typescript
// Company Management Module
@Controller('companies')
export class CompaniesController {
  @Get(':companyId')
  async getCompany(@Param('companyId') companyId: string) {
    // Get company profile
  }

  @Put(':companyId')
  async updateCompany(@Param('companyId') companyId: string, @Body() data: UpdateCompanyDto) {
    // Update company profile
  }

  @Post(':companyId/qr-codes/generate')
  async generateQRCodes(@Param('companyId') companyId: string, @Body() data: GenerateQRDto) {
    // Generate QR codes for tables
  }
}

// Company-Scoped Controllers
@Controller('companies/:companyId/tables')
export class TablesController {
  @Get()
  async getTables(@Param('companyId') companyId: string) {
    // Get tables for specific company
  }

  @Post()
  async createTable(@Param('companyId') companyId: string, @Body() data: CreateTableDto) {
    // Create table for specific company
  }
}

@Controller('companies/:companyId/menu')
export class MenuController {
  @Get()
  async getMenu(@Param('companyId') companyId: string) {
    // Get menu items for specific company
  }
}

@Controller('companies/:companyId/orders')
export class OrdersController {
  @Get()
  async getOrders(@Param('companyId') companyId: string) {
    // Get orders for specific company
  }
}
```

**Implement Company Context Guard:**
```typescript
@Injectable()
export class CompanyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const companyId = request.params.companyId;
    
    // Validate company exists and user has access
    return this.validateCompanyAccess(companyId, request.user);
  }
}
```

### **1.3 WebSocket Room Management**

**Implement company-scoped WebSocket rooms:**

```typescript
@WebSocketGateway()
export class CompanyWebSocketGateway {
  @WebSocketServer()
  server: Server;

  // Company-scoped room management
  joinCompanyRoom(client: Socket, companyId: string, roomType: string) {
    const roomName = `${roomType}-${companyId}`;
    client.join(roomName);
  }

  // Emit to company-specific rooms
  emitToCompany(companyId: string, roomType: string, event: string, data: any) {
    const roomName = `${roomType}-${companyId}`;
    this.server.to(roomName).emit(event, data);
  }

  // Kitchen updates for specific company
  @SubscribeMessage('kitchen-update')
  handleKitchenUpdate(client: Socket, payload: { companyId: string, orderId: string, status: string }) {
    this.emitToCompany(payload.companyId, 'kitchen', 'order-status-updated', payload);
  }
}
```

---

## 🎨 **Phase 2: Frontend Architecture & Services**

### **2.1 Company Context Service**

**Create comprehensive company management service:**

```typescript
@Injectable({
  providedIn: 'root'
})
export class CompanyContextService {
  private currentCompanySubject = new BehaviorSubject<Company | null>(null);
  public currentCompany$ = this.currentCompanySubject.asObservable();

  private companyIdSubject = new BehaviorSubject<string | null>(null);
  public companyId$ = this.companyIdSubject.asObservable();

  constructor(
    private apiService: ApiService,
    private router: Router
  ) {}

  // Load company from GUID
  async loadCompany(companyGuid: string): Promise<Company> {
    try {
      const company = await this.apiService.getCompany(companyGuid).toPromise();
      this.setCurrentCompany(company);
      this.applyCompanyBranding(company);
      return company;
    } catch (error) {
      throw new Error(`Company not found: ${companyGuid}`);
    }
  }

  // Set current company context
  setCurrentCompany(company: Company) {
    this.currentCompanySubject.next(company);
    this.companyIdSubject.next(company.id);
    localStorage.setItem('currentCompany', JSON.stringify(company));
  }

  // Apply company branding to DOM
  applyCompanyBranding(company: Company) {
    if (company.primaryColor) {
      document.documentElement.style.setProperty('--primary-color', company.primaryColor);
    }
    if (company.secondaryColor) {
      document.documentElement.style.setProperty('--secondary-color', company.secondaryColor);
    }
    if (company.logo) {
      document.documentElement.style.setProperty('--company-logo', `url(${company.logo})`);
    }
  }

  // Get company-scoped API calls
  getCompanyScopedUrl(endpoint: string): string {
    const companyId = this.getCurrentCompanyId();
    if (!companyId) throw new Error('No company context');
    return `/api/companies/${companyId}/${endpoint}`;
  }

  // Clear company context
  clearCompany() {
    this.currentCompanySubject.next(null);
    this.companyIdSubject.next(null);
    localStorage.removeItem('currentCompany');
  }
}
```

### **2.2 Company-Scoped API Service**

**Extend API service for company context:**

```typescript
@Injectable({
  providedIn: 'root'
})
export class CompanyApiService {
  constructor(
    private http: HttpClient,
    private companyContext: CompanyContextService
  ) {}

  // Company-scoped API calls
  getCompanyTables(): Observable<Table[]> {
    const url = this.companyContext.getCompanyScopedUrl('tables');
    return this.http.get<Table[]>(url);
  }

  getCompanyMenu(): Observable<MenuItem[]> {
    const url = this.companyContext.getCompanyScopedUrl('menu');
    return this.http.get<MenuItem[]>(url);
  }

  getCompanyOrders(): Observable<Order[]> {
    const url = this.companyContext.getCompanyScopedUrl('orders');
    return this.http.get<Order[]>(url);
  }

  // Company management
  getCompany(companyId: string): Observable<Company> {
    return this.http.get<Company>(`/api/companies/${companyId}`);
  }

  updateCompany(companyId: string, data: any): Observable<Company> {
    return this.http.put<Company>(`/api/companies/${companyId}`, data);
  }

  generateQRCodes(companyId: string, tableIds: string[]): Observable<Blob> {
    return this.http.post(`/api/companies/${companyId}/qr-codes/generate`, 
      { tableIds }, 
      { responseType: 'blob' }
    );
  }
}
```

### **2.3 Company-Scoped WebSocket Service**

**Implement company-aware WebSocket communication:**

```typescript
@Injectable({
  providedIn: 'root'
})
export class CompanyWebSocketService {
  private socket: Socket;
  private companyId: string | null = null;

  constructor(
    private companyContext: CompanyContextService
  ) {
    this.companyContext.companyId$.subscribe(companyId => {
      this.companyId = companyId;
      if (companyId) {
        this.joinCompanyRooms(companyId);
      }
    });
  }

  // Join company-specific rooms
  private joinCompanyRooms(companyId: string) {
    if (this.socket) {
      this.socket.emit('join-company-rooms', {
        companyId,
        rooms: ['kitchen', 'bar', 'waiter', 'customer', 'admin']
      });
    }
  }

  // Company-scoped event listeners
  onCompanyOrderUpdate(companyId: string, callback: (data: any) => void) {
    this.socket.on(`order-update-${companyId}`, callback);
  }

  onCompanyWaiterCall(companyId: string, callback: (data: any) => void) {
    this.socket.on(`waiter-call-${companyId}`, callback);
  }

  // Emit company-scoped events
  emitCompanyEvent(companyId: string, event: string, data: any) {
    this.socket.emit(event, { companyId, ...data });
  }
}
```

---

## 📱 **Phase 3: Customer PWA Implementation**

### **3.1 QR Code Scanning & Company Loading**

**Update scan-table component for company context:**

```typescript
@Component({
  selector: 'app-scan-table',
  templateUrl: './scan-table.component.html',
  styleUrls: ['./scan-table.component.scss']
})
export class ScanTableComponent implements OnInit {
  company: Company | null = null;
  companyId: string | null = null;
  tableNumber: number | null = null;
  loading = false;
  error: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private companyContext: CompanyContextService,
    private apiService: CompanyApiService
  ) {}

  ngOnInit() {
    // Extract company GUID from URL
    this.route.queryParams.subscribe(params => {
      const companyGuid = params['company'];
      const tableNumber = params['table'];

      if (companyGuid) {
        this.loadCompanyContext(companyGuid);
        
        if (tableNumber) {
          this.tableNumber = parseInt(tableNumber);
          this.validateTable();
        }
      } else {
        this.router.navigate(['/customer/welcome']);
      }
    });
  }

  async loadCompanyContext(companyGuid: string) {
    this.loading = true;
    this.error = null;

    try {
      // Load company context
      this.company = await this.companyContext.loadCompany(companyGuid);
      this.companyId = this.company.id;
      
      // Apply company branding
      this.companyContext.applyCompanyBranding(this.company);
      
      // Load company-specific data
      await this.loadCompanyData();
      
    } catch (error) {
      this.error = 'Restaurant not found. Please check your QR code.';
      console.error('Company loading error:', error);
    } finally {
      this.loading = false;
    }
  }

  async loadCompanyData() {
    if (!this.companyId) return;

    try {
      // Load company-specific tables and menu
      const [tables, menu] = await Promise.all([
        this.apiService.getCompanyTables().toPromise(),
        this.apiService.getCompanyMenu().toPromise()
      ]);

      // Store company data
      localStorage.setItem('companyTables', JSON.stringify(tables));
      localStorage.setItem('companyMenu', JSON.stringify(menu));
      
    } catch (error) {
      console.error('Error loading company data:', error);
    }
  }

  validateTable() {
    if (!this.tableNumber || !this.companyId) return;

    // Validate table exists for this company
    const tables = JSON.parse(localStorage.getItem('companyTables') || '[]');
    const table = tables.find((t: Table) => t.number === this.tableNumber);
    
    if (table) {
      // Store table context
      localStorage.setItem('customerTableId', table.id);
      localStorage.setItem('customerTableNumber', table.number.toString());
      localStorage.setItem('customerCompanyId', this.companyId);
      
      // Navigate to registration
      this.router.navigate(['/customer/register']);
    } else {
      this.error = `Table ${this.tableNumber} not found for this restaurant.`;
    }
  }
}
```

### **3.2 Company-Aware Menu Component**

**Update menu component for company context:**

```typescript
@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.scss']
})
export class MenuComponent implements OnInit {
  company: Company | null = null;
  menuItems: MenuItem[] = [];
  categories: string[] = [];
  selectedCategory = 'All';
  loading = false;

  constructor(
    private companyContext: CompanyContextService,
    private apiService: CompanyApiService,
    private cartService: CustomerCartService
  ) {}

  ngOnInit() {
    // Get company context
    this.company = this.companyContext.getCurrentCompany();
    
    if (!this.company) {
      this.router.navigate(['/customer/welcome']);
      return;
    }

    this.loadMenu();
  }

  async loadMenu() {
    this.loading = true;
    
    try {
      // Load company-specific menu
      this.menuItems = await this.apiService.getCompanyMenu().toPromise();
      
      // Extract categories
      this.categories = ['All', ...new Set(this.menuItems.map(item => item.category))];
      
    } catch (error) {
      console.error('Error loading menu:', error);
    } finally {
      this.loading = false;
    }
  }

  get filteredMenuItems(): MenuItem[] {
    if (this.selectedCategory === 'All') {
      return this.menuItems;
    }
    return this.menuItems.filter(item => item.category === this.selectedCategory);
  }

  addToCart(item: MenuItem) {
    this.cartService.addItem({
      menuItemId: item.id,
      name: item.name,
      price: item.price,
      quantity: 1,
      companyId: this.company!.id
    });
  }

  getItemQuantity(itemId: string): number {
    return this.cartService.getItemQuantity(itemId);
  }
}
```

---

## 🎨 **Phase 4: Admin Dashboard Implementation**

### **4.1 Company Management Interface**

**Create comprehensive company management:**

```typescript
@Component({
  selector: 'app-company-management',
  templateUrl: './company-management.component.html',
  styleUrls: ['./company-management.component.scss']
})
export class CompanyManagementComponent implements OnInit {
  companies: Company[] = [];
  selectedCompany: Company | null = null;
  loading = false;
  error: string | null = null;

  // Company form
  companyForm = this.fb.group({
    name: ['', Validators.required],
    slug: ['', Validators.required],
    primaryColor: ['#1976d2'],
    secondaryColor: ['#dc004e'],
    address: [''],
    phone: [''],
    email: ['', Validators.email],
    website: [''],
    timezone: ['UTC'],
    currency: ['ZAR']
  });

  constructor(
    private fb: FormBuilder,
    private apiService: CompanyApiService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.loadCompanies();
  }

  async loadCompanies() {
    this.loading = true;
    try {
      this.companies = await this.apiService.getAllCompanies().toPromise();
    } catch (error) {
      this.error = 'Failed to load companies';
    } finally {
      this.loading = false;
    }
  }

  async createCompany() {
    if (this.companyForm.valid) {
      this.loading = true;
      try {
        const companyData = this.companyForm.value;
        const newCompany = await this.apiService.createCompany(companyData).toPromise();
        
        this.companies.push(newCompany);
        this.snackBar.open('Company created successfully', 'Close', { duration: 3000 });
        this.companyForm.reset();
        
      } catch (error) {
        this.error = 'Failed to create company';
      } finally {
        this.loading = false;
      }
    }
  }

  async updateCompany(company: Company) {
    this.loading = true;
    try {
      const updatedCompany = await this.apiService.updateCompany(company.id, company).toPromise();
      
      const index = this.companies.findIndex(c => c.id === company.id);
      if (index !== -1) {
        this.companies[index] = updatedCompany;
      }
      
      this.snackBar.open('Company updated successfully', 'Close', { duration: 3000 });
      
    } catch (error) {
      this.error = 'Failed to update company';
    } finally {
      this.loading = false;
    }
  }
}
```

### **4.2 QR Code Generation Interface**

**Create QR code generation and management:**

```typescript
@Component({
  selector: 'app-qr-code-generator',
  templateUrl: './qr-code-generator.component.html',
  styleUrls: ['./qr-code-generator.component.scss']
})
export class QRCodeGeneratorComponent implements OnInit {
  selectedCompany: Company | null = null;
  tables: Table[] = [];
  selectedTables: Table[] = [];
  qrCodes: QRCodeData[] = [];
  generating = false;

  constructor(
    private apiService: CompanyApiService,
    private qrCodeService: QRCodeService
  ) {}

  ngOnInit() {
    this.loadCompanies();
  }

  async onCompanySelected(company: Company) {
    this.selectedCompany = company;
    await this.loadCompanyTables();
  }

  async loadCompanyTables() {
    if (!this.selectedCompany) return;

    try {
      this.tables = await this.apiService.getCompanyTables().toPromise();
    } catch (error) {
      console.error('Error loading tables:', error);
    }
  }

  async generateQRCodes() {
    if (!this.selectedCompany || this.selectedTables.length === 0) return;

    this.generating = true;
    try {
      const tableIds = this.selectedTables.map(table => table.id);
      const qrCodeBlob = await this.apiService.generateQRCodes(this.selectedCompany.id, tableIds).toPromise();
      
      // Process QR codes
      this.qrCodes = await this.processQRCodes(qrCodeBlob);
      
    } catch (error) {
      console.error('Error generating QR codes:', error);
    } finally {
      this.generating = false;
    }
  }

  async processQRCodes(blob: Blob): Promise<QRCodeData[]> {
    // Process QR code blob and return structured data
    return this.qrCodeService.processQRCodeBlob(blob);
  }

  downloadQRCode(qrCode: QRCodeData) {
    this.qrCodeService.downloadQRCode(qrCode);
  }

  downloadAllQRCodes() {
    this.qrCodeService.downloadAllQRCodes(this.qrCodes);
  }
}
```

---

## 🎨 **Phase 5: UI/UX Design Implementation**

### **5.1 Material Design System**

**Implement comprehensive design system:**

```scss
// Company Branding Variables
:root {
  --primary-color: #1976d2;
  --secondary-color: #dc004e;
  --company-logo: none;
  --company-name: 'Restaurant App';
}

// Company-specific branding
.company-branded {
  --primary-color: var(--company-primary-color);
  --secondary-color: var(--company-secondary-color);
  --company-logo: var(--company-logo-url);
  --company-name: var(--company-name);
}

// Responsive Design System
@mixin mobile-first {
  @media (max-width: 768px) {
    @content;
  }
}

@mixin tablet {
  @media (min-width: 769px) and (max-width: 1024px) {
    @content;
  }
}

@mixin desktop {
  @media (min-width: 1025px) {
    @content;
  }
}

// Component Design System
.card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 24px;
  margin-bottom: 16px;
  
  @include mobile-first {
    padding: 16px;
    border-radius: 8px;
  }
}

.button-primary {
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 12px 24px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background: darken(var(--primary-color), 10%);
    transform: translateY(-2px);
  }
  
  &:disabled {
    background: #ccc;
    cursor: not-allowed;
    transform: none;
  }
}

// Company Branding Application
.company-header {
  background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
  color: white;
  padding: 24px;
  border-radius: 12px;
  margin-bottom: 24px;
  
  .company-logo {
    width: 60px;
    height: 60px;
    border-radius: 50%;
    background: white;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 16px;
    
    img {
      width: 40px;
      height: 40px;
      object-fit: contain;
    }
  }
  
  .company-name {
    font-size: 24px;
    font-weight: 600;
    margin-bottom: 8px;
  }
  
  .company-info {
    font-size: 14px;
    opacity: 0.9;
  }
}
```

### **5.2 Responsive Layout System**

**Implement mobile-first responsive design:**

```scss
// Layout Components
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 16px;
  
  @include mobile-first {
    padding: 0 12px;
  }
}

.grid {
  display: grid;
  gap: 24px;
  
  &.grid-2 {
    grid-template-columns: repeat(2, 1fr);
    
    @include mobile-first {
      grid-template-columns: 1fr;
    }
  }
  
  &.grid-3 {
    grid-template-columns: repeat(3, 1fr);
    
    @include mobile-first {
      grid-template-columns: 1fr;
    }
    
    @include tablet {
      grid-template-columns: repeat(2, 1fr);
    }
  }
}

.flex {
  display: flex;
  
  &.flex-column {
    flex-direction: column;
  }
  
  &.flex-center {
    align-items: center;
    justify-content: center;
  }
  
  &.flex-between {
    justify-content: space-between;
  }
  
  &.flex-wrap {
    flex-wrap: wrap;
  }
}

// Spacing System
.mt-1 { margin-top: 8px; }
.mt-2 { margin-top: 16px; }
.mt-3 { margin-top: 24px; }
.mt-4 { margin-top: 32px; }

.mb-1 { margin-bottom: 8px; }
.mb-2 { margin-bottom: 16px; }
.mb-3 { margin-bottom: 24px; }
.mb-4 { margin-bottom: 32px; }

.p-1 { padding: 8px; }
.p-2 { padding: 16px; }
.p-3 { padding: 24px; }
.p-4 { padding: 32px; }
```

### **5.3 Component Design Patterns**

**Implement reusable component patterns:**

```typescript
// Base Component Class
export abstract class BaseComponent implements OnInit, OnDestroy {
  protected destroy$ = new Subject<void>();
  loading = false;
  error: string | null = null;

  ngOnInit() {
    this.init();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  protected abstract init(): void;

  protected handleError(error: any, message: string = 'An error occurred') {
    console.error(message, error);
    this.error = message;
    this.loading = false;
  }

  protected showSuccess(message: string) {
    // Implement success notification
  }

  protected showError(message: string) {
    // Implement error notification
  }
}

// Company-Aware Component
export abstract class CompanyAwareComponent extends BaseComponent {
  company: Company | null = null;
  companyId: string | null = null;

  constructor(
    protected companyContext: CompanyContextService,
    protected router: Router
  ) {
    super();
  }

  protected init() {
    this.company = this.companyContext.getCurrentCompany();
    this.companyId = this.company?.id || null;
    
    if (!this.company) {
      this.router.navigate(['/customer/welcome']);
      return;
    }
    
    this.initWithCompany();
  }

  protected abstract initWithCompany(): void;
}
```

---

## 🔒 **Phase 6: Security & Data Isolation**

### **6.1 Company Data Isolation**

**Implement comprehensive data isolation:**

```typescript
// Company Data Isolation Service
@Injectable()
export class CompanyDataIsolationService {
  constructor(private prisma: PrismaService) {}

  // Ensure all queries are company-scoped
  async getCompanyScopedData<T>(
    companyId: string,
    model: string,
    query: any
  ): Promise<T[]> {
    // Add companyId to all queries
    const scopedQuery = {
      ...query,
      where: {
        ...query.where,
        companyId
      }
    };

    return this.prisma[model].findMany(scopedQuery);
  }

  // Validate company access
  async validateCompanyAccess(companyId: string, userId: string): Promise<boolean> {
    const user = await this.prisma.user.findFirst({
      where: {
        id: userId,
        companyId: companyId
      }
    });

    return !!user;
  }

  // Company-scoped create operations
  async createCompanyScopedRecord<T>(
    companyId: string,
    model: string,
    data: any
  ): Promise<T> {
    const scopedData = {
      ...data,
      companyId
    };

    return this.prisma[model].create({
      data: scopedData
    });
  }
}
```

### **6.2 API Security Middleware**

**Implement company-scoped security:**

```typescript
// Company Security Middleware
@Injectable()
export class CompanySecurityMiddleware implements NestMiddleware {
  constructor(
    private companyDataIsolation: CompanyDataIsolationService
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const companyId = req.params.companyId;
    const userId = req.user?.id;

    if (companyId && userId) {
      const hasAccess = await this.companyDataIsolation.validateCompanyAccess(companyId, userId);
      
      if (!hasAccess) {
        throw new ForbiddenException('Access denied to company data');
      }
    }

    next();
  }
}

// Apply middleware to company routes
@Module({
  providers: [CompanySecurityMiddleware],
  exports: [CompanySecurityMiddleware]
})
export class SecurityModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(CompanySecurityMiddleware)
      .forRoutes('companies/:companyId/*');
  }
}
```

---

## 📊 **Phase 7: Testing & Quality Assurance**

### **7.1 Unit Testing Strategy**

**Implement comprehensive testing:**

```typescript
// Company Context Service Tests
describe('CompanyContextService', () => {
  let service: CompanyContextService;
  let apiService: jasmine.SpyObj<CompanyApiService>;

  beforeEach(() => {
    const spy = jasmine.createSpyObj('CompanyApiService', ['getCompany']);
    
    TestBed.configureTestingModule({
      providers: [
        CompanyContextService,
        { provide: CompanyApiService, useValue: spy }
      ]
    });
    
    service = TestBed.inject(CompanyContextService);
    apiService = TestBed.inject(CompanyApiService) as jasmine.SpyObj<CompanyApiService>;
  });

  it('should load company context', async () => {
    const mockCompany = { id: 'test-guid', name: 'Test Restaurant' };
    apiService.getCompany.and.returnValue(of(mockCompany));

    const result = await service.loadCompany('test-guid');
    
    expect(result).toEqual(mockCompany);
    expect(service.getCurrentCompany()).toEqual(mockCompany);
  });

  it('should apply company branding', () => {
    const mockCompany = {
      id: 'test-guid',
      name: 'Test Restaurant',
      primaryColor: '#ff0000',
      secondaryColor: '#00ff00',
      logo: 'test-logo.png'
    };

    service.applyCompanyBranding(mockCompany);
    
    expect(document.documentElement.style.getPropertyValue('--primary-color')).toBe('#ff0000');
    expect(document.documentElement.style.getPropertyValue('--secondary-color')).toBe('#00ff00');
  });
});
```

### **7.2 Integration Testing**

**Test company-scoped functionality:**

```typescript
// Company API Integration Tests
describe('Company API Integration', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    prisma = moduleFixture.get<PrismaService>(PrismaService);
  });

  it('should create company and associated data', async () => {
    const companyData = {
      name: 'Test Restaurant',
      slug: 'test-restaurant',
      primaryColor: '#1976d2'
    };

    const response = await request(app.getHttpServer())
      .post('/api/companies')
      .send(companyData)
      .expect(201);

    expect(response.body).toHaveProperty('id');
    expect(response.body.name).toBe(companyData.name);
  });

  it('should enforce data isolation between companies', async () => {
    // Create two companies
    const company1 = await prisma.company.create({
      data: { name: 'Restaurant 1', slug: 'restaurant-1' }
    });
    
    const company2 = await prisma.company.create({
      data: { name: 'Restaurant 2', slug: 'restaurant-2' }
    });

    // Create tables for each company
    await prisma.table.create({
      data: { companyId: company1.id, number: 1, qrCode: 'qr1' }
    });
    
    await prisma.table.create({
      data: { companyId: company2.id, number: 1, qrCode: 'qr2' }
    });

    // Verify isolation
    const company1Tables = await prisma.table.findMany({
      where: { companyId: company1.id }
    });
    
    const company2Tables = await prisma.table.findMany({
      where: { companyId: company2.id }
    });

    expect(company1Tables).toHaveLength(1);
    expect(company2Tables).toHaveLength(1);
    expect(company1Tables[0].companyId).toBe(company1.id);
    expect(company2Tables[0].companyId).toBe(company2.id);
  });
});
```

---

## 🚀 **Phase 8: Deployment & Migration**

### **8.1 Database Migration Script**

**Create production-ready migration:**

```sql
-- Migration: Add Company GUID System
-- Version: 2.0.0
-- Date: 2024-12-XX

-- Create companies table
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    logo TEXT,
    primary_color VARCHAR(7),
    secondary_color VARCHAR(7),
    address TEXT,
    phone VARCHAR(20),
    email VARCHAR(255),
    website VARCHAR(255),
    timezone VARCHAR(50) DEFAULT 'UTC',
    currency VARCHAR(3) DEFAULT 'ZAR',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create default company
INSERT INTO companies (id, name, slug, is_active) 
VALUES ('00000000-0000-0000-0000-000000000000', 'Default Restaurant', 'default', true);

-- Add company_id to existing tables
ALTER TABLE tables ADD COLUMN company_id UUID REFERENCES companies(id);
ALTER TABLE menu_items ADD COLUMN company_id UUID REFERENCES companies(id);
ALTER TABLE orders ADD COLUMN company_id UUID REFERENCES companies(id);
ALTER TABLE users ADD COLUMN company_id UUID REFERENCES companies(id);
ALTER TABLE customer_sessions ADD COLUMN company_id UUID REFERENCES companies(id);
ALTER TABLE customer_orders ADD COLUMN company_id UUID REFERENCES companies(id);
ALTER TABLE waiter_calls ADD COLUMN company_id UUID REFERENCES companies(id);

-- Migrate existing data to default company
UPDATE tables SET company_id = '00000000-0000-0000-0000-000000000000';
UPDATE menu_items SET company_id = '00000000-0000-0000-0000-000000000000';
UPDATE orders SET company_id = '00000000-0000-0000-0000-000000000000';
UPDATE users SET company_id = '00000000-0000-0000-0000-000000000000';
UPDATE customer_sessions SET company_id = '00000000-0000-0000-0000-000000000000';
UPDATE customer_orders SET company_id = '00000000-0000-0000-0000-000000000000';
UPDATE waiter_calls SET company_id = '00000000-0000-0000-0000-000000000000';

-- Make company_id NOT NULL after migration
ALTER TABLE tables ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE menu_items ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE orders ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE users ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE customer_sessions ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE customer_orders ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE waiter_calls ALTER COLUMN company_id SET NOT NULL;

-- Create indexes for company-scoped queries
CREATE INDEX idx_tables_company_id ON tables(company_id);
CREATE INDEX idx_menu_items_company_id ON menu_items(company_id);
CREATE INDEX idx_orders_company_id ON orders(company_id);
CREATE INDEX idx_users_company_id ON users(company_id);
CREATE INDEX idx_customer_sessions_company_id ON customer_sessions(company_id);
CREATE INDEX idx_customer_orders_company_id ON customer_orders(company_id);
CREATE INDEX idx_waiter_calls_company_id ON waiter_calls(company_id);

-- Create unique constraints for company-scoped data
CREATE UNIQUE INDEX idx_tables_company_number ON tables(company_id, number);
CREATE UNIQUE INDEX idx_companies_slug ON companies(slug);
```

### **8.2 Environment Configuration**

**Configure multi-tenant environment:**

```typescript
// Environment Configuration
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api',
  wsUrl: 'http://localhost:3000',
  defaultCompanyId: '00000000-0000-0000-0000-000000000000',
  qrCodeBaseUrl: 'http://localhost:4200/customer/scan-table',
  fileUploadUrl: 'http://localhost:3000/api/upload',
  maxFileSize: 5 * 1024 * 1024, // 5MB
  supportedImageTypes: ['image/jpeg', 'image/png', 'image/webp'],
  defaultBranding: {
    primaryColor: '#1976d2',
    secondaryColor: '#dc004e',
    logo: '/assets/default-logo.png'
  }
};
```

---

## 📋 **Implementation Checklist**

### **Phase 1: Database & Backend Foundation**
- [ ] Create Company model with GUID
- [ ] Add companyId to all existing models
- [ ] Create database migration scripts
- [ ] Implement company-scoped API endpoints
- [ ] Create Company Context Guard
- [ ] Implement WebSocket room management
- [ ] Add company data isolation service

### **Phase 2: Frontend Architecture**
- [ ] Create CompanyContextService
- [ ] Extend API service for company context
- [ ] Implement company-scoped WebSocket service
- [ ] Create company branding system
- [ ] Implement company switching functionality

### **Phase 3: Customer PWA**
- [ ] Update QR code scanning for company loading
- [ ] Implement company-aware menu component
- [ ] Update cart service for company context
- [ ] Implement company-specific order management
- [ ] Add company branding to customer interface

### **Phase 4: Admin Dashboard**
- [ ] Create company management interface
- [ ] Implement QR code generation system
- [ ] Add company profile management
- [ ] Create company analytics dashboard
- [ ] Implement company user management

### **Phase 5: UI/UX Design**
- [ ] Implement Material Design system
- [ ] Create responsive layout system
- [ ] Implement company branding application
- [ ] Create reusable component patterns
- [ ] Add accessibility features

### **Phase 6: Security & Testing**
- [ ] Implement data isolation middleware
- [ ] Create comprehensive unit tests
- [ ] Implement integration tests
- [ ] Add security validation
- [ ] Create performance tests

### **Phase 7: Deployment**
- [ ] Create production migration scripts
- [ ] Configure environment variables
- [ ] Implement monitoring and logging
- [ ] Create deployment documentation
- [ ] Test production deployment

---

## 🎯 **Success Criteria**

### **Technical Success:**
- [ ] Complete data isolation between companies
- [ ] Real-time updates work per company
- [ ] QR codes load correct company context
- [ ] Company branding applies correctly
- [ ] Performance maintained with multiple companies
- [ ] Security prevents cross-company access

### **User Experience Success:**
- [ ] Customers can scan QR codes and load correct restaurant
- [ ] Staff see only their company's data
- [ ] Admin can manage multiple companies
- [ ] Company branding appears consistently
- [ ] Multi-restaurant customers can switch contexts
- [ ] QR code generation works seamlessly

### **Business Success:**
- [ ] Multiple restaurants can use the platform
- [ ] Data isolation ensures privacy
- [ ] Scalable architecture supports growth
- [ ] SaaS model enables recurring revenue
- [ ] Platform can support franchise chains

---

## 🚀 **Ready to Implement**

This comprehensive implementation prompt provides:

1. **Complete Architecture** - Multi-tenant SaaS design with GUID isolation
2. **Detailed Code Examples** - Ready-to-implement TypeScript/Angular code
3. **Security Implementation** - Data isolation and access control
4. **UI/UX Design System** - Material Design with company branding
5. **Testing Strategy** - Comprehensive testing approach
6. **Deployment Plan** - Production-ready migration and configuration

**The system is designed to be:**
- **Scalable** - Supports unlimited restaurants
- **Secure** - Complete data isolation
- **User-Friendly** - Intuitive interfaces for all users
- **Maintainable** - Clean architecture and code patterns
- **Future-Proof** - Extensible design for additional features

**Start with Phase 1 and work through each phase systematically for a robust, production-ready multi-tenant restaurant management platform!** 🚀✨
